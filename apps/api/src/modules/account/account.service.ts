import { prisma } from "@relook/db";
import type { StorageProvider } from "../../lib/storage.js";

export async function getProfile(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, displayName: true, role: true, referenceWeightKg: true, createdAt: true },
  });
}

export async function updateProfile(
  userId: string,
  input: { displayName?: string; referenceWeightKg?: number },
) {
  return prisma.user.update({
    where: { id: userId },
    data: { displayName: input.displayName, referenceWeightKg: input.referenceWeightKg },
    select: { id: true, email: true, displayName: true, role: true, referenceWeightKg: true },
  });
}

/**
 * Suppression de compte (droit a l'effacement RGPD) : supprime
 * immediatement les fichiers stockes (photos + resultats de simulation)
 * puis le compte, ce qui entraine en cascade (contraintes Prisma) la
 * suppression des photos/simulations/favoris/jetons associes en base.
 */
export async function deleteAccount(storage: StorageProvider, userId: string): Promise<void> {
  const photos = await prisma.photo.findMany({ where: { userId }, select: { storageKey: true } });
  const simulations = await prisma.simulation.findMany({
    where: { userId, resultStorageKey: { not: null } },
    select: { resultStorageKey: true },
  });

  await Promise.all([
    ...photos.map((p) => storage.deleteObject(p.storageKey)),
    ...simulations.map((s) => storage.deleteObject(s.resultStorageKey!)),
  ]);

  await prisma.user.delete({ where: { id: userId } });
}
