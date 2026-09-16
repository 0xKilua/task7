import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { HAIR_COLORS } from "@relook/catalog-data";
import {
  buildTestApp,
  cleanupTestStorage,
  closeTestResources,
  listenTestApp,
  registerAndLogin,
  resetDatabase,
  seedCatalog,
} from "./helpers.js";
import { getEnv } from "../src/env.js";
import { createStorageProvider } from "../src/lib/storage.js";
import { processSimulationJob } from "../src/modules/simulations/simulations.processor.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORTRAIT_PATH = join(__dirname, "../../../services/vision/tests/fixtures/portrait.jpg");
const POSE_PATH = join(__dirname, "../../../services/vision/tests/fixtures/pose.jpg");

async function uploadFile(baseUrl: string, accessToken: string, filePath: string) {
  const bytes = await readFile(filePath);
  const form = new FormData();
  form.append("image", new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }), "p.jpg");
  const response = await fetch(`${baseUrl}/photos`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}` },
    body: form,
  });
  return response.json() as Promise<{ photoId: string }>;
}

describe("simulations", () => {
  let app: FastifyInstance;
  let baseUrl: string;

  beforeAll(async () => {
    app = await buildTestApp();
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetDatabase();
    await cleanupTestStorage();
    await seedCatalog();
  });

  afterAll(async () => {
    await app.close();
    await closeTestResources();
  });

  it("validates the request and rejects an invalid silhouette delta", async () => {
    const { accessToken } = await registerAndLogin(app, "sim-user1@example.com");
    const { photoId } = await uploadFile(baseUrl, accessToken, POSE_PATH);

    const response = await app.inject({
      method: "POST",
      url: "/simulations",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { photoId, module: "silhouette", silhouetteDeltaKg: 5 },
    });
    expect(response.statusCode).toBe(400);
  });

  it("processes a couleur simulation end-to-end with the real vision pipeline", async () => {
    const { accessToken } = await registerAndLogin(app, "sim-user2@example.com");
    const { photoId } = await uploadFile(baseUrl, accessToken, PORTRAIT_PATH);

    const blondColor = HAIR_COLORS.find((c) => c.id === "blond-clair")!;
    const create = await app.inject({
      method: "POST",
      url: "/simulations",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { photoId, module: "couleur", hair: { colorId: blondColor.id } },
    });
    expect(create.statusCode).toBe(202);
    const { id: simulationId, status } = JSON.parse(create.body);
    expect(status).toBe("queued");

    // Traite directement la simulation (meme code que le worker de
    // production, voir simulations.processor.ts) pour un test deterministe.
    const env = getEnv();
    const storage = createStorageProvider(env);
    await processSimulationJob(env, storage, simulationId);

    const result = await app.inject({
      method: "GET",
      url: `/simulations/${simulationId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const body = JSON.parse(result.body);
    expect(body.status).toBe("completed");
    expect(body.resultStorageKey).toBeTruthy();

    const image = await app.inject({
      method: "GET",
      url: `/simulations/${simulationId}/result`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(image.statusCode).toBe(200);
    expect(image.headers["content-type"]).toBe("image/png");
    expect(image.rawPayload.length).toBeGreaterThan(0);
  });

  it("processes a silhouette simulation end-to-end", async () => {
    const { accessToken } = await registerAndLogin(app, "sim-user3@example.com");
    const { photoId } = await uploadFile(baseUrl, accessToken, POSE_PATH);

    const create = await app.inject({
      method: "POST",
      url: "/simulations",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { photoId, module: "silhouette", silhouetteDeltaKg: -6 },
    });
    expect(create.statusCode).toBe(202);
    const { id: simulationId } = JSON.parse(create.body);

    const env = getEnv();
    const storage = createStorageProvider(env);
    await processSimulationJob(env, storage, simulationId);

    const result = await app.inject({
      method: "GET",
      url: `/simulations/${simulationId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(JSON.parse(result.body).status).toBe("completed");
  });

  it("marks a coiffure simulation as provider_not_configured when no AI key is set (never fakes a result)", async () => {
    const { accessToken } = await registerAndLogin(app, "sim-user4@example.com");
    const { photoId } = await uploadFile(baseUrl, accessToken, PORTRAIT_PATH);

    const create = await app.inject({
      method: "POST",
      url: "/simulations",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { photoId, module: "coiffure", hair: { hairstyleId: "pixie-courte" } },
    });
    expect(create.statusCode).toBe(202);
    const { id: simulationId } = JSON.parse(create.body);

    const env = getEnv();
    const storage = createStorageProvider(env);
    await processSimulationJob(env, storage, simulationId);

    const result = await app.inject({
      method: "GET",
      url: `/simulations/${simulationId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const body = JSON.parse(result.body);
    expect(body.status).toBe("provider_not_configured");
    expect(body.resultStorageKey).toBeFalsy();
    expect(body.errorMessage).toContain("REPLICATE_API_TOKEN");
  });

  it("marks a vetements simulation as provider_not_configured when no AI key is set", async () => {
    const { accessToken } = await registerAndLogin(app, "sim-user5@example.com");
    const { photoId } = await uploadFile(baseUrl, accessToken, POSE_PATH);

    const create = await app.inject({
      method: "POST",
      url: "/simulations",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { photoId, module: "vetements", outfit: { haut: "tshirt-blanc-basique" } },
    });
    expect(create.statusCode).toBe(202);
    const { id: simulationId } = JSON.parse(create.body);

    const env = getEnv();
    const storage = createStorageProvider(env);
    await processSimulationJob(env, storage, simulationId);

    const result = await app.inject({
      method: "GET",
      url: `/simulations/${simulationId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(JSON.parse(result.body).status).toBe("provider_not_configured");
  });

  it("lists and deletes simulations", async () => {
    const { accessToken } = await registerAndLogin(app, "sim-user6@example.com");
    const { photoId } = await uploadFile(baseUrl, accessToken, POSE_PATH);

    const create = await app.inject({
      method: "POST",
      url: "/simulations",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { photoId, module: "silhouette", silhouetteDeltaKg: 4 },
    });
    const { id: simulationId } = JSON.parse(create.body);

    const list = await app.inject({
      method: "GET",
      url: "/simulations",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(JSON.parse(list.body).length).toBe(1);

    const del = await app.inject({
      method: "DELETE",
      url: `/simulations/${simulationId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(del.statusCode).toBe(204);
  });
});
