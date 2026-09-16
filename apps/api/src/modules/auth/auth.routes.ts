import type { FastifyInstance } from "fastify";
import { LoginInput, RegisterInput } from "@relook/types";
import { loginUser, logoutUser, refreshTokens, registerUser } from "./auth.service.js";
import { ValidationError } from "../../lib/errors.js";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/register", async (request, reply) => {
    const parsed = RegisterInput.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);

    const result = await registerUser(app.env, parsed.data);
    reply.code(201);
    return result;
  });

  app.post("/auth/login", async (request) => {
    const parsed = LoginInput.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);

    return loginUser(app.env, parsed.data);
  });

  app.post("/auth/refresh", async (request) => {
    const body = request.body as { refreshToken?: string };
    if (!body.refreshToken) throw new ValidationError("refreshToken requis.");
    return refreshTokens(app.env, body.refreshToken);
  });

  app.post("/auth/logout", async (request, reply) => {
    const body = request.body as { refreshToken?: string };
    if (body.refreshToken) await logoutUser(body.refreshToken);
    reply.code(204);
  });

  app.get("/auth/me", { preHandler: app.requireAuth }, async (request) => {
    return request.user;
  });
}
