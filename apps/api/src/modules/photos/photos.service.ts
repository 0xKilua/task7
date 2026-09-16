import sharp from "sharp";
import { prisma } from "@relook/db";
import { PHOTO_CONSTRAINTS, type PhotoUploadResult, type SupportedImageFormat } from "@relook/types";
import type { Env } from "../../env.js";
import { NotFoundError, ValidationError } from "../../lib/errors.js";
import { buildPhotoStorageKey, type StorageProvider } from "../../lib/storage.js";
import { createVisionClient } from "../../lib/vision-client.js";

const FORMAT_MAP: Record<string, SupportedImageFormat | undefined> = {
  jpeg: "jpeg",
  jpg: "jpeg",
  png: "png",
  webp: "webp",
  heif: "heic",
  heic: "heic",
};

export async function uploadPhoto(
  env: Env,
  storage: StorageProvider,
  userId: string,
  fileBuffer: Buffer,
  originalFilename: string,
): Promise<PhotoUploadResult> {
  if (fileBuffer.byteLength === 0) {
    throw new ValidationError("Fichier vide.");
  }
  if (fileBuffer.byteLength > PHOTO_CONSTRAINTS.maxFileSizeBytes) {
    throw new ValidationError(
      `Fichier trop volumineux (max ${Math.round(PHOTO_CONSTRAINTS.maxFileSizeBytes / (1024 * 1024))} Mo).`,
    );
  }

  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(fileBuffer).metadata();
  } catch {
    throw new ValidationError("Fichier image illisible ou corrompu.");
  }

  const format = metadata.format ? FORMAT_MAP[metadata.format] : undefined;
  if (!format) {
    throw new ValidationError(
      `Format non supporte (${metadata.format ?? "inconnu"}). Formats acceptes : JPG, PNG, WEBP, HEIC.`,
    );
  }

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (width < PHOTO_CONSTRAINTS.minWidthPx || height < PHOTO_CONSTRAINTS.minHeightPx) {
    throw new ValidationError(
      `Resolution trop faible (${width}x${height}px). Minimum requis : ` +
        `${PHOTO_CONSTRAINTS.minWidthPx}x${PHOTO_CONSTRAINTS.minHeightPx}px.`,
    );
  }

  // Recompression/normalisation : on reencode systematiquement en JPEG qualite 90,
  // avec une taille plafonnee pour limiter le stockage et le temps de traitement,
  // conformement a l'objectif de compression intelligente (spec section 11).
  const normalized = await sharp(fileBuffer)
    .rotate() // applique l'orientation EXIF puis la retire
    .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();

  const visionClient = createVisionClient(env);
  const analysis = await visionClient.analyze(normalized, originalFilename, "image/jpeg");

  const storageKey = buildPhotoStorageKey(userId, "jpg");
  await storage.putObject(storageKey, normalized, "image/jpeg");

  const photo = await prisma.photo.create({
    data: {
      userId,
      storageKey,
      format: "jpeg",
      widthPx: analysis.widthPx,
      heightPx: analysis.heightPx,
      framing: analysis.framing,
      faceDetected: analysis.faceDetected,
      faceCount: analysis.faceCount,
      bodyDetected: analysis.bodyDetected,
      fullBodyVisible: analysis.fullBodyVisible,
      sharpnessScore: analysis.sharpnessScore,
      warnings: analysis.warnings,
      expiresAt: new Date(Date.now() + env.DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return {
    photoId: photo.id,
    storageKey: photo.storageKey,
    format: "jpeg",
    widthPx: photo.widthPx,
    heightPx: photo.heightPx,
    analysis,
  };
}

export async function listPhotos(userId: string) {
  return prisma.photo.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOwnedPhoto(userId: string, photoId: string) {
  const photo = await prisma.photo.findFirst({ where: { id: photoId, userId, deletedAt: null } });
  if (!photo) throw new NotFoundError("Photo introuvable.");
  return photo;
}

export async function deletePhoto(storage: StorageProvider, userId: string, photoId: string): Promise<void> {
  const photo = await getOwnedPhoto(userId, photoId);
  await storage.deleteObject(photo.storageKey);
  // Suppression definitive (droit a l'effacement RGPD) : pas de soft-delete
  // ici, contrairement a la suppression de compte qui prevoit un delai.
  await prisma.photo.delete({ where: { id: photo.id } });
}
