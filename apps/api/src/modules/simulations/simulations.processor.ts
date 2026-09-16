import { getClothingProvider, getHairstyleProvider } from "@relook/ai-engine";
import { prisma } from "@relook/db";
import type {
  ClothingCatalogItem,
  HairstyleCatalogItem,
  SimulationRequest,
  SimulationStatus,
} from "@relook/types";
import type { Env } from "../../env.js";
import { buildResultStorageKey, type StorageProvider } from "../../lib/storage.js";
import { createVisionClient, VisionServiceError } from "../../lib/vision-client.js";

/**
 * Traite une simulation en attente : c'est le coeur du pipeline
 * PHOTO -> ANALYSE -> TRANSFORMATION -> IMAGE. Utilise a la fois par le
 * worker BullMQ (production) et directement par les tests d'integration
 * (meme code, sans passer par la queue), pour garantir que ce qui est
 * teste est exactement ce qui tourne en production.
 */
export async function processSimulationJob(env: Env, storage: StorageProvider, simulationId: string): Promise<void> {
  const simulation = await prisma.simulation.findUniqueOrThrow({
    where: { id: simulationId },
    include: { photo: true },
  });

  const request = simulation.requestJson as unknown as SimulationRequest;

  try {
    await setStatus(simulationId, "analyzing");
    const photoBuffer = await storage.getObject(simulation.photo.storageKey);

    await setStatus(simulationId, "preparing");
    const visionClient = createVisionClient(env);

    await setStatus(simulationId, "generating");

    let resultBuffer: Buffer;

    switch (simulation.module) {
      case "couleur": {
        if (!request.hair?.colorId) throw new Error("colorId manquant pour le module couleur.");
        const color = await prisma.catalogHairColor.findUniqueOrThrow({
          where: { id: request.hair.colorId },
        });
        resultBuffer = await visionClient.recolorHair(
          photoBuffer,
          "photo.jpg",
          "image/jpeg",
          color.targetLab as { l: number; a: number; b: number },
          (color.secondaryLab as { l: number; a: number; b: number } | null) ?? undefined,
        );
        break;
      }

      case "silhouette": {
        if (request.silhouetteDeltaKg === undefined) {
          throw new Error("silhouetteDeltaKg manquant pour le module silhouette.");
        }
        resultBuffer = await visionClient.reshape(
          photoBuffer,
          "photo.jpg",
          "image/jpeg",
          request.silhouetteDeltaKg,
        );
        break;
      }

      case "coiffure": {
        if (!request.hair?.hairstyleId) throw new Error("hairstyleId manquant pour le module coiffure.");
        const row = await prisma.catalogHairstyle.findUniqueOrThrow({
          where: { id: request.hair.hairstyleId },
        });
        const hairstyle = hairstyleRowToItem(row);
        const provider = getHairstyleProvider(env);
        const result = await provider.generate({ photoBuffer, photoMimeType: "image/jpeg", hairstyle });

        if (result.status === "provider_not_configured") {
          await markNotConfigured(simulationId, result.message);
          return;
        }
        if (result.status === "failed") {
          await markFailed(simulationId, result.errorMessage);
          return;
        }
        resultBuffer = result.imageBuffer;
        break;
      }

      case "vetements": {
        const garmentIds = [
          request.outfit?.haut,
          request.outfit?.bas,
          request.outfit?.robe,
          request.outfit?.vesteSurCouche,
        ].filter((v): v is string => Boolean(v));
        if (garmentIds.length === 0) throw new Error("Aucun vetement selectionne.");

        const rows = await prisma.catalogClothing.findMany({ where: { id: { in: garmentIds } } });
        const garments = rows.map(clothingRowToItem);
        const provider = getClothingProvider(env);
        const result = await provider.generate({ photoBuffer, photoMimeType: "image/jpeg", garments });

        if (result.status === "provider_not_configured") {
          await markNotConfigured(simulationId, result.message);
          return;
        }
        if (result.status === "failed") {
          await markFailed(simulationId, result.errorMessage);
          return;
        }
        resultBuffer = result.imageBuffer;
        break;
      }

      default:
        throw new Error(`Module de simulation inconnu: ${simulation.module}`);
    }

    await setStatus(simulationId, "finalizing");
    const resultKey = buildResultStorageKey(simulation.userId, simulationId);
    await storage.putObject(resultKey, resultBuffer, "image/png");

    await prisma.simulation.update({
      where: { id: simulationId },
      data: { status: "completed", resultStorageKey: resultKey },
    });
  } catch (error) {
    const message = error instanceof VisionServiceError ? error.message : String(error);
    await markFailed(simulationId, message);
  }
}

async function setStatus(simulationId: string, status: SimulationStatus) {
  await prisma.simulation.update({ where: { id: simulationId }, data: { status } });
}

async function markFailed(simulationId: string, errorMessage: string) {
  await prisma.simulation.update({
    where: { id: simulationId },
    data: { status: "failed", errorMessage },
  });
}

async function markNotConfigured(simulationId: string, message: string) {
  await prisma.simulation.update({
    where: { id: simulationId },
    data: { status: "provider_not_configured", errorMessage: message },
  });
}

function hairstyleRowToItem(row: {
  id: string;
  name: string;
  description: string;
  length: string;
  texture: string;
  family: string;
  tags: unknown;
  referenceImageUrl: string;
  transformParams: unknown;
  suitableForFraming: unknown;
}): HairstyleCatalogItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    length: row.length as HairstyleCatalogItem["length"],
    texture: row.texture as HairstyleCatalogItem["texture"],
    family: row.family as HairstyleCatalogItem["family"],
    tags: row.tags as string[],
    referenceImageUrl: row.referenceImageUrl,
    transformParams: row.transformParams as HairstyleCatalogItem["transformParams"],
    suitableForFraming: row.suitableForFraming as HairstyleCatalogItem["suitableForFraming"],
  };
}

function clothingRowToItem(row: {
  id: string;
  name: string;
  category: string;
  type: string;
  fit: string;
  color: string;
  colorHex: string | null;
  material: string;
  style: string;
  season: string;
  occasion: string;
  tags: unknown;
  garmentImageUrl: string;
}): ClothingCatalogItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category as ClothingCatalogItem["category"],
    type: row.type as ClothingCatalogItem["type"],
    fit: row.fit as ClothingCatalogItem["fit"],
    color: row.color,
    colorHex: row.colorHex ?? undefined,
    material: row.material,
    style: row.style,
    season: row.season as ClothingCatalogItem["season"],
    occasion: row.occasion as ClothingCatalogItem["occasion"],
    tags: row.tags as string[],
    garmentImageUrl: row.garmentImageUrl,
  };
}
