import { z } from "zod";

export const SILHOUETTE_STEP_KG = 2;
export const SILHOUETTE_MIN_DELTA_KG = -20;
export const SILHOUETTE_MAX_DELTA_KG = 20;

/** Valide qu'un delta est bien un multiple du palier de 2kg et dans les bornes. */
export function isValidSilhouetteDelta(deltaKg: number): boolean {
  if (!Number.isFinite(deltaKg)) return false;
  if (deltaKg < SILHOUETTE_MIN_DELTA_KG || deltaKg > SILHOUETTE_MAX_DELTA_KG) return false;
  return deltaKg % SILHOUETTE_STEP_KG === 0;
}

export function silhouetteSteps(): number[] {
  const steps: number[] = [];
  for (let kg = SILHOUETTE_MIN_DELTA_KG; kg <= SILHOUETTE_MAX_DELTA_KG; kg += SILHOUETTE_STEP_KG) {
    steps.push(kg);
  }
  return steps;
}

export const SilhouetteRequest = z.object({
  photoId: z.string(),
  referenceWeightKg: z.number().positive().optional(),
  deltaKg: z
    .number()
    .refine(isValidSilhouetteDelta, "Le delta doit etre un multiple de 2kg entre -20 et +20"),
});
export type SilhouetteRequest = z.infer<typeof SilhouetteRequest>;

/**
 * Texte obligatoire affiche a chaque resultat de simulation de silhouette
 * (spec section 6) : jamais presente comme une prediction medicale.
 */
export const SILHOUETTE_DISCLAIMER =
  "Simulation visuelle indicative, non medicale. La repartition reelle d'une " +
  "variation de poids differe selon chaque morphologie ; ce resultat ne " +
  "constitue ni une prediction ni une garantie de resultat physique.";

export function silhouetteResultLabel(deltaKg: number): string {
  if (deltaKg === 0) return "Photo originale";
  const sign = deltaKg > 0 ? "+" : "";
  return `Simulation visuelle indicative correspondant a une variation de silhouette de ${sign}${deltaKg} kg.`;
}
