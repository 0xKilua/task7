import type { LabColor, PhotoAnalysis } from "@relook/types";
import type { Env } from "../env.js";

export class VisionServiceError extends Error {}

export class VisionClient {
  constructor(private readonly baseUrl: string) {}

  async analyze(photo: Buffer, filename: string, mimeType: string): Promise<PhotoAnalysis> {
    const form = new FormData();
    form.append("image", new Blob([new Uint8Array(photo)], { type: mimeType }), filename);

    const response = await fetch(`${this.baseUrl}/analyze`, { method: "POST", body: form });
    if (!response.ok) {
      throw new VisionServiceError(`Echec de l'analyse photo (${response.status}).`);
    }
    return (await response.json()) as PhotoAnalysis;
  }

  async recolorHair(
    photo: Buffer,
    filename: string,
    mimeType: string,
    targetLab: LabColor,
    secondaryLab?: LabColor,
  ): Promise<Buffer> {
    const form = new FormData();
    form.append("image", new Blob([new Uint8Array(photo)], { type: mimeType }), filename);
    form.append("target_lab", JSON.stringify(targetLab));
    if (secondaryLab) form.append("secondary_lab", JSON.stringify(secondaryLab));

    const response = await fetch(`${this.baseUrl}/recolor-hair`, { method: "POST", body: form });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new VisionServiceError(`Echec de la recoloration (${response.status}): ${detail}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  async reshape(photo: Buffer, filename: string, mimeType: string, deltaKg: number): Promise<Buffer> {
    const form = new FormData();
    form.append("image", new Blob([new Uint8Array(photo)], { type: mimeType }), filename);
    form.append("delta_kg", String(deltaKg));

    const response = await fetch(`${this.baseUrl}/reshape`, { method: "POST", body: form });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new VisionServiceError(`Echec de la simulation de silhouette (${response.status}): ${detail}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }
}

export function createVisionClient(env: Env): VisionClient {
  return new VisionClient(env.VISION_SERVICE_URL);
}
