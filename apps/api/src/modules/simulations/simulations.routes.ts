import type { FastifyInstance } from "fastify";
import { SIMULATION_STATUS_LABELS, type SimulationStatus } from "@relook/types";
import { NotFoundError } from "../../lib/errors.js";
import {
  createSimulation,
  deleteSimulation,
  getOwnedSimulation,
  listSimulations,
} from "./simulations.service.js";

export async function simulationsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/simulations", { preHandler: app.requireAuth }, async (request, reply) => {
    const simulation = await createSimulation(app.env, request.user!.id, request.body);
    reply.code(202);
    return withStatusLabel(simulation);
  });

  app.get("/simulations", { preHandler: app.requireAuth }, async (request) => {
    const query = request.query as { module?: string };
    const simulations = await listSimulations(request.user!.id, query.module);
    return simulations.map(withStatusLabel);
  });

  app.get("/simulations/:id", { preHandler: app.requireAuth }, async (request) => {
    const { id } = request.params as { id: string };
    const simulation = await getOwnedSimulation(request.user!.id, id);
    return withStatusLabel(simulation);
  });

  app.get("/simulations/:id/result", { preHandler: app.requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const simulation = await getOwnedSimulation(request.user!.id, id);
    if (!simulation.resultStorageKey) {
      throw new NotFoundError("Resultat non disponible pour le moment.");
    }
    const buffer = await app.storage.getObject(simulation.resultStorageKey);
    reply.header("Content-Type", "image/png");
    return reply.send(buffer);
  });

  app.delete("/simulations/:id", { preHandler: app.requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteSimulation(request.user!.id, id);
    reply.code(204);
  });
}

function withStatusLabel<T extends { status: string }>(simulation: T): T & { statusLabel: string } {
  return {
    ...simulation,
    statusLabel: SIMULATION_STATUS_LABELS[simulation.status as SimulationStatus] ?? simulation.status,
  };
}
