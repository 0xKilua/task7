import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  buildTestApp,
  closeTestResources,
  promoteToAdmin,
  registerAndLogin,
  resetDatabase,
  seedCatalog,
} from "./helpers.js";

describe("catalog", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
    await seedCatalog();
  });

  afterAll(async () => {
    await app.close();
    await closeTestResources();
  });

  it("lists hairstyles publicly without authentication", async () => {
    const response = await app.inject({ method: "GET", url: "/catalog/hairstyles" });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.length).toBeGreaterThan(0);
  });

  it("lists colors and clothing publicly", async () => {
    const colors = await app.inject({ method: "GET", url: "/catalog/colors" });
    const clothing = await app.inject({ method: "GET", url: "/catalog/clothing" });
    expect(colors.statusCode).toBe(200);
    expect(clothing.statusCode).toBe(200);
    expect(JSON.parse(colors.body).length).toBeGreaterThan(0);
    expect(JSON.parse(clothing.body).length).toBeGreaterThan(0);
  });

  it("filters hairstyles by length", async () => {
    const response = await app.inject({ method: "GET", url: "/catalog/hairstyles?length=tres_courts" });
    const body = JSON.parse(response.body);
    expect(body.every((h: { length: string }) => h.length === "tres_courts")).toBe(true);
  });

  it("rejects catalog writes from a non-admin user", async () => {
    const { accessToken } = await registerAndLogin(app, "user@example.com");
    const response = await app.inject({
      method: "POST",
      url: "/admin/catalog/hairstyles",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        id: "test-style",
        name: "Test",
        description: "desc",
        length: "courts",
        texture: "lisses",
        family: "carre",
        tags: [],
        referenceImageUrl: "/x.jpg",
        transformParams: { strength: 0.5, preserveHairline: true },
        suitableForFraming: ["portrait"],
      },
    });
    expect(response.statusCode).toBe(403);
  });

  it("allows an admin to create, then delete, a hairstyle", async () => {
    const { accessToken, userId } = await registerAndLogin(app, "admin@example.com");
    await promoteToAdmin(userId);

    const create = await app.inject({
      method: "POST",
      url: "/admin/catalog/hairstyles",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        id: "test-style-2",
        name: "Test 2",
        description: "desc",
        length: "courts",
        texture: "lisses",
        family: "bob",
        tags: [],
        referenceImageUrl: "/x.jpg",
        transformParams: { strength: 0.5, preserveHairline: true },
        suitableForFraming: ["portrait"],
      },
    });
    expect(create.statusCode).toBe(201);

    const del = await app.inject({
      method: "DELETE",
      url: "/admin/catalog/hairstyles/test-style-2",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(del.statusCode).toBe(204);
  });

  it("rejects a hairstyle whose trend has no source URL", async () => {
    const { accessToken, userId } = await registerAndLogin(app, "admin2@example.com");
    await promoteToAdmin(userId);

    const response = await app.inject({
      method: "POST",
      url: "/admin/catalog/hairstyles",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        id: "test-style-3",
        name: "Test 3",
        description: "desc",
        length: "courts",
        texture: "lisses",
        family: "bob",
        tags: [],
        trend: { season: "2026", source: "not-a-url" },
        referenceImageUrl: "/x.jpg",
        transformParams: { strength: 0.5, preserveHairline: true },
        suitableForFraming: ["portrait"],
      },
    });
    expect(response.statusCode).toBe(400);
  });
});
