import { PrismaClient } from "../generated/client/index.js";

declare global {
  // eslint-disable-next-line no-var
  var __relookPrisma: PrismaClient | undefined;
}

/**
 * Instance Prisma partagee (singleton) pour eviter l'epuisement du pool de
 * connexions en dev (hot-reload) comme documente par Prisma.
 */
export const prisma: PrismaClient =
  globalThis.__relookPrisma ??
  new PrismaClient({
    log: process.env["NODE_ENV"] === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env["NODE_ENV"] !== "production") {
  globalThis.__relookPrisma = prisma;
}

export * from "../generated/client/index.js";
