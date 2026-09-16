import { z } from "zod";

export const ClothingCategory = z.enum(["haut", "bas", "robe", "ensemble"]);
export type ClothingCategory = z.infer<typeof ClothingCategory>;

export const ClothingType = z.enum([
  // Hauts
  "tshirt",
  "chemise",
  "blouse",
  "polo",
  "pull",
  "sweat",
  "cardigan",
  "debardeur",
  "top",
  "veste",
  "blazer",
  "veste_costume",
  // Bas
  "jean",
  "pantalon_classique",
  "pantalon_large",
  "pantalon_droit",
  "pantalon_cargo",
  "jogging",
  "legging",
  "jupe_courte",
  "jupe_midi",
  "jupe_longue",
  "short",
  "bermuda",
  // Robes
  "robe_courte",
  "robe_midi",
  "robe_longue",
  "robe_droite",
  "robe_fluide",
  "robe_soiree",
  "robe_decontractee",
]);
export type ClothingType = z.infer<typeof ClothingType>;

export const ClothingFit = z.enum(["ajuste", "regular", "ample", "oversize", "cintre", "droit"]);
export type ClothingFit = z.infer<typeof ClothingFit>;

export const ClothingSeason = z.enum(["printemps", "ete", "automne", "hiver", "toutes_saisons"]);
export type ClothingSeason = z.infer<typeof ClothingSeason>;

export const ClothingOccasion = z.enum([
  "quotidien",
  "travail",
  "soiree",
  "sport",
  "ceremonie",
  "vacances",
]);
export type ClothingOccasion = z.infer<typeof ClothingOccasion>;

export const ClothingCatalogItem = z.object({
  id: z.string(),
  name: z.string(),
  category: ClothingCategory,
  type: ClothingType,
  fit: ClothingFit,
  color: z.string(),
  colorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  material: z.string(),
  style: z.string(),
  season: ClothingSeason,
  occasion: ClothingOccasion,
  tags: z.array(z.string()).default([]),
  /** Image plat/mannequin du vetement, utilisee par le moteur de try-on. */
  garmentImageUrl: z.string(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type ClothingCatalogItem = z.infer<typeof ClothingCatalogItem>;

/**
 * Un ensemble combine plusieurs pieces compatibles (ex: haut + bas,
 * veste de costume + pantalon, robe + veste). `slots` decrit quelles
 * categories peuvent occuper quelle position dans la tenue.
 */
export const OutfitSelection = z.object({
  haut: z.string().optional(),
  bas: z.string().optional(),
  robe: z.string().optional(),
  vesteSurCouche: z.string().optional(),
});
export type OutfitSelection = z.infer<typeof OutfitSelection>;

export function isOutfitSelectionValid(selection: OutfitSelection): boolean {
  const hasRobe = Boolean(selection.robe);
  const hasHautBas = Boolean(selection.haut) || Boolean(selection.bas);
  if (hasRobe && hasHautBas) return false; // robe incompatible avec haut/bas simultanes
  return hasRobe || hasHautBas;
}
