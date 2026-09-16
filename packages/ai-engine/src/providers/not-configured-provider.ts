import type {
  ClothingTryOnProvider,
  ClothingTryOnRequest,
  GenerationResult,
  HairstyleGenerationRequest,
  HairstyleProvider,
} from "../types";

/**
 * Provider explicite pour "aucun fournisseur IA generatif configure". Ne
 * simule JAMAIS un resultat : renvoie toujours le statut
 * `provider_not_configured`, que l'API et le frontend doivent afficher
 * clairement plutot que de masquer l'absence de generation reelle.
 */
export class NotConfiguredHairstyleProvider implements HairstyleProvider {
  readonly name = "not_configured";

  isConfigured(): boolean {
    return false;
  }

  async generate(_request: HairstyleGenerationRequest): Promise<GenerationResult> {
    return {
      status: "provider_not_configured",
      message:
        "Aucun fournisseur IA generatif n'est configure sur cette instance (REPLICATE_API_TOKEN " +
        "absent). Le changement de forme de coiffure ne peut pas etre genere.",
    };
  }
}

export class NotConfiguredClothingProvider implements ClothingTryOnProvider {
  readonly name = "not_configured";

  isConfigured(): boolean {
    return false;
  }

  async generate(_request: ClothingTryOnRequest): Promise<GenerationResult> {
    return {
      status: "provider_not_configured",
      message:
        "Aucun fournisseur IA generatif n'est configure sur cette instance (REPLICATE_API_TOKEN " +
        "absent). L'essayage virtuel de vetements ne peut pas etre genere.",
    };
  }
}
