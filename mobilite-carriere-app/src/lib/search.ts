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
    .all(construireRequeteFts(tokens), limite * 3) as LigneResultat[];

  const minTokens = tokens.length >= 3 ? Math.ceil(tokens.length * SEUIL_COUVERTURE) : 1;

  return lignes
    .filter((ligne) => {
      const contenu = normaliser(ligne.contenu);
      const presents = tokens.filter((t) => contenu.includes(t)).length;
      return presents >= minTokens;
    })
    .slice(0, limite)
    .map((ligne) => ({
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

export function enregistrerRecherche(requete: string, nbResultats: number) {
  getDb()
    .prepare('INSERT INTO recherches (ts, requete, nb_resultats) VALUES (?, ?, ?)')
    .run(new Date().toISOString(), requete, nbResultats);
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

export function recherchesRecentes(limite = 5): { requete: string; ts: string; nbResultats: number }[] {
  const lignes = getDb()
    .prepare('SELECT requete, ts, nb_resultats FROM recherches ORDER BY id DESC LIMIT ?')
    .all(limite) as { requete: string; ts: string; nb_resultats: number }[];
  return lignes.map((l) => ({ requete: l.requete, ts: l.ts, nbResultats: l.nb_resultats }));
}
