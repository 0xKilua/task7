import { notFound } from 'next/navigation';
import { getDb, journaliser, nouvelId } from './db';
import type {
  Bilan,
  Diagnostic,
  Dossier,
  ModaliteSuivi,
  NoteSuivi,
  PlanAccompagnement,
  StatutDossier,
} from './types';
import { LIBELLES_MODALITE, LIBELLES_STATUT } from './types';

export const JOURS_SANS_ACTIVITE = 30;
const LONGUEUR_NOTE_MAX = 5000;

// Erreur due à une saisie du conseiller, affichable telle quelle. Les actions serveur
// n'interceptent que celle-ci : notFound() et redirect() doivent continuer de remonter.
export class ErreurSaisie extends Error {}

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

export function estStatut(valeur: string): valeur is StatutDossier {
  return Object.hasOwn(LIBELLES_STATUT, valeur);
}

export function estModalite(valeur: string): valeur is ModaliteSuivi {
  return Object.hasOwn(LIBELLES_MODALITE, valeur);
}

function versDossier(l: Ligne): Dossier {
  return {
    id: l.id,
    reference: l.reference,
    intitule: l.intitule ?? null,
    statut: estStatut(l.statut) ? l.statut : 'en_cours',
    prochainRdv: l.prochain_rdv ?? null,
    dateCloture: l.date_cloture ?? null,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  };
}

const deuxChiffres = (n: number) => String(n).padStart(2, '0');

// Les rendez-vous sont saisis et comparés en heure locale du poste, comme le renvoie
// <input type="datetime-local"> : pas de conversion UTC qui décalerait l'heure affichée.
export function maintenantLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${deuxChiffres(d.getMonth() + 1)}-${deuxChiffres(d.getDate())}T${deuxChiffres(d.getHours())}:${deuxChiffres(d.getMinutes())}`;
}

export function aujourdhuiLocal(): string {
  return maintenantLocal().slice(0, 10);
}

// Contrôle par plages plutôt que par Date : un 30 février ou un 25:00 sont refusés sans que
// le passage à l'heure d'été ne fasse rejeter une heure pourtant valide.
export function dateValide(texte: string, avecHeure: boolean): boolean {
  const motif = avecHeure ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/ : /^(\d{4})-(\d{2})-(\d{2})$/;
  const m = motif.exec(texte);
  if (!m) return false;
  const [annee, mois, jour, heure = 0, minute = 0] = m.slice(1).map(Number);
  const joursDuMois = new Date(annee, mois, 0).getDate();
  return (
    annee >= 2000 &&
    annee <= 2100 &&
    mois >= 1 &&
    mois <= 12 &&
    jour >= 1 &&
    jour <= joursDuMois &&
    heure <= 23 &&
    minute <= 59
  );
}

export function creerDossier(conseillerId: string, reference: string, intitule?: string): Dossier {
  const db = getDb();
  const now = new Date().toISOString();
  const id = nouvelId('dos');
  db.prepare(
    'INSERT INTO dossiers (id, conseiller_id, reference, intitule, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, conseillerId, reference, intitule ?? null, now, now);
  journaliser('dossier.creation', id, undefined, conseillerId);
  return {
    id,
    reference,
    intitule: intitule ?? null,
    statut: 'en_cours',
    prochainRdv: null,
    dateCloture: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function listerDossiers(conseillerId: string, limite = 50, statut?: StatutDossier): Dossier[] {
  const lignes = statut
    ? (getDb()
        .prepare(
          'SELECT * FROM dossiers WHERE conseiller_id = ? AND statut = ? ORDER BY updated_at DESC LIMIT ?',
        )
        .all(conseillerId, statut, limite) as Ligne[])
    : (getDb()
        .prepare('SELECT * FROM dossiers WHERE conseiller_id = ? ORDER BY updated_at DESC LIMIT ?')
        .all(conseillerId, limite) as Ligne[]);
  return lignes.map(versDossier);
}

// Toute lecture et toute écriture passe par cette vérification : un dossier n'est jamais
// accessible à un autre conseiller, administrateur compris.
export function obtenirDossier(id: string, conseillerId: string): Dossier | null {
  const ligne = getDb()
    .prepare('SELECT * FROM dossiers WHERE id = ? AND conseiller_id = ?')
    .get(id, conseillerId) as Ligne | undefined;
  return ligne ? versDossier(ligne) : null;
}

export function exigerDossier(id: string, conseillerId: string): Dossier {
  const dossier = obtenirDossier(id, conseillerId);
  if (!dossier) notFound();
  return dossier;
}

export function supprimerDossier(id: string, conseillerId: string): boolean {
  const info = getDb()
    .prepare('DELETE FROM dossiers WHERE id = ? AND conseiller_id = ?')
    .run(id, conseillerId);
  if (info.changes > 0) journaliser('dossier.suppression', id, undefined, conseillerId);
  return info.changes > 0;
}

export function mettreAJourSuivi(
  dossierId: string,
  conseillerId: string,
  statut: string,
  prochainRdv: string | null,
) {
  exigerDossier(dossierId, conseillerId);
  if (!estStatut(statut)) throw new ErreurSaisie('Statut inconnu.');
  if (prochainRdv !== null && !dateValide(prochainRdv, true)) {
    throw new ErreurSaisie('Date de rendez-vous invalide.');
  }
  // Un accompagnement clos n'a plus de rendez-vous à venir.
  const rdv = statut === 'clos' ? null : prochainRdv;
  const maintenant = new Date().toISOString();
  // La date de clôture d'origine est conservée : c'est d'elle que court la durée de conservation.
  getDb()
    .prepare(
      `UPDATE dossiers SET statut = ?, prochain_rdv = ?, updated_at = ?,
              date_cloture = CASE WHEN ? = 'clos' THEN COALESCE(date_cloture, ?) ELSE NULL END
        WHERE id = ? AND conseiller_id = ?`,
    )
    .run(statut, rdv, maintenant, statut, maintenant, dossierId, conseillerId);
  journaliser('dossier.suivi', dossierId, statut, conseillerId);
}

export function ajouterNoteSuivi(
  dossierId: string,
  conseillerId: string,
  dateEchange: string,
  modalite: string,
  contenu: string,
): NoteSuivi {
  exigerDossier(dossierId, conseillerId);
  if (!dateValide(dateEchange, false)) throw new ErreurSaisie("Date de l'échange invalide.");
  if (!estModalite(modalite)) throw new ErreurSaisie('Modalité inconnue.');
  const texte = contenu.trim();
  if (texte.length === 0) throw new ErreurSaisie('Le compte rendu est vide.');
  if (texte.length > LONGUEUR_NOTE_MAX) {
    throw new ErreurSaisie(`Le compte rendu dépasse ${LONGUEUR_NOTE_MAX} caractères.`);
  }

  const id = nouvelId('note');
  const now = new Date().toISOString();
  getDb()
    .prepare(
      'INSERT INTO notes_suivi (id, dossier_id, date_echange, modalite, contenu, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .run(id, dossierId, dateEchange, modalite, texte, now);
  toucherDossier(dossierId);
  journaliser('suivi.note_ajout', id, dossierId, conseillerId);
  return { id, dossierId, dateEchange, modalite, contenu: texte, createdAt: now };
}

export function listerNotesSuivi(dossierId: string, conseillerId: string): NoteSuivi[] {
  exigerDossier(dossierId, conseillerId);
  const lignes = getDb()
    .prepare('SELECT * FROM notes_suivi WHERE dossier_id = ? ORDER BY date_echange DESC, created_at DESC')
    .all(dossierId) as Ligne[];
  return lignes.map((l) => ({
    id: l.id,
    dossierId: l.dossier_id,
    dateEchange: l.date_echange,
    modalite: estModalite(l.modalite) ? l.modalite : 'autre',
    contenu: l.contenu,
    createdAt: l.created_at,
  }));
}

export function supprimerNoteSuivi(noteId: string, dossierId: string, conseillerId: string): boolean {
  exigerDossier(dossierId, conseillerId);
  const info = getDb()
    .prepare('DELETE FROM notes_suivi WHERE id = ? AND dossier_id = ?')
    .run(noteId, dossierId);
  if (info.changes > 0) {
    toucherDossier(dossierId);
    journaliser('suivi.note_suppression', noteId, dossierId, conseillerId);
  }
  return info.changes > 0;
}

export function rendezVousAVenir(conseillerId: string, limite = 5): Dossier[] {
  const lignes = getDb()
    .prepare(
      `SELECT * FROM dossiers
        WHERE conseiller_id = ? AND statut != 'clos'
          AND prochain_rdv IS NOT NULL AND prochain_rdv >= ?
        ORDER BY prochain_rdv ASC LIMIT ?`,
    )
    .all(conseillerId, maintenantLocal(), limite) as Ligne[];
  return lignes.map(versDossier);
}

export type MotifRelance = 'rdv_passe' | 'sans_activite';

// Un accompagnement actif a besoin d'une action du conseiller quand son rendez-vous est passé
// sans que le suivi ait été mis à jour, ou quand rien n'a bougé depuis longtemps sans
// qu'aucun rendez-vous ne soit prévu.
export function dossiersARelancer(
  conseillerId: string,
  limite = 5,
): { dossier: Dossier; motif: MotifRelance }[] {
  const seuil = new Date(Date.now() - JOURS_SANS_ACTIVITE * 86_400_000).toISOString();
  const lignes = getDb()
    .prepare(
      `SELECT * FROM dossiers
        WHERE conseiller_id = ? AND statut != 'clos'
          AND ((prochain_rdv IS NOT NULL AND prochain_rdv < ?)
               OR (prochain_rdv IS NULL AND updated_at < ?))
        ORDER BY COALESCE(prochain_rdv, updated_at) ASC LIMIT ?`,
    )
    .all(conseillerId, maintenantLocal(), seuil, limite) as Ligne[];
  return lignes.map((l) => ({
    dossier: versDossier(l),
    motif: l.prochain_rdv ? 'rdv_passe' : 'sans_activite',
  }));
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
  conseillerId: string,
  payload: Record<string, string>,
): Diagnostic {
  exigerDossier(dossierId, conseillerId);
  const db = getDb();
  const id = nouvelId('diag');
  const now = new Date().toISOString();
  const synthese = construireSynthese('Synthèse de situation', CHAMPS_DIAGNOSTIC, payload);

  db.prepare(
    'INSERT INTO diagnostics (id, dossier_id, payload, synthese, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, dossierId, JSON.stringify(payload), synthese, now);
  toucherDossier(dossierId);
  journaliser('diagnostic.creation', id, dossierId, conseillerId);

  return { id, dossierId, payload, synthese, createdAt: now };
}

export function enregistrerBilan(
  dossierId: string,
  conseillerId: string,
  payload: Record<string, string>,
): Bilan {
  exigerDossier(dossierId, conseillerId);
  const db = getDb();
  const id = nouvelId('bil');
  const now = new Date().toISOString();
  const synthese = construireSynthese('Synthèse de bilan de parcours', ETAPES_BILAN, payload);

  db.prepare(
    'INSERT INTO bilans (id, dossier_id, payload, synthese, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, dossierId, JSON.stringify(payload), synthese, now);
  toucherDossier(dossierId);
  journaliser('bilan.creation', id, dossierId, conseillerId);

  return { id, dossierId, payload, synthese, createdAt: now };
}

export function dernierDiagnostic(dossierId: string, conseillerId: string): Diagnostic | null {
  exigerDossier(dossierId, conseillerId);
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

export function dernierBilan(dossierId: string, conseillerId: string): Bilan | null {
  exigerDossier(dossierId, conseillerId);
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

export function bilansEnCours(conseillerId: string): { dossier: Dossier; createdAt: string }[] {
  const lignes = getDb()
    .prepare(
      `SELECT d.*, b.created_at AS bilan_created
         FROM bilans b JOIN dossiers d ON d.id = b.dossier_id
        WHERE d.conseiller_id = ?
        ORDER BY b.created_at DESC LIMIT 5`,
    )
    .all(conseillerId) as Ligne[];
  return lignes.map((l) => ({ dossier: versDossier(l), createdAt: l.bilan_created }));
}

export function enregistrerPlan(
  dossierId: string,
  conseillerId: string,
  plan: Omit<PlanAccompagnement, 'id' | 'dossierId' | 'createdAt' | 'updatedAt'>,
): PlanAccompagnement {
  exigerDossier(dossierId, conseillerId);
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
  journaliser(existant ? 'plan.mise_a_jour' : 'plan.creation', id, dossierId, conseillerId);

  return { id, dossierId, ...plan, createdAt, updatedAt: now };
}

export function obtenirPlan(dossierId: string, conseillerId: string): PlanAccompagnement | null {
  exigerDossier(dossierId, conseillerId);
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

export function statistiques(conseillerId: string) {
  const db = getDb();
  const get = (sql: string, ...params: string[]) => (db.prepare(sql).get(...params) as { n: number }).n;
  const parDossier = (table: string) =>
    get(
      `SELECT COUNT(*) AS n FROM ${table} t JOIN dossiers d ON d.id = t.dossier_id WHERE d.conseiller_id = ?`,
      conseillerId,
    );

  return {
    dossiers: get('SELECT COUNT(*) AS n FROM dossiers WHERE conseiller_id = ?', conseillerId),
    dossiersActifs: get(
      "SELECT COUNT(*) AS n FROM dossiers WHERE conseiller_id = ? AND statut != 'clos'",
      conseillerId,
    ),
    diagnostics: parDossier('diagnostics'),
    bilans: parDossier('bilans'),
    plans: parDossier('plans'),
    // La base documentaire est commune à tous les conseillers.
    documents: get('SELECT COUNT(*) AS n FROM documents'),
    passages: get('SELECT COUNT(*) AS n FROM passages'),
  };
}

const RUBRIQUES_PLAN_EXPORT: [keyof PlanAccompagnement, string][] = [
  ['constats', 'Constats'],
  ['objectifs', "Objectifs de l'agent"],
  ['pistes', 'Pistes à explorer'],
  ['dispositifs', 'Dispositifs potentiellement pertinents'],
  ['aVerifier', 'Informations restant à vérifier'],
  ['actions', 'Actions à réaliser'],
  ['ressources', 'Ressources à consulter'],
  ['echeances', 'Échéances'],
  ['prochainesEtapes', 'Prochaines étapes'],
];

// Toutes les données d'un accompagnement, notes internes comprises, avec des libellés
// lisibles : c'est ce que l'agent peut obtenir au titre de son droit d'accès.
export function exporterDossier(dossierId: string, conseillerId: string) {
  const dossier = obtenirDossier(dossierId, conseillerId);
  if (!dossier) return null;
  const db = getDb();

  const versions = (table: 'diagnostics' | 'bilans', champs: { cle: string; libelle: string }[]) =>
    (
      db
        .prepare(`SELECT payload, created_at FROM ${table} WHERE dossier_id = ? ORDER BY created_at`)
        .all(dossierId) as { payload: string; created_at: string }[]
    ).map((l) => {
      const payload = JSON.parse(l.payload) as Record<string, string>;
      return {
        date: l.created_at,
        elements: Object.fromEntries(
          champs.filter((c) => (payload[c.cle] ?? '').trim()).map((c) => [c.libelle, payload[c.cle].trim()]),
        ),
      };
    });

  const plan = obtenirPlan(dossierId, conseillerId);
  const trames = db
    .prepare('SELECT type, trame, created_at FROM entretiens WHERE dossier_id = ? ORDER BY created_at')
    .all(dossierId) as { type: string; trame: string; created_at: string }[];

  journaliser('dossier.export', dossierId, undefined, conseillerId);

  return {
    objet: "Export des données d'un accompagnement mobilité-carrière",
    exporteLe: new Date().toISOString(),
    accompagnement: {
      reference: dossier.reference,
      intitule: dossier.intitule,
      statut: LIBELLES_STATUT[dossier.statut],
      prochainRendezVous: dossier.prochainRdv,
      dateCloture: dossier.dateCloture,
      creeLe: dossier.createdAt,
      misAJourLe: dossier.updatedAt,
    },
    fichesDeSituation: versions('diagnostics', CHAMPS_DIAGNOSTIC),
    bilansDeParcours: versions('bilans', ETAPES_BILAN),
    planAccompagnement: plan
      ? {
          misAJourLe: plan.updatedAt,
          ...Object.fromEntries(RUBRIQUES_PLAN_EXPORT.map(([cle, libelle]) => [libelle, plan[cle]])),
        }
      : null,
    echanges: listerNotesSuivi(dossierId, conseillerId).map((n) => ({
      date: n.dateEchange,
      modalite: LIBELLES_MODALITE[n.modalite],
      compteRendu: n.contenu,
    })),
    tramesEntretien: trames.map((t) => ({ date: t.created_at, type: t.type, trame: JSON.parse(t.trame) })),
  };
}
