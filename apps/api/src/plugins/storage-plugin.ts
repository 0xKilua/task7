import fp from "fastify-plugin";
import type { StorageProvider } from "../lib/storage.js";

declare module "fastify" {
  interface FastifyInstance {
    storage: StorageProvider;
  }
}

export const storagePlugin = fp(async (app, opts: { storage: StorageProvider }) => {
  app.decorate("storage", opts.storage);
});
