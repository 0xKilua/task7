import { ClothingReplicateProvider } from "./providers/clothing-replicate-provider";
import { HairstyleReplicateProvider } from "./providers/hairstyle-replicate-provider";
import {
  NotConfiguredClothingProvider,
  NotConfiguredHairstyleProvider,
} from "./providers/not-configured-provider";
import type { ClothingTryOnProvider, HairstyleProvider } from "./types";

export interface AiEngineEnv {
  AI_PROVIDER?: string;
  REPLICATE_API_TOKEN?: string;
  REPLICATE_HAIRSTYLE_MODEL_OWNER?: string;
  REPLICATE_HAIRSTYLE_MODEL_NAME?: string;
  REPLICATE_CLOTHING_MODEL_OWNER?: string;
  REPLICATE_CLOTHING_MODEL_NAME?: string;
}

/**
 * Point d'entree unique pour obtenir les providers generatifs. Le choix du
 * fournisseur est pilote par variables d'environnement (`AI_PROVIDER`),
 * ce qui permet d'en ajouter d'autres (Stability AI, fal.ai, un service
 * auto-heberge) sans toucher au reste de l'application : il suffit
 * d'implementer `HairstyleProvider`/`ClothingTryOnProvider` et de
 * l'enregistrer ici.
 */
export function getHairstyleProvider(env: AiEngineEnv = process.env): HairstyleProvider {
  const provider = env.AI_PROVIDER ?? "replicate";
  if (provider === "replicate" && env.REPLICATE_API_TOKEN) {
    return new HairstyleReplicateProvider({
      apiToken: env.REPLICATE_API_TOKEN,
      modelOwner: env.REPLICATE_HAIRSTYLE_MODEL_OWNER,
      modelName: env.REPLICATE_HAIRSTYLE_MODEL_NAME,
    });
  }
  return new NotConfiguredHairstyleProvider();
}

export function getClothingProvider(env: AiEngineEnv = process.env): ClothingTryOnProvider {
  const provider = env.AI_PROVIDER ?? "replicate";
  if (provider === "replicate" && env.REPLICATE_API_TOKEN) {
    return new ClothingReplicateProvider({
      apiToken: env.REPLICATE_API_TOKEN,
      modelOwner: env.REPLICATE_CLOTHING_MODEL_OWNER,
      modelName: env.REPLICATE_CLOTHING_MODEL_NAME,
    });
  }
  return new NotConfiguredClothingProvider();
}
