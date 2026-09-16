import type { FastifyInstance } from "fastify";
import { prisma } from "@relook/db";
import { ClothingCatalogItem, HairColorCatalogItem, HairstyleCatalogItem } from "@relook/types";
import { ValidationError } from "../../lib/errors.js";
import {
  deleteClothing,
  deleteColor,
  deleteHairstyle,
  listClothing,
  listColors,
  listHairstyles,
  upsertClothing,
  upsertColor,
  upsertHairstyle,
} from "./catalog.service.js";

async function logAdminAction(
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  diff?: Record<string, unknown>,
) {
  await prisma.adminAuditLog.create({
    data: { adminId, action, entityType, entityId, diff: diff as never },
  });
}

export async function catalogRoutes(app: FastifyInstance): Promise<void> {
  // --- Lecture publique (aucune authentification requise pour decouvrir l'app) ---
  app.get("/catalog/hairstyles", async (request) => {
    const query = request.query as { length?: string; family?: string };
    return listHairstyles(query);
  });

  app.get("/catalog/colors", async (request) => {
    const query = request.query as { baseColor?: string; technique?: string };
    return listColors(query);
  });

  app.get("/catalog/clothing", async (request) => {
    const query = request.query as { category?: string; type?: string; season?: string; occasion?: string };
    return listClothing(query);
  });

  // --- Administration du catalogue (role admin requis) ---
  app.post("/admin/catalog/hairstyles", { preHandler: app.requireAdmin }, async (request, reply) => {
    const parsed = HairstyleCatalogItem.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);
    const row = await upsertHairstyle(parsed.data);
    await logAdminAction(request.user!.id, "upsert", "hairstyle", row.id, parsed.data);
    reply.code(201);
    return row;
  });

  app.delete("/admin/catalog/hairstyles/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteHairstyle(id);
    await logAdminAction(request.user!.id, "delete", "hairstyle", id);
    reply.code(204);
  });

  app.post("/admin/catalog/colors", { preHandler: app.requireAdmin }, async (request, reply) => {
    const parsed = HairColorCatalogItem.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);
    const row = await upsertColor(parsed.data);
    await logAdminAction(request.user!.id, "upsert", "color", row.id, parsed.data);
    reply.code(201);
    return row;
  });

  app.delete("/admin/catalog/colors/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteColor(id);
    await logAdminAction(request.user!.id, "delete", "color", id);
    reply.code(204);
  });

  app.post("/admin/catalog/clothing", { preHandler: app.requireAdmin }, async (request, reply) => {
    const parsed = ClothingCatalogItem.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);
    const row = await upsertClothing(parsed.data);
    await logAdminAction(request.user!.id, "upsert", "clothing", row.id, parsed.data);
    reply.code(201);
    return row;
  });

  app.delete("/admin/catalog/clothing/:id", { preHandler: app.requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteClothing(id);
    await logAdminAction(request.user!.id, "delete", "clothing", id);
    reply.code(204);
  });
}
