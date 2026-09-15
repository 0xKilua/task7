import { getDb } from './db';
import { extraireTokens, normaliser } from './search';
import type { Dispositif } from './types';

type LigneDispositif = Record<string, string | null>;

function versDispositif(l: LigneDispositif): Dispositif {
  return {
    id: String(l.id),
    nom: String(l.nom),
    categorie: String(l.categorie),
    objectif: l.objectif,
    publicConcerne: l.public_concerne,
    conditions: l.conditions,
    demarches: l.demarches,
    acteurs: l.acteurs,
    pointsVigilance: l.points_vigilance,
    ressources: l.ressources,
    dateInformation: l.date_information,
    source: l.source,
    statutVerification: l.statut_verification === 'verifie_source' ? 'verifie_source' : 'non_verifie',
  };
}

export function listerDispositifs(categorie?: string, recherche?: string): Dispositif[] {
  const db = getDb();
  let sql = 'SELECT * FROM dispositifs';
  const params: string[] = [];
  const conditions: string[] = [];

  if (categorie) {
    conditions.push('categorie = ?');
    params.push(categorie);
  }
  if (recherche && recherche.trim().length > 0) {
    conditions.push('(LOWER(nom) LIKE ? OR LOWER(categorie) LIKE ?)');
    const motif = `%${recherche.trim().toLowerCase()}%`;
    params.push(motif, motif);
  }
  if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
  sql += ' ORDER BY categorie, nom';

  return (db.prepare(sql).all(...params) as LigneDispositif[]).map(versDispositif);
}

export function obtenirDispositif(id: string): Dispositif | null {
  const ligne = getDb().prepare('SELECT * FROM dispositifs WHERE id = ?').get(id) as
    | LigneDispositif
    | undefined;
  return ligne ? versDispositif(ligne) : null;
}

export function listerCategories(): string[] {
  const lignes = getDb()
    .prepare('SELECT DISTINCT categorie FROM dispositifs ORDER BY categorie')
    .all() as { categorie: string }[];
  return lignes.map((l) => l.categorie);
}

export function dispositifsPertinents(requete: string, limite = 5): Dispositif[] {
  const tokens = extraireTokens(requete);
  if (tokens.length === 0) return [];

  const tous = listerDispositifs();
  return tous
    .map((d) => {
      const cible = normaliser(`${d.nom} ${d.categorie}`);
      const score = tokens.filter((t) => cible.includes(t)).length;
      return { dispositif: d, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limite)
    .map((r) => r.dispositif);
}

export function compterDispositifs(): { total: number; documentes: number } {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN statut_verification = 'verifie_source' THEN 1 ELSE 0 END) AS documentes
         FROM dispositifs`,
    )
    .get() as { total: number; documentes: number | null };
  return { total: row.total, documentes: row.documentes ?? 0 };
}
