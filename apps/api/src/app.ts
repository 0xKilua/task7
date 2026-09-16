import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import { PHOTO_CONSTRAINTS } from "@relook/types";
import type { Env } from "./env.js";
import { AppError } from "./lib/errors.js";
import type { StorageProvider } from "./lib/storage.js";
import { accountRoutes } from "./modules/account/account.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { catalogRoutes } from "./modules/catalog/catalog.routes.js";
import { favoritesRoutes } from "./modules/favorites/favorites.routes.js";
import { photosRoutes } from "./modules/photos/photos.routes.js";
import { simulationsRoutes } from "./modules/simulations/simulations.routes.js";
import { authPlugin } from "./plugins/auth-plugin.js";
import { envPlugin } from "./plugins/env-plugin.js";
import { storagePlugin } from "./plugins/storage-plugin.js";

export async function buildApp(env: Env, storage: StorageProvider): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV === "development" ? { transport: { target: "pino-pretty" } } : true,
  });

  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  await app.register(multipart, {
    limits: { fileSize: PHOTO_CONSTRAINTS.maxFileSizeBytes, files: 1 },
  });

  await app.register(envPlugin, { env });
  await app.register(storagePlugin, { storage });
  await app.register(authPlugin);

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(authRoutes);
  await app.register(photosRoutes);
  await app.register(catalogRoutes);
  await app.register(simulationsRoutes);
  await app.register(favoritesRoutes);
  await app.register(accountRoutes);

  app.setErrorHandler((error: FastifyError | AppError, request, reply) => {
    if (error instanceof AppError) {
      reply.code(error.statusCode).send({ error: error.code, message: error.message });
      return;
    }
    if ((error as { validation?: unknown }).validation) {
      reply.code(400).send({ error: "validation_error", message: error.message });
      return;
    }
    request.log.error(error);
    reply.code(500).send({ error: "internal_error", message: "Erreur interne du serveur." });
  });

  return app;
}
