import { getDb, journaliser, nouvelId } from './db';
import type { PageExtraite } from './extract';
import type { StatutDocument } from './types';

const TAILLE_PASSAGE_CIBLE = 1100;
const TAILLE_PASSAGE_MIN = 120;

export interface MetadonneesDocument {
  titre: string;
  source: string;
  url?: string | null;
  datePublication?: string | null;
  statut?: StatutDocument;
  fichier?: string | null;
}

export interface PassageDecoupe {
  ordre: number;
  titreSection: string | null;
  contenu: string;
  page: number | null;
}

function estTitreSection(ligne: string): boolean {
  const l = ligne.trim();
  if (l.length === 0 || l.length > 90) return false;
  if (/^#{1,6}\s+/.test(l)) return true;
  if (/[.;:,]$/.test(l)) return false;
  if (/^\d+(\.\d+)*[.)]?\s+\S/.test(l) && l.length < 80) return true;
  const lettres = l.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (lettres.length >= 6) {
    const majuscules = lettres.replace(/[^A-ZÀ-Þ]/g, '').length;
    if (majuscules / lettres.length > 0.8) return true;
  }
  return false;
}

function nettoyerTitre(ligne: string): string {
  return ligne.replace(/^#{1,6}\s+/, '').trim();
}

// Les PDF coupent les mots en fin de ligne : sans recollage, « légis- lateur »
// n'est trouvable ni par la recherche ni lisible dans une citation.
function recoller(texte: string): string {
  return texte.replace(/(\p{L}{2,})\s?-\s*\n\s*(\p{Ll})/gu, '$1$2');
}

// Une entrée de sommaire ou d'index n'apporte aucune information au conseiller :
// elle ne fait que renvoyer vers une page, et pollue les résultats de recherche.
function estRenvoiDeSommaire(ligne: string): boolean {
  return /\.{4,}|(?:\.\s){4,}/.test(ligne);
}

// Ne vise que les pages d'index restées chargées de numéros : un tableau de mots
// est pauvre en lettres lui aussi, mais doit rester indexé.
function estListeDeRenvois(contenu: string): boolean {
  const lettres = contenu.replace(/[^\p{L}]/gu, '').length;
  const chiffres = contenu.replace(/[^0-9]/g, '').length;
  return lettres / contenu.length < 0.5 && chiffres / contenu.length > 0.15;
}

export function decouperEnPassages(pages: PageExtraite[]): PassageDecoupe[] {
  const passages: PassageDecoupe[] = [];
  let titreCourant: string | null = null;
  let tampon: string[] = [];
  let tailleTampon = 0;
  let pageTampon: number | null = null;

  const vider = () => {
    const contenu = recoller(tampon.join('\n')).trim();
    tampon = [];
    tailleTampon = 0;
    if (contenu.length < TAILLE_PASSAGE_MIN || estListeDeRenvois(contenu)) return;
    passages.push({
      ordre: passages.length,
      titreSection: titreCourant,
      contenu,
      page: pageTampon,
    });
  };

  for (const { page, texte } of pages) {
    const lignes = texte.split(/\r?\n/);
    for (const ligne of lignes) {
      const brut = ligne.trim();
      if (brut.length === 0 || estRenvoiDeSommaire(brut)) continue;

      if (estTitreSection(brut)) {
        vider();
        titreCourant = nettoyerTitre(brut);
        pageTampon = page;
        continue;
      }

      if (tampon.length === 0) pageTampon = page;
      tampon.push(brut);
      tailleTampon += brut.length + 1;

      if (tailleTampon >= TAILLE_PASSAGE_CIBLE) vider();
    }
    if (pages.length > 1) vider();
  }
  vider();

  return passages;
}

export function ingererDocument(
  meta: MetadonneesDocument,
  pages: PageExtraite[],
): { documentId: string; nbPassages: number; remplace: boolean } {
  const db = getDb();
  const passages = decouperEnPassages(pages);

  if (passages.length === 0) {
    throw new Error("Aucun passage exploitable n'a pu être extrait de ce document.");
  }

  const existant = db.prepare('SELECT id FROM documents WHERE titre = ?').get(meta.titre) as
    | { id: string }
    | undefined;

  const documentId = existant?.id ?? nouvelId('doc');

  const tx = db.transaction(() => {
    if (existant) {
      db.prepare('DELETE FROM passages WHERE document_id = ?').run(documentId);
      db.prepare('DELETE FROM documents WHERE id = ?').run(documentId);
    }

    db.prepare(
      `INSERT INTO documents (id, titre, source, url, date_publication, date_ingestion, statut, fichier, nb_passages)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      documentId,
      meta.titre,
      meta.source,
      meta.url ?? null,
      meta.datePublication ?? null,
      new Date().toISOString(),
      meta.statut ?? 'officiel',
      meta.fichier ?? null,
      passages.length,
    );

    const insertPassage = db.prepare(
      `INSERT INTO passages (document_id, ordre, titre_section, contenu, page) VALUES (?, ?, ?, ?, ?)`,
    );
    for (const p of passages) {
      insertPassage.run(documentId, p.ordre, p.titreSection, p.contenu, p.page);
    }
  });

  tx();
  journaliser(existant ? 'document.mise_a_jour' : 'document.ingestion', documentId, meta.titre);

  return { documentId, nbPassages: passages.length, remplace: Boolean(existant) };
}

export function supprimerDocument(documentId: string): boolean {
  const db = getDb();
  const info = db.prepare('DELETE FROM documents WHERE id = ?').run(documentId);
  if (info.changes > 0) journaliser('document.suppression', documentId);
  return info.changes > 0;
}
