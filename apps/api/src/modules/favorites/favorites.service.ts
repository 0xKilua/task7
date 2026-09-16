import { prisma } from "@relook/db";
import { ConflictError, NotFoundError } from "../../lib/errors.js";

export async function addFavorite(userId: string, simulationId: string) {
  const simulation = await prisma.simulation.findFirst({
    where: { id: simulationId, userId, deletedAt: null },
  });
  if (!simulation) throw new NotFoundError("Simulation introuvable.");

  const existing = await prisma.favorite.findUnique({
    where: { userId_simulationId: { userId, simulationId } },
  });
  if (existing) throw new ConflictError("Deja en favoris.");

  return prisma.favorite.create({ data: { userId, simulationId } });
}

export async function removeFavorite(userId: string, simulationId: string) {
  await prisma.favorite.deleteMany({ where: { userId, simulationId } });
}

export async function listFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    include: { simulation: true },
    orderBy: { createdAt: "desc" },
  });
}
