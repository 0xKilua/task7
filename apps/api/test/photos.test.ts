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
const PORTRAIT_PATH = join(__dirname, "../../../services/vision/tests/fixtures/portrait.jpg");
const POSE_PATH = join(__dirname, "../../../services/vision/tests/fixtures/pose.jpg");

async function uploadFile(baseUrl: string, accessToken: string, filePath: string, filename: string) {
  const bytes = await readFile(filePath);
  const form = new FormData();
  form.append("image", new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }), filename);
  return fetch(`${baseUrl}/photos`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}` },
    body: form,
  });
}

describe("photos", () => {
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

  it("uploads a real portrait photo and returns a full analysis", async () => {
    const { accessToken } = await registerAndLogin(app, "photo-user@example.com");
    const response = await uploadFile(baseUrl, accessToken, PORTRAIT_PATH, "portrait.jpg");
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.photoId).toBeTruthy();
    expect(body.analysis.faceDetected).toBe(true);
    expect(body.analysis.widthPx).toBeGreaterThan(0);
  });

  it("uploads a full-body photo and detects a body", async () => {
    const { accessToken } = await registerAndLogin(app, "photo-user2@example.com");
    const response = await uploadFile(baseUrl, accessToken, POSE_PATH, "pose.jpg");
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.analysis.bodyDetected).toBe(true);
  });

  it("rejects an upload without authentication", async () => {
    const bytes = await readFile(PORTRAIT_PATH);
    const form = new FormData();
    form.append("image", new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }), "p.jpg");
    const response = await fetch(`${baseUrl}/photos`, { method: "POST", body: form });
    expect(response.status).toBe(401);
  });

  it("rejects a non-image file", async () => {
    const { accessToken } = await registerAndLogin(app, "photo-user3@example.com");
    const form = new FormData();
    form.append("image", new Blob([new Uint8Array([1, 2, 3, 4])], { type: "text/plain" }), "not-an-image.txt");
    const response = await fetch(`${baseUrl}/photos`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}` },
      body: form,
    });
    expect(response.status).toBe(400);
  });

  it("rejects a tiny low-resolution image", async () => {
    const { accessToken } = await registerAndLogin(app, "photo-user4@example.com");
    // 1x1 PNG (le plus petit PNG valide possible)
    const tinyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    );
    const form = new FormData();
    form.append("image", new Blob([new Uint8Array(tinyPng)], { type: "image/png" }), "tiny.png");
    const response = await fetch(`${baseUrl}/photos`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}` },
      body: form,
    });
    expect(response.status).toBe(400);
  });

  it("lists, fetches and deletes an uploaded photo", async () => {
    const { accessToken } = await registerAndLogin(app, "photo-user5@example.com");
    const upload = await uploadFile(baseUrl, accessToken, PORTRAIT_PATH, "portrait.jpg");
    const { photoId } = await upload.json();

    const list = await fetch(`${baseUrl}/photos`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect((await list.json()).length).toBe(1);

    const image = await fetch(`${baseUrl}/photos/${photoId}/image`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(image.status).toBe(200);
    expect(image.headers.get("content-type")).toBe("image/jpeg");

    const del = await fetch(`${baseUrl}/photos/${photoId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(del.status).toBe(204);

    const afterDelete = await fetch(`${baseUrl}/photos/${photoId}`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(afterDelete.status).toBe(404);
  });

  it("prevents a user from accessing another user's photo", async () => {
    const alice = await registerAndLogin(app, "alice-photo@example.com");
    const bob = await registerAndLogin(app, "bob-photo@example.com");
    const upload = await uploadFile(baseUrl, alice.accessToken, PORTRAIT_PATH, "portrait.jpg");
    const { photoId } = await upload.json();

    const response = await fetch(`${baseUrl}/photos/${photoId}`, {
      headers: { authorization: `Bearer ${bob.accessToken}` },
    });
    expect(response.status).toBe(404);
  });
});
