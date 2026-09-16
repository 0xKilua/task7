import { z } from "zod";

export const SupportedImageFormat = z.enum(["jpeg", "png", "webp", "heic"]);
export type SupportedImageFormat = z.infer<typeof SupportedImageFormat>;

/** Cadrage detecte automatiquement a partir des landmarks de pose. */
export const PhotoFraming = z.enum([
  "portrait", // visage uniquement / gros plan
  "buste", // tete + epaules/torse
  "demi_corps", // tete jusqu'a la taille/hanches
  "pied_a_tete", // corps entier visible
  "indetermine",
]);
export type PhotoFraming = z.infer<typeof PhotoFraming>;

export const PhotoAnalysis = z.object({
  framing: PhotoFraming,
  faceDetected: z.boolean(),
  faceCount: z.number().int().min(0),
  bodyDetected: z.boolean(),
  fullBodyVisible: z.boolean(),
  widthPx: z.number().int().positive(),
  heightPx: z.number().int().positive(),
  sharpnessScore: z.number().min(0).max(1),
  warnings: z.array(z.string()).default([]),
});
export type PhotoAnalysis = z.infer<typeof PhotoAnalysis>;

export const PHOTO_CONSTRAINTS = {
  minWidthPx: 480,
  minHeightPx: 480,
  maxFileSizeBytes: 20 * 1024 * 1024,
  acceptedFormats: ["jpeg", "png", "webp", "heic"] as const,
};

export const PhotoUploadResult = z.object({
  photoId: z.string(),
  storageKey: z.string(),
  format: SupportedImageFormat,
  widthPx: z.number().int().positive(),
  heightPx: z.number().int().positive(),
  analysis: PhotoAnalysis,
});
export type PhotoUploadResult = z.infer<typeof PhotoUploadResult>;
