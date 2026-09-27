import { getDb, journaliser } from './db';

// Les durées sont fixées par l'administration avec son DPO (registre des traitements) :
// l'application n'en impose aucune par défaut, et ne supprime rien tant qu'elles ne sont
// pas renseignées.
export interface PolitiqueConservation {
  moisDossiersClos: number | null;
  moisJournal: number | null;
}

export const MOIS_MAX = 120;

const CLES: Record<keyof PolitiqueConservation, string> = {
  moisDossiersClos: 'conservation.dossiers_clos_mois',
  moisJournal: 'conservation.journal_mois',
};

function lireMois(cle: string): number | null {
  const ligne = getDb().prepare('SELECT valeur FROM parametres WHERE cle = ?').get(cle) as
    | { valeur: string }
    | undefined;
  const mois = ligne ? Number(ligne.valeur) : Number.NaN;
  return Number.isInteger(mois) && mois >= 1 && mois <= MOIS_MAX ? mois : null;
}

export function lirePolitique(): PolitiqueConservation {
  return { moisDossiersClos: lireMois(CLES.moisDossiersClos), moisJournal: lireMois(CLES.moisJournal) };
}

export function enregistrerPolitique(politique: PolitiqueConservation, acteurId: string) {
  const db = getDb();
  db.transaction(() => {
    for (const champ of Object.keys(CLES) as (keyof PolitiqueConservation)[]) {
      const valeur = politique[champ];
      if (valeur === null) db.prepare('DELETE FROM parametres WHERE cle = ?').run(CLES[champ]);
      else
        db.prepare(
          'INSERT INTO parametres (cle, valeur) VALUES (?, ?) ON CONFLICT(cle) DO UPDATE SET valeur = excluded.valeur',
        ).run(CLES[champ], String(valeur));
    }
  })();
  journaliser(
    'conservation.politique',
    undefined,
    `accompagnements clos : ${politique.moisDossiersClos ?? 'non fixée'} ; journal : ${politique.moisJournal ?? 'non fixée'} (mois)`,
    acteurId,
  );
}

function il_y_a(mois: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - mois);
  return date.toISOString();
}

const SQL_DOSSIERS_ECHUS =
  "FROM dossiers WHERE statut = 'clos' AND date_cloture IS NOT NULL AND date_cloture < ?";

export function apercuPurge(politique = lirePolitique()): { dossiers: number; journal: number } {
  const db = getDb();
  const compter = (sql: string, limite: string) => (db.prepare(sql).get(limite) as { n: number }).n;
  return {
    dossiers:
      politique.moisDossiersClos === null
        ? 0
        : compter(`SELECT COUNT(*) AS n ${SQL_DOSSIERS_ECHUS}`, il_y_a(politique.moisDossiersClos)),
    journal:
      politique.moisJournal === null
        ? 0
        : compter('SELECT COUNT(*) AS n FROM journal WHERE ts < ?', il_y_a(politique.moisJournal)),
  };
}

// La suppression d'un dossier emporte, par cascade, fiches, bilans, plan, notes et trames.
export function appliquerPurge(acteurId: string): { dossiers: number; journal: number } {
  const politique = lirePolitique();
  const db = getDb();
  const resultat = db.transaction(() => {
    const dossiers =
      politique.moisDossiersClos === null
        ? 0
        : db.prepare(`DELETE ${SQL_DOSSIERS_ECHUS}`).run(il_y_a(politique.moisDossiersClos)).changes;
    const journal =
      politique.moisJournal === null
        ? 0
        : db.prepare('DELETE FROM journal WHERE ts < ?').run(il_y_a(politique.moisJournal)).changes;
    // Données techniques devenues inutiles, quelle que soit la politique fixée.
    db.prepare('DELETE FROM sessions WHERE expire_le < ?').run(new Date().toISOString());
    db.prepare('DELETE FROM tentatives_connexion WHERE ts < ?').run(
      new Date(Date.now() - 86_400_000).toISOString(),
    );
    return { dossiers, journal };
  })();
  journaliser(
    'conservation.purge',
    undefined,
    `${resultat.dossiers} accompagnement(s) clos, ${resultat.journal} entrée(s) de journal`,
    acteurId,
  );
  return resultat;
}

export function dernierePurge(): { ts: string; details: string | null } | null {
  return (
    (getDb()
      .prepare("SELECT ts, details FROM journal WHERE action = 'conservation.purge' ORDER BY id DESC LIMIT 1")
      .get() as { ts: string; details: string | null } | undefined) ?? null
  );
}
