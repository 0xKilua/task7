import { rm } from "node:fs/promises";
import type { FastifyInstance } from "fastify";
import { prisma } from "@relook/db";
import { CLOTHING_ITEMS, HAIR_COLORS, HAIRSTYLES } from "@relook/catalog-data";
import { buildApp } from "../src/app.js";
import { getEnv } from "../src/env.js";
import { createStorageProvider } from "../src/lib/storage.js";
import { closeSimulationsQueue } from "../src/modules/simulations/simulations.queue.js";
import { upsertClothing, upsertColor, upsertHairstyle } from "../src/modules/catalog/catalog.service.js";

export async function buildTestApp(): Promise<FastifyInstance> {
  const env = getEnv();
  const storage = createStorageProvider(env);
  return buildApp(env, storage);
}

/**
 * Demarre l'app sur un port ephemere et retourne son URL de base. Utilise
 * pour les tests qui envoient un vrai multipart/form-data (upload photo) :
 * `fetch` + `FormData` natifs produisent un encodage correct, ce que
 * `app.inject()` ne fait pas nativement.
 */
export async function listenTestApp(app: FastifyInstance): Promise<string> {
  const address = await app.listen({ port: 0, host: "127.0.0.1" });
  return address;
}

export async function resetDatabase(): Promise<void> {
  await prisma.adminAuditLog.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.simulation.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedCatalog(): Promise<void> {
  for (const item of HAIRSTYLES) await upsertHairstyle(item);
  for (const item of HAIR_COLORS) await upsertColor(item);
  for (const item of CLOTHING_ITEMS) await upsertClothing(item);
}

export async function cleanupTestStorage(): Promise<void> {
  await rm(getEnv().LOCAL_STORAGE_DIR, { recursive: true, force: true });
}

export async function closeTestResources(): Promise<void> {
  await closeSimulationsQueue();
  await prisma.$disconnect();
}

export async function registerAndLogin(
  app: FastifyInstance,
  email: string,
  password = "SuperSecret123!",
): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
  const response = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email, password },
  });
  const body = JSON.parse(response.body);
  return { accessToken: body.accessToken, refreshToken: body.refreshToken, userId: body.user.id };
}

export async function promoteToAdmin(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { role: "admin" } });
}
