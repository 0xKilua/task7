import { getDb } from './db';
import type { Citation, DocumentSource } from './types';

const SEUIL_COUVERTURE = 0.34;

const MOTS_VIDES = new Set([
  'les', 'des', 'une', 'un', 'le', 'la', 'de', 'du', 'et', 'ou', 'que', 'qui', 'quoi', 'dans',
  'pour', 'par', 'sur', 'avec', 'sans', 'est', 'sont', 'ete', 'etre', 'aux', 'ses', 'son', 'sa',
  'mes', 'mon', 'ma', 'ce', 'cet', 'cette', 'ces', 'il', 'elle', 'ils', 'elles', 'je', 'tu',
  'nous', 'vous', 'plus', 'moins', 'tout', 'tous', 'toute', 'toutes', 'quel', 'quelle', 'quels',
  'quelles', 'comment', 'pourquoi', 'peut', 'peuvent', 'faire', 'fait', 'mais', 'donc', 'car',
  'si', 'ne', 'pas', 'en', 'au', 'y', 'a', 'me', 'te', 'se', 'lui', 'leur', 'leurs', 'dont',
]);

export function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function extraireTokens(requete: string): string[] {
  return normaliser(requete)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !MOTS_VIDES.has(t));
}

function construireRequeteFts(tokens: string[]): string {
  return tokens.map((t) => `"${t.replace(/"/g, '')}"*`).join(' OR ');
}

interface LigneResultat {
  passage_id: number;
  document_id: string;
  titre_section: string | null;
  page: number | null;
  contenu: string;
  extrait: string;
  score: number;
  titre: string;
  source: string;
  url: string | null;
  date_publication: string | null;
  statut: string;
}

export function rechercherPassages(requete: string, limite = 8): Citation[] {
  const tokens = extraireTokens(requete);
  if (tokens.length === 0) return [];

  const db = getDb();
  const lignes = db
    .prepare(
      `SELECT p.id AS passage_id, p.document_id, p.titre_section, p.page, p.contenu,
              snippet(passages_fts, 0, char(1), char(2), '…', 28) AS extrait,
              bm25(passages_fts) AS score,
              d.titre, d.source, d.url, d.date_publication, d.statut
         FROM passages_fts
         JOIN passages p ON p.id = passages_fts.rowid
         JOIN documents d ON d.id = p.document_id
        WHERE passages_fts MATCH ?
        ORDER BY score
        LIMIT ?`,
    )
    .all(construireRequeteFts(tokens), limite * 4) as LigneResultat[];

  const minTokens = tokens.length >= 3 ? Math.ceil(tokens.length * SEUIL_COUVERTURE) : 1;

  return lignes
    .map((ligne) => {
      const contenu = normaliser(ligne.contenu);
      return { ligne, couverture: tokens.filter((t) => contenu.includes(t)).length };
    })
    .filter((r) => r.couverture >= minTokens)
    // Un passage contenant tous les termes recherchés répond mieux qu'un passage
    // très bien classé sur un seul d'entre eux.
    .sort((a, b) => b.couverture - a.couverture || a.ligne.score - b.ligne.score)
    .filter(dedoublonner())
    .slice(0, limite)
    .map(({ ligne }) => ({
      passageId: ligne.passage_id,
      documentId: ligne.document_id,
      documentTitre: ligne.titre,
      source: ligne.source,
      url: ligne.url,
      datePublication: ligne.date_publication,
      statut: ligne.statut === 'officiel' ? 'officiel' : 'a_verifier',
      titreSection: ligne.titre_section,
      page: ligne.page,
      extrait: ligne.extrait,
      score: ligne.score,
    }));
}

// Un même contenu se répète d'une page à l'autre dans les documents maquettés :
// le conseiller n'a pas besoin de le lire deux fois.
function dedoublonner() {
  const vus = new Set<string>();
  return ({ ligne }: { ligne: LigneResultat }) => {
    // Empreinte sur l'intégralité du passage : deux passages distincts partageant
    // la même accroche doivent rester visibles tous les deux.
    const empreinte = normaliser(ligne.contenu).replace(/[^a-z0-9]/g, '');
    if (vus.has(empreinte)) return false;
    vus.add(empreinte);
    return true;
  };
}

export function enregistrerRecherche(conseillerId: string, requete: string, nbResultats: number) {
  getDb()
    .prepare('INSERT INTO recherches (conseiller_id, ts, requete, nb_resultats) VALUES (?, ?, ?, ?)')
    .run(conseillerId, new Date().toISOString(), requete, nbResultats);
}

export function listerDocuments(): DocumentSource[] {
  const lignes = getDb()
    .prepare('SELECT * FROM documents ORDER BY date_ingestion DESC')
    .all() as Record<string, string | number | null>[];

  return lignes.map((l) => ({
    id: String(l.id),
    titre: String(l.titre),
    source: String(l.source),
    url: l.url ? String(l.url) : null,
    datePublication: l.date_publication ? String(l.date_publication) : null,
    dateIngestion: String(l.date_ingestion),
    statut: l.statut === 'officiel' ? 'officiel' : 'a_verifier',
    fichier: l.fichier ? String(l.fichier) : null,
    nbPassages: Number(l.nb_passages),
  }));
}

export function baseDocumentaireVide(): boolean {
  const row = getDb().prepare('SELECT COUNT(*) AS n FROM documents').get() as { n: number };
  return row.n === 0;
}

export function recherchesRecentes(
  conseillerId: string,
  limite = 5,
): { requete: string; ts: string; nbResultats: number }[] {
  const lignes = getDb()
    .prepare('SELECT requete, ts, nb_resultats FROM recherches WHERE conseiller_id = ? ORDER BY id DESC LIMIT ?')
    .all(conseillerId, limite) as { requete: string; ts: string; nb_resultats: number }[];
  return lignes.map((l) => ({ requete: l.requete, ts: l.ts, nbResultats: l.nb_resultats }));
}
