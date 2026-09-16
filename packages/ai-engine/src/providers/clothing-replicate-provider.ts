import type { ClothingTryOnRequest, ClothingTryOnProvider, GenerationResult } from "../types";
import { ReplicateClient, ReplicateError } from "./replicate-client";

export interface ClothingReplicateProviderOptions {
  apiToken: string | undefined;
  modelOwner?: string;
  modelName?: string;
  fetchImpl?: typeof fetch;
}

/**
 * Essayage virtuel de vetements via un modele de "virtual try-on" (VTON)
 * generatif hebergé sur Replicate.
 *
 * Modele par defaut : cuuupid/idm-vton (implementation publique du modele
 * de recherche IDM-VTON, specialise dans le transfert de vetements sur une
 * photo de personne en conservant identite/pose). Comme pour le provider
 * coiffure, verifiez le schema d'entree exact sur la page Replicate du
 * modele avant deploiement : les noms de champs (`human_img`, `garm_img`,
 * `garment_des`, ...) peuvent evoluer d'une version a l'autre du modele.
 *
 * Pour un ensemble multi-pieces, les pieces sont appliquees sequentiellement
 * (chaque resultat sert d'entree a l'appel suivant) ce qui reste dans les
 * limites du modele (une seule piece par appel).
 */
export class ClothingReplicateProvider implements ClothingTryOnProvider {
  readonly name = "replicate";
  private readonly apiToken: string | undefined;
  private readonly modelOwner: string;
  private readonly modelName: string;
  private readonly fetchImpl: typeof fetch | undefined;

  constructor(options: ClothingReplicateProviderOptions) {
    this.apiToken = options.apiToken;
    this.modelOwner = options.modelOwner ?? "cuuupid";
    this.modelName = options.modelName ?? "idm-vton";
    this.fetchImpl = options.fetchImpl;
  }

  isConfigured(): boolean {
    return Boolean(this.apiToken);
  }

  async generate(request: ClothingTryOnRequest): Promise<GenerationResult> {
    if (!this.apiToken) {
      return {
        status: "provider_not_configured",
        message:
          "Le module d'essayage virtuel de vetements necessite REPLICATE_API_TOKEN. " +
          "Aucune generation n'a ete effectuee.",
      };
    }
    if (request.garments.length === 0) {
      return { status: "failed", errorMessage: "Aucun vetement selectionne.", providerName: this.name };
    }

    const client = new ReplicateClient({ apiToken: this.apiToken, fetchImpl: this.fetchImpl });
    let currentImage = request.photoBuffer;

    try {
      for (const garment of request.garments) {
        const prediction = await client.runModel(this.modelOwner, this.modelName, {
          human_img: toDataUrl(currentImage, request.photoMimeType),
          garm_img: garment.garmentImageUrl,
          garment_des: [garment.name, garment.style, garment.material, garment.color]
            .filter(Boolean)
            .join(", "),
          category: mapCategoryToVtonClass(garment.category),
        });

        if (prediction.status !== "succeeded") {
          return {
            status: "failed",
            errorMessage: prediction.error ?? `Statut inattendu: ${prediction.status}`,
            providerName: this.name,
          };
        }

        currentImage = await client.downloadOutputImage(prediction);
      }

      return { status: "completed", imageBuffer: currentImage, providerName: this.name };
    } catch (error) {
      const errorMessage = error instanceof ReplicateError ? error.message : String(error);
      return { status: "failed", errorMessage, providerName: this.name };
    }
  }
}

function mapCategoryToVtonClass(category: string): string {
  switch (category) {
    case "haut":
      return "upper_body";
    case "bas":
      return "lower_body";
    case "robe":
      return "dresses";
    default:
      return "upper_body";
  }
}

function toDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}
