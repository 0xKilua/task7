import { z } from "zod";

/** Longueur de cheveux, du plus court au plus long (spec section 2). */
export const HairLength = z.enum([
  "tres_courts",
  "courts",
  "mi_courts",
  "mi_longs",
  "longs",
  "tres_longs",
]);
export type HairLength = z.infer<typeof HairLength>;

/** Texture naturelle ou stylisee des cheveux. */
export const HairTexture = z.enum(["lisses", "ondules", "boucles", "tres_boucles"]);
export type HairTexture = z.infer<typeof HairTexture>;

/**
 * Catalogue extensible de coupes/styles. Ce n'est pas un enum ferme cote
 * donnees (voir HairstyleCatalogItem plus bas, identifie par `id` libre) :
 * cette liste ne sert qu'a documenter/valider les entrees de depart fournies
 * avec l'application.
 */
export const HairStyleFamily = z.enum([
  "carre",
  "carre_plongeant",
  "degrade_longs",
  "degrade_mi_longs",
  "pixie",
  "bob",
  "lob",
  "frange",
  "frange_rideau",
  "attaches",
  "queue_de_cheval",
  "chignon",
  "volume",
  "autre",
]);
export type HairStyleFamily = z.infer<typeof HairStyleFamily>;

/** Une "saison de tendance" doit toujours etre justifiee par une source. */
export const TrendReference = z.object({
  season: z.string().describe("Ex: 2026, 2027, Printemps-Ete 2026"),
  source: z.string().url().describe("URL justifiant le rattachement a cette tendance"),
  note: z.string().optional(),
});
export type TrendReference = z.infer<typeof TrendReference>;

/**
 * Parametres transmis au moteur de transformation pour appliquer ce style.
 * Le contenu exact depend du provider (voir packages/ai-engine) mais la
 * structure reste commune pour permettre de changer de moteur sans modifier
 * le catalogue.
 */
export const HairTransformParams = z.object({
  referenceMaskId: z.string().optional(),
  promptFragment: z.string().optional(),
  strength: z.number().min(0).max(1).default(0.75),
  preserveHairline: z.boolean().default(true),
});
export type HairTransformParams = z.infer<typeof HairTransformParams>;

export const HairstyleCatalogItem = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  length: HairLength,
  texture: HairTexture,
  family: HairStyleFamily,
  tags: z.array(z.string()).default([]),
  /** Absent si le style est un classique intemporel sans revendication de tendance. */
  trend: TrendReference.optional(),
  referenceImageUrl: z.string(),
  transformParams: HairTransformParams,
  suitableForFraming: z.array(z.enum(["portrait", "buste", "demi_corps", "pied_a_tete"])).default([
    "portrait",
    "buste",
  ]),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type HairstyleCatalogItem = z.infer<typeof HairstyleCatalogItem>;

/** Couleurs de base. */
export const HairBaseColor = z.enum([
  "blond",
  "blond_clair",
  "blond_fonce",
  "blond_polaire",
  "chatain_clair",
  "chatain",
  "chatain_fonce",
  "brun",
  "noir",
  "roux",
  "cuivre",
  "auburn",
  "gris",
  "blanc",
]);
export type HairBaseColor = z.infer<typeof HairBaseColor>;

/** Techniques de coloration multi-tons. */
export const HairColorTechnique = z.enum([
  "uniforme",
  "meches",
  "balayage",
  "ombre",
  "degrade_couleur",
  "racines_differentes",
  "bicolore",
]);
export type HairColorTechnique = z.infer<typeof HairColorTechnique>;

/** Reference colorimetrique reelle (LAB) utilisee par le moteur de recoloration. */
export const LabColor = z.object({
  l: z.number().min(0).max(100),
  a: z.number().min(-128).max(127),
  b: z.number().min(-128).max(127),
});
export type LabColor = z.infer<typeof LabColor>;

export const HairColorCatalogItem = z.object({
  id: z.string(),
  name: z.string(),
  baseColor: HairBaseColor,
  technique: HairColorTechnique,
  /** Couleur cible principale (racines si bicolore/racines_differentes). */
  targetLab: LabColor,
  /** Couleur secondaire (pointes) pour balayage/ombre/degrade/bicolore. */
  secondaryLab: LabColor.optional(),
  tags: z.array(z.string()).default([]),
  swatchHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type HairColorCatalogItem = z.infer<typeof HairColorCatalogItem>;

/** Selection combinee coiffure + longueur + couleur par l'utilisateur. */
export const HairSelection = z.object({
  hairstyleId: z.string().optional(),
  colorId: z.string().optional(),
});
export type HairSelection = z.infer<typeof HairSelection>;
