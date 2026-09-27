import { getDb } from './db';

export const LIBELLES_ACTIONS: Record<string, string> = {
  'connexion.reussie': 'Connexion',
  'connexion.echec': 'Échec de connexion',
  'mot_de_passe.change': 'Changement de mot de passe',
  'mot_de_passe.reinitialise': 'Réinitialisation de mot de passe',
  'mot_de_passe.reinitialise_cli': 'Réinitialisation de mot de passe (ligne de commande)',
  'utilisateur.creation': 'Création de compte',
  'utilisateur.desactivation': 'Désactivation de compte',
  'utilisateur.reactivation': 'Réactivation de compte',
  'utilisateur.renomme_cli': 'Changement d’identifiant (ligne de commande)',
  'dossier.creation': 'Création d’un accompagnement',
  'dossier.suppression': 'Suppression d’un accompagnement',
  'dossier.suivi': 'Mise à jour du suivi',
  'dossier.export': 'Export des données d’un accompagnement',
  'suivi.note_ajout': 'Échange consigné',
  'suivi.note_suppression': 'Échange supprimé',
  'diagnostic.creation': 'Fiche de situation enregistrée',
  'bilan.creation': 'Bilan de parcours enregistré',
  'plan.creation': 'Plan d’accompagnement créé',
  'plan.mise_a_jour': 'Plan d’accompagnement modifié',
  'restitution.edition': 'Document de restitution édité',
  'entretien.generation': 'Trame d’entretien générée',
  'document.ingestion': 'Document ingéré',
  'document.mise_a_jour': 'Document mis à jour',
  'document.suppression': 'Document retiré',
  'dispositif.mise_a_jour': 'Fiche dispositif modifiée',
  'dispositifs.import': 'Import du catalogue de dispositifs',
  'conservation.politique': 'Politique de conservation modifiée',
  'conservation.purge': 'Application de la politique de conservation',
};

export const FAMILLES: { valeur: string; libelle: string }[] = [
  { valeur: 'connexion', libelle: 'Connexions' },
  { valeur: 'utilisateur', libelle: 'Comptes' },
  { valeur: 'mot_de_passe', libelle: 'Mots de passe' },
  { valeur: 'dossier', libelle: 'Accompagnements' },
  { valeur: 'suivi', libelle: 'Suivi' },
  { valeur: 'document', libelle: 'Base documentaire' },
  { valeur: 'conservation', libelle: 'Conservation' },
];

// Détails affichés seulement pour les actions qui n'en portent aucun sur un agent : les
// entrées antérieures à la minimisation du journal contenaient des références de dossier.
const DETAILS_AFFICHABLES = ['conservation.', 'document.', 'dispositif', 'utilisateur.creation'];

export interface EntreeJournal {
  id: number;
  ts: string;
  action: string;
  libelle: string;
  cible: string | null;
  details: string | null;
  acteur: string | null;
}

export function listerJournal(famille?: string, limite = 300): EntreeJournal[] {
  const lignes = getDb()
    .prepare(
      `SELECT j.id, j.ts, j.action, j.cible, j.details, u.nom AS acteur
         FROM journal j LEFT JOIN utilisateurs u ON u.id = j.acteur_id
        WHERE (? IS NULL OR j.action LIKE ? || '.%')
        ORDER BY j.id DESC LIMIT ?`,
    )
    .all(famille ?? null, famille ?? null, limite) as Omit<EntreeJournal, 'libelle'>[];
  return lignes.map((l) => ({
    ...l,
    libelle: LIBELLES_ACTIONS[l.action] ?? l.action,
    details: DETAILS_AFFICHABLES.some((prefixe) => l.action.startsWith(prefixe)) ? l.details : null,
  }));
}
