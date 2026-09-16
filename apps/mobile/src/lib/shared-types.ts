/**
 * Sous-ensemble des types de @relook/types utilises par l'app mobile.
 *
 * Pourquoi duplique plutot qu'importe depuis le workspace : Metro (le
 * bundler React Native/Expo) et les node_modules symlinkes par pnpm ne
 * cohabitent pas bien par defaut (voir apps/mobile/README.md). Le partage
 * reel de @relook/types via la configuration Metro monorepo (watchFolders +
 * nodeModulesPaths) est documente comme prochaine etape plutot que force
 * ici au risque de casser le bundler. En attendant, ces types sont a
 * maintenir manuellement en synchronisation avec packages/types/src.
 */

export type HairLength = "tres_courts" | "courts" | "mi_courts" | "mi_longs" | "longs" | "tres_longs";
export type HairTexture = "lisses" | "ondules" | "boucles" | "tres_boucles";

export interface HairstyleCatalogItem {
  id: string;
  name: string;
  description: string;
  length: HairLength;
  texture: HairTexture;
  referenceImageUrl: string;
}

export interface HairColorCatalogItem {
  id: string;
  name: string;
  swatchHex: string;
}

export type SimulationModule = "coiffure" | "couleur" | "vetements" | "silhouette";
export type SimulationStatus =
  | "queued"
  | "analyzing"
  | "preparing"
  | "generating"
  | "finalizing"
  | "completed"
  | "failed"
  | "provider_not_configured";

export const SIMULATION_STATUS_LABELS: Record<SimulationStatus, string> = {
  queued: "En attente...",
  analyzing: "Analyse de votre photo...",
  preparing: "Preparation de la transformation...",
  generating: "Generation de la simulation...",
  finalizing: "Finalisation...",
  completed: "Termine",
  failed: "Echec de la generation",
  provider_not_configured: "Ce module necessite un fournisseur IA externe non configure sur cette instance.",
};

export interface Simulation {
  id: string;
  status: SimulationStatus;
  statusLabel: string;
  module: SimulationModule;
  resultStorageKey?: string;
  errorMessage?: string;
}

export const SILHOUETTE_STEPS: number[] = Array.from({ length: 21 }, (_, i) => -20 + i * 2);

export const SILHOUETTE_DISCLAIMER =
  "Simulation visuelle indicative, non medicale. La repartition reelle d'une " +
  "variation de poids differe selon chaque morphologie ; ce resultat ne " +
  "constitue ni une prediction ni une garantie de resultat physique.";
