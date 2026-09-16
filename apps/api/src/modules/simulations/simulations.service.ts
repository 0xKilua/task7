import { prisma } from "@relook/db";
import { isValidSilhouetteDelta, SimulationRequest } from "@relook/types";
import type { Env } from "../../env.js";
import { NotFoundError, ValidationError } from "../../lib/errors.js";
import { getSimulationsQueue } from "./simulations.queue.js";

export async function createSimulation(env: Env, userId: string, input: unknown) {
  const parsed = SimulationRequest.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);
  const request = parsed.data;

  const photo = await prisma.photo.findFirst({ where: { id: request.photoId, userId, deletedAt: null } });
  if (!photo) throw new NotFoundError("Photo introuvable.");

  if (request.module === "silhouette") {
    if (request.silhouetteDeltaKg === undefined || !isValidSilhouetteDelta(request.silhouetteDeltaKg)) {
      throw new ValidationError("silhouetteDeltaKg doit etre un multiple de 2kg entre -20 et +20.");
    }
  }
  if (request.module === "couleur" && !request.hair?.colorId) {
    throw new ValidationError("hair.colorId requis pour le module couleur.");
  }
  if (request.module === "coiffure" && !request.hair?.hairstyleId) {
    throw new ValidationError("hair.hairstyleId requis pour le module coiffure.");
  }
  if (request.module === "vetements") {
    const hasGarment =
      request.outfit?.haut || request.outfit?.bas || request.outfit?.robe || request.outfit?.vesteSurCouche;
    if (!hasGarment) throw new ValidationError("Au moins un vetement doit etre selectionne.");
  }

  const simulation = await prisma.simulation.create({
    data: {
      userId,
      photoId: photo.id,
      module: request.module,
      status: "queued",
      requestJson: request,
    },
  });

  const queue = getSimulationsQueue(env);
  await queue.add("process", { simulationId: simulation.id }, { removeOnComplete: 100, removeOnFail: 100 });

  return simulation;
}

export async function getOwnedSimulation(userId: string, simulationId: string) {
  const simulation = await prisma.simulation.findFirst({
    where: { id: simulationId, userId, deletedAt: null },
  });
  if (!simulation) throw new NotFoundError("Simulation introuvable.");
  return simulation;
}

export async function listSimulations(userId: string, module?: string) {
  return prisma.simulation.findMany({
    where: { userId, deletedAt: null, module: module as never },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteSimulation(userId: string, simulationId: string) {
  const simulation = await getOwnedSimulation(userId, simulationId);
  await prisma.simulation.delete({ where: { id: simulation.id } });
}
