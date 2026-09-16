import type { FastifyInstance } from "fastify";
import { deleteAccount, getProfile, updateProfile } from "./account.service.js";

export async function accountRoutes(app: FastifyInstance): Promise<void> {
  app.get("/account", { preHandler: app.requireAuth }, async (request) => {
    return getProfile(request.user!.id);
  });

  app.patch("/account", { preHandler: app.requireAuth }, async (request) => {
    const body = request.body as { displayName?: string; referenceWeightKg?: number };
    return updateProfile(request.user!.id, body);
  });

  app.delete("/account", { preHandler: app.requireAuth }, async (request, reply) => {
    await deleteAccount(app.storage, request.user!.id);
    reply.code(204);
  });
}
