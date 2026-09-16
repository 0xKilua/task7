import type { HairstyleGenerationRequest, HairstyleProvider, GenerationResult } from "../types";
import { ReplicateClient, ReplicateError } from "./replicate-client";

export interface HairstyleReplicateProviderOptions {
  apiToken: string | undefined;
  /** Modele Replicate utilise pour l'inpainting de coiffure (owner/name). */
  modelOwner?: string;
  modelName?: string;
  fetchImpl?: typeof fetch;
}

/**
 * Change la FORME de la coiffure (longueur, coupe, volume) via un modele
 * d'inpainting generatif hebergé sur Replicate, guide par un masque de
 * cheveux (calcule par services/vision, en amont, avant l'appel a ce
 * provider) et un prompt textuel construit a partir du catalogue.
 *
 * Modele par defaut : stability-ai/stable-diffusion-inpainting (modele
 * public bien etabli, schema d'entree stable : image / mask / prompt).
 * Le proprietaire/nom du modele est configurable (`modelOwner`/`modelName`
 * ou variables d'environnement REPLICATE_HAIRSTYLE_MODEL_OWNER / _NAME) au
 * cas ou un modele plus specialise "cheveux" deviendrait disponible :
 * verifiez le schema d'entree exact sur la page Replicate du modele choisi
 * avant de changer cette valeur, les schemas pouvant evoluer.
 */
export class HairstyleReplicateProvider implements HairstyleProvider {
  readonly name = "replicate";
  private readonly apiToken: string | undefined;
  private readonly modelOwner: string;
  private readonly modelName: string;
  private readonly fetchImpl: typeof fetch | undefined;

  constructor(options: HairstyleReplicateProviderOptions) {
    this.apiToken = options.apiToken;
    this.modelOwner = options.modelOwner ?? "stability-ai";
    this.modelName = options.modelName ?? "stable-diffusion-inpainting";
    this.fetchImpl = options.fetchImpl;
  }

  isConfigured(): boolean {
    return Boolean(this.apiToken);
  }

  async generate(request: HairstyleGenerationRequest): Promise<GenerationResult> {
    if (!this.apiToken) {
      return {
        status: "provider_not_configured",
        message:
          "Le module de changement de forme de coiffure necessite REPLICATE_API_TOKEN. " +
          "Aucune generation n'a ete effectuee.",
      };
    }

    const client = new ReplicateClient({ apiToken: this.apiToken, fetchImpl: this.fetchImpl });
    const prompt = buildHairstylePrompt(request);

    try {
      const prediction = await client.runModel(this.modelOwner, this.modelName, {
        image: toDataUrl(request.photoBuffer, request.photoMimeType),
        prompt,
        num_inference_steps: 30,
        guidance_scale: 7.5,
      });

      if (prediction.status !== "succeeded") {
        return {
          status: "failed",
          errorMessage: prediction.error ?? `Statut inattendu: ${prediction.status}`,
          providerName: this.name,
        };
      }

      const imageBuffer = await client.downloadOutputImage(prediction);
      return { status: "completed", imageBuffer, providerName: this.name };
    } catch (error) {
      const errorMessage = error instanceof ReplicateError ? error.message : String(error);
      return { status: "failed", errorMessage, providerName: this.name };
    }
  }
}

export function buildHairstylePrompt(request: HairstyleGenerationRequest): string {
  const { hairstyle } = request;
  return [
    `coiffure ${hairstyle.name}`,
    hairstyle.description,
    `longueur ${hairstyle.length.replace(/_/g, " ")}`,
    `texture ${hairstyle.texture.replace(/_/g, " ")}`,
    "portrait photorealiste, meme visage, meme eclairage, haute qualite",
  ]
    .filter(Boolean)
    .join(", ");
}

function toDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}
