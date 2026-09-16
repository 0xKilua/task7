import { z } from "zod";
import { HairSelection } from "./hair";
import { OutfitSelection } from "./clothing";

export const SimulationModule = z.enum(["coiffure", "couleur", "vetements", "silhouette"]);
export type SimulationModule = z.infer<typeof SimulationModule>;

export const SimulationStatus = z.enum([
  "queued",
  "analyzing",
  "preparing",
  "generating",
  "finalizing",
  "completed",
  "failed",
  "provider_not_configured",
]);
export type SimulationStatus = z.infer<typeof SimulationStatus>;

/** Libelles UX affiches pendant le traitement (spec section 17). */
export const SIMULATION_STATUS_LABELS: Record<SimulationStatus, string> = {
  queued: "En attente...",
  analyzing: "Analyse de votre photo...",
  preparing: "Preparation de la transformation...",
  generating: "Generation de la simulation...",
  finalizing: "Finalisation...",
  completed: "Termine",
  failed: "Echec de la generation",
  provider_not_configured:
    "Ce module necessite un fournisseur IA externe non configure sur cette instance.",
};

export const SimulationRequest = z.object({
  photoId: z.string(),
  module: SimulationModule,
  hair: HairSelection.optional(),
  outfit: OutfitSelection.optional(),
  silhouetteDeltaKg: z.number().optional(),
});
export type SimulationRequest = z.infer<typeof SimulationRequest>;

export const Simulation = z.object({
  id: z.string(),
  userId: z.string(),
  photoId: z.string(),
  module: SimulationModule,
  status: SimulationStatus,
  request: SimulationRequest,
  resultStorageKey: z.string().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Simulation = z.infer<typeof Simulation>;
