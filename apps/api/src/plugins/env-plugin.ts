import fp from "fastify-plugin";
import type { Env } from "../env.js";

declare module "fastify" {
  interface FastifyInstance {
    env: Env;
  }
}

export const envPlugin = fp(async (app, opts: { env: Env }) => {
  app.decorate("env", opts.env);
});
