import { getDb, journaliser, nouvelId } from './db';
import type { Bilan, Diagnostic, Dossier, PlanAccompagnement } from './types';

export const CHAMPS_DIAGNOSTIC: { cle: string; libelle: string; aide?: string }[] = [
  { cle: 'situationProfessionnelle', libelle: 'Situation professionnelle actuelle' },
  { cle: 'corpsGradeEmploi', libelle: 'Corps / grade / emploi', aide: 'Lorsque pertinent' },
  { cle: 'administration', libelle: 'Administration ou environnement professionnel' },
  { cle: 'anciennete', libelle: 'Ancienneté' },
  { cle: 'competences', libelle: 'Compétences identifiées' },
  { cle: 'experiences', libelle: 'Expériences' },
  { cle: 'souhaitsEvolution', libelle: "Souhaits d'évolution" },
  { cle: 'contraintes', libelle: 'Contraintes exprimées' },
  { cle: 'motivations', libelle: 'Motivations' },
  { cle: 'besoinsFormation', libelle: 'Besoins de formation' },
  { cle: 'mobiliteGeographique', libelle: 'Mobilité géographique envisagée' },
  { cle: 'mobiliteFonctionnelle', libelle: 'Mobilité fonctionnelle envisagée' },
  { cle: 'projetProfessionnel', libelle: 'Projet professionnel' },
  { cle: 'echeance', libelle: 'Échéance ou horizon du projet' },
];

export const ETAPES_BILAN: { cle: string; libelle: string }[] = [
  { cle: 'parcours', libelle: 'Parcours' },
  { cle: 'experiencesSignificatives', libelle: 'Expériences significatives' },
  { cle: 'competences', libelle: 'Compétences' },
  { cle: 'realisations', libelle: 'Réalisations' },
  { cle: 'motivations', libelle: 'Motivations' },
  { cle: 'centresInteret', libelle: 'Centres d’intérêt professionnels' },
  { cle: 'pointsAppui', libelle: "Points d'appui" },
  { cle: 'difficultes', libelle: 'Difficultés ou freins' },
  { cle: 'souhaitsEvolution', libelle: "Souhaits d'évolution" },
  { cle: 'pistesProfessionnelles', libelle: 'Pistes professionnelles envisageables' },
  { cle: 'besoinsDeveloppement', libelle: 'Besoins de développement des compétences' },
  { cle: 'prochainesEtapes', libelle: 'Prochaines étapes' },
];

type Ligne = Record<string, string>;

function versDossier(l: Ligne): Dossier {
  return {
    id: l.id,
    reference: l.reference,
    intitule: l.intitule ?? null,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  };
}

export function creerDossier(reference: string, intitule?: string): Dossier {
  const db = getDb();
  const now = new Date().toISOString();
  const id = nouvelId('dos');
  db.prepare(
    'INSERT INTO dossiers (id, reference, intitule, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, reference, intitule ?? null, now, now);
  journaliser('dossier.creation', id, reference);
  return { id, reference, intitule: intitule ?? null, createdAt: now, updatedAt: now };
}

export function listerDossiers(limite = 50): Dossier[] {
  const lignes = getDb()
    .prepare('SELECT * FROM dossiers ORDER BY updated_at DESC LIMIT ?')
    .all(limite) as Ligne[];
  return lignes.map(versDossier);
}

export function obtenirDossier(id: string): Dossier | null {
  const ligne = getDb().prepare('SELECT * FROM dossiers WHERE id = ?').get(id) as Ligne | undefined;
  return ligne ? versDossier(ligne) : null;
}

export function supprimerDossier(id: string): boolean {
  const info = getDb().prepare('DELETE FROM dossiers WHERE id = ?').run(id);
  if (info.changes > 0) journaliser('dossier.suppression', id);
  return info.changes > 0;
}

function toucherDossier(dossierId: string) {
  getDb()
    .prepare('UPDATE dossiers SET updated_at = ? WHERE id = ?')
    .run(new Date().toISOString(), dossierId);
}

export function construireSynthese(
  titre: string,
  champs: { cle: string; libelle: string }[],
  payload: Record<string, string>,
): string {
  const lignes = [titre.toUpperCase(), '='.repeat(titre.length), ''];
  const renseignes = champs.filter((c) => (payload[c.cle] ?? '').trim().length > 0);
  const manquants = champs.filter((c) => (payload[c.cle] ?? '').trim().length === 0);

  for (const champ of renseignes) {
    lignes.push(`${champ.libelle} :`);
    lignes.push(`  ${payload[champ.cle].trim().replace(/\n/g, '\n  ')}`);
    lignes.push('');
  }

  if (manquants.length > 0) {
    lignes.push('Éléments non renseignés à ce stade :');
    lignes.push(`  ${manquants.map((c) => c.libelle).join(', ')}.`);
    lignes.push('');
  }

  lignes.push(
    'Synthèse construite à partir des seuls éléments saisis par le conseiller. ' +
      "Elle ne constitue ni un avis réglementaire, ni une décision administrative.",
  );

  return lignes.join('\n');
}

export function enregistrerDiagnostic(
  dossierId: string,
  payload: Record<string, string>,
): Diagnostic {
  const db = getDb();
  const id = nouvelId('diag');
  const now = new Date().toISOString();
  const synthese = construireSynthese('Synthèse de situation', CHAMPS_DIAGNOSTIC, payload);

  db.prepare(
    'INSERT INTO diagnostics (id, dossier_id, payload, synthese, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, dossierId, JSON.stringify(payload), synthese, now);
  toucherDossier(dossierId);
  journaliser('diagnostic.creation', id, dossierId);

  return { id, dossierId, payload, synthese, createdAt: now };
}

export function enregistrerBilan(dossierId: string, payload: Record<string, string>): Bilan {
  const db = getDb();
  const id = nouvelId('bil');
  const now = new Date().toISOString();
  const synthese = construireSynthese('Synthèse de bilan de parcours', ETAPES_BILAN, payload);

  db.prepare(
    'INSERT INTO bilans (id, dossier_id, payload, synthese, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, dossierId, JSON.stringify(payload), synthese, now);
  toucherDossier(dossierId);
  journaliser('bilan.creation', id, dossierId);

  return { id, dossierId, payload, synthese, createdAt: now };
}

export function dernierDiagnostic(dossierId: string): Diagnostic | null {
  const l = getDb()
    .prepare('SELECT * FROM diagnostics WHERE dossier_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(dossierId) as Ligne | undefined;
  if (!l) return null;
  return {
    id: l.id,
    dossierId: l.dossier_id,
    payload: JSON.parse(l.payload),
    synthese: l.synthese,
    createdAt: l.created_at,
  };
}

export function dernierBilan(dossierId: string): Bilan | null {
  const l = getDb()
    .prepare('SELECT * FROM bilans WHERE dossier_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(dossierId) as Ligne | undefined;
  if (!l) return null;
  return {
    id: l.id,
    dossierId: l.dossier_id,
    payload: JSON.parse(l.payload),
    synthese: l.synthese,
    createdAt: l.created_at,
  };
}

export function bilansEnCours(): { dossier: Dossier; createdAt: string }[] {
  const lignes = getDb()
    .prepare(
      `SELECT d.*, b.created_at AS bilan_created
         FROM bilans b JOIN dossiers d ON d.id = b.dossier_id
        ORDER BY b.created_at DESC LIMIT 5`,
    )
    .all() as Ligne[];
  return lignes.map((l) => ({ dossier: versDossier(l), createdAt: l.bilan_created }));
}

export function enregistrerPlan(
  dossierId: string,
  plan: Omit<PlanAccompagnement, 'id' | 'dossierId' | 'createdAt' | 'updatedAt'>,
): PlanAccompagnement {
  const db = getDb();
  const existant = db.prepare('SELECT id, created_at FROM plans WHERE dossier_id = ?').get(dossierId) as
    | { id: string; created_at: string }
    | undefined;

  const now = new Date().toISOString();
  const id = existant?.id ?? nouvelId('plan');
  const createdAt = existant?.created_at ?? now;

  if (existant) {
    db.prepare('UPDATE plans SET payload = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(plan),
      now,
      id,
    );
  } else {
    db.prepare(
      'INSERT INTO plans (id, dossier_id, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    ).run(id, dossierId, JSON.stringify(plan), now, now);
  }

  toucherDossier(dossierId);
  journaliser(existant ? 'plan.mise_a_jour' : 'plan.creation', id, dossierId);

  return { id, dossierId, ...plan, createdAt, updatedAt: now };
}

export function obtenirPlan(dossierId: string): PlanAccompagnement | null {
  const l = getDb().prepare('SELECT * FROM plans WHERE dossier_id = ?').get(dossierId) as
    | Ligne
    | undefined;
  if (!l) return null;
  return {
    id: l.id,
    dossierId: l.dossier_id,
    ...JSON.parse(l.payload),
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  };
}

export function statistiques() {
  const db = getDb();
  const get = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  return {
    dossiers: get('SELECT COUNT(*) AS n FROM dossiers'),
    diagnostics: get('SELECT COUNT(*) AS n FROM diagnostics'),
    bilans: get('SELECT COUNT(*) AS n FROM bilans'),
    plans: get('SELECT COUNT(*) AS n FROM plans'),
    documents: get('SELECT COUNT(*) AS n FROM documents'),
    passages: get('SELECT COUNT(*) AS n FROM passages'),
  };
}
