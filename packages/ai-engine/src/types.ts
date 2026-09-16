import type { ClothingCatalogItem, HairstyleCatalogItem } from "@relook/types";

/**
 * Resultat renvoye par un provider generatif. `provider_not_configured`
 * est un statut a part entiere (pas une erreur generique) : il permet a
 * l'API et au frontend de savoir explicitement qu'aucune transformation
 * n'a ete tentee, plutot que d'afficher un faux succes ou un message
 * d'erreur trompeur.
 */
export type GenerationResult =
  | { status: "completed"; imageBuffer: Buffer; providerName: string }
  | { status: "failed"; errorMessage: string; providerName: string }
  | { status: "provider_not_configured"; message: string };

export interface HairstyleGenerationRequest {
  photoBuffer: Buffer;
  photoMimeType: string;
  hairstyle: HairstyleCatalogItem;
}

export interface HairstyleProvider {
  readonly name: string;
  isConfigured(): boolean;
  generate(request: HairstyleGenerationRequest): Promise<GenerationResult>;
}

export interface ClothingTryOnRequest {
  photoBuffer: Buffer;
  photoMimeType: string;
  garments: ClothingCatalogItem[];
}

export interface ClothingTryOnProvider {
  readonly name: string;
  isConfigured(): boolean;
  generate(request: ClothingTryOnRequest): Promise<GenerationResult>;
}
