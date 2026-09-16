/**
 * Client HTTP minimal pour l'API REST de Replicate (https://replicate.com).
 * Utilise le endpoint "run a model" (`POST /v1/models/{owner}/{name}/predictions`)
 * qui n'exige pas de figer un hash de version a l'avance : Replicate route
 * vers la derniere version publiee du modele, ce qui evite de coder en dur
 * une version qui deviendrait obsolete.
 *
 * Reference API : https://replicate.com/docs/reference/http
 */

export interface ReplicateClientOptions {
  apiToken: string;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  pollIntervalMs?: number;
  timeoutMs?: number;
}

export type ReplicatePredictionStatus =
  | "starting"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled";

export interface ReplicatePrediction {
  id: string;
  status: ReplicatePredictionStatus;
  output: unknown;
  error: string | null;
}

export class ReplicateError extends Error {}

export class ReplicateClient {
  private readonly apiToken: string;
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;
  private readonly pollIntervalMs: number;
  private readonly timeoutMs: number;

  constructor(options: ReplicateClientOptions) {
    this.apiToken = options.apiToken;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.baseUrl = options.baseUrl ?? "https://api.replicate.com/v1";
    this.pollIntervalMs = options.pollIntervalMs ?? 2000;
    this.timeoutMs = options.timeoutMs ?? 120_000;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      "Content-Type": "application/json",
      Prefer: "wait=1",
    };
  }

  async runModel(
    owner: string,
    name: string,
    input: Record<string, unknown>,
  ): Promise<ReplicatePrediction> {
    const createResponse = await this.fetchImpl(
      `${this.baseUrl}/models/${owner}/${name}/predictions`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ input }),
      },
    );

    if (!createResponse.ok) {
      const body = await createResponse.text().catch(() => "");
      throw new ReplicateError(
        `Replicate a refuse la creation de la prediction (${createResponse.status}): ${body}`,
      );
    }

    let prediction = (await createResponse.json()) as ReplicatePrediction;
    prediction = await this.pollUntilDone(prediction.id, prediction);
    return prediction;
  }

  private async pollUntilDone(
    predictionId: string,
    initial: ReplicatePrediction,
  ): Promise<ReplicatePrediction> {
    let prediction = initial;
    const deadline = Date.now() + this.timeoutMs;

    while (prediction.status === "starting" || prediction.status === "processing") {
      if (Date.now() > deadline) {
        throw new ReplicateError(
          `Delai d'attente depasse pour la prediction Replicate ${predictionId}.`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
      const response = await this.fetchImpl(`${this.baseUrl}/predictions/${predictionId}`, {
        method: "GET",
        headers: this.headers(),
      });
      if (!response.ok) {
        throw new ReplicateError(
          `Impossible de recuperer le statut de la prediction Replicate (${response.status}).`,
        );
      }
      prediction = (await response.json()) as ReplicatePrediction;
    }

    return prediction;
  }

  async downloadOutputImage(prediction: ReplicatePrediction): Promise<Buffer> {
    const url = extractFirstImageUrl(prediction.output);
    if (!url) {
      throw new ReplicateError("Aucune image en sortie dans la reponse Replicate.");
    }
    const response = await this.fetchImpl(url);
    if (!response.ok) {
      throw new ReplicateError(`Echec du telechargement de l'image generee (${response.status}).`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

export function extractFirstImageUrl(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && typeof output[0] === "string") return output[0];
  if (output && typeof output === "object" && "image" in output) {
    const value = (output as { image?: unknown }).image;
    if (typeof value === "string") return value;
  }
  return null;
}
