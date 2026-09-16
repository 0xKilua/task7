import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  buildTestApp,
  cleanupTestStorage,
  closeTestResources,
  listenTestApp,
  registerAndLogin,
  resetDatabase,
} from "./helpers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSE_PATH = join(__dirname, "../../../services/vision/tests/fixtures/pose.jpg");

async function createSimulation(app: FastifyInstance, baseUrl: string, accessToken: string) {
  const bytes = await readFile(POSE_PATH);
  const form = new FormData();
  form.append("image", new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }), "p.jpg");
  const upload = await fetch(`${baseUrl}/photos`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}` },
    body: form,
  });
  const { photoId } = await upload.json();

  const create = await app.inject({
    method: "POST",
    url: "/simulations",
    headers: { authorization: `Bearer ${accessToken}` },
    payload: { photoId, module: "silhouette", silhouetteDeltaKg: 2 },
  });
  return JSON.parse(create.body).id as string;
}

describe("favorites", () => {
  let app: FastifyInstance;
  let baseUrl: string;

  beforeAll(async () => {
    app = await buildTestApp();
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetDatabase();
    await cleanupTestStorage();
  });

  afterAll(async () => {
    await app.close();
    await closeTestResources();
  });

  it("adds, lists and removes a favorite", async () => {
    const { accessToken } = await registerAndLogin(app, "fav-user@example.com");
    const simulationId = await createSimulation(app, baseUrl, accessToken);

    const add = await app.inject({
      method: "POST",
      url: "/favorites",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { simulationId },
    });
    expect(add.statusCode).toBe(201);

    const duplicate = await app.inject({
      method: "POST",
      url: "/favorites",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { simulationId },
    });
    expect(duplicate.statusCode).toBe(409);

    const list = await app.inject({
      method: "GET",
      url: "/favorites",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(JSON.parse(list.body).length).toBe(1);

    const remove = await app.inject({
      method: "DELETE",
      url: `/favorites/${simulationId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(remove.statusCode).toBe(204);

    const listAfter = await app.inject({
      method: "GET",
      url: "/favorites",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(JSON.parse(listAfter.body).length).toBe(0);
  });
});
