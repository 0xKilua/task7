import type { FastifyInstance } from "fastify";
import { ValidationError } from "../../lib/errors.js";
import { addFavorite, listFavorites, removeFavorite } from "./favorites.service.js";

export async function favoritesRoutes(app: FastifyInstance): Promise<void> {
  app.post("/favorites", { preHandler: app.requireAuth }, async (request, reply) => {
    const body = request.body as { simulationId?: string };
    if (!body.simulationId) throw new ValidationError("simulationId requis.");
    const favorite = await addFavorite(request.user!.id, body.simulationId);
    reply.code(201);
    return favorite;
  });

  app.get("/favorites", { preHandler: app.requireAuth }, async (request) => {
    return listFavorites(request.user!.id);
  });

  app.delete("/favorites/:simulationId", { preHandler: app.requireAuth }, async (request, reply) => {
    const { simulationId } = request.params as { simulationId: string };
    await removeFavorite(request.user!.id, simulationId);
    reply.code(204);
  });
}
