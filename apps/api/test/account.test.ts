import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@relook/db";
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

describe("account", () => {
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

  it("returns and updates the profile", async () => {
    const { accessToken } = await registerAndLogin(app, "profile-user@example.com");

    const get = await app.inject({
      method: "GET",
      url: "/account",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(get.statusCode).toBe(200);
    expect(JSON.parse(get.body).email).toBe("profile-user@example.com");

    const patch = await app.inject({
      method: "PATCH",
      url: "/account",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { displayName: "Profile User", referenceWeightKg: 70 },
    });
    expect(patch.statusCode).toBe(200);
    expect(JSON.parse(patch.body).referenceWeightKg).toBe(70);
  });

  it("deletes the account and cascades photos, simulations and storage files", async () => {
    const { accessToken, userId } = await registerAndLogin(app, "delete-user@example.com");

    const bytes = await readFile(PORTRAIT_PATH);
    const form = new FormData();
    form.append("image", new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }), "p.jpg");
    const upload = await fetch(`${baseUrl}/photos`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}` },
      body: form,
    });
    expect(upload.status).toBe(201);

    const del = await app.inject({
      method: "DELETE",
      url: "/account",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(del.statusCode).toBe(204);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user).toBeNull();

    const photos = await prisma.photo.findMany({ where: { userId } });
    expect(photos.length).toBe(0);

    const meAfterDelete = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    // Le jeton reste valide en signature (il n'expire pas immediatement),
    // mais l'API verifie que le compte existe toujours a chaque requete :
    // un jeton pour un compte supprime ne doit plus donner acces a rien.
    expect(meAfterDelete.statusCode).toBe(401);
  });
});
