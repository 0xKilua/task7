import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@relook/db";
import type { UserRole } from "@relook/types";
import { UnauthorizedError, ForbiddenError } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/jwt.js";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authPlugin = fp(async (app) => {
  app.decorateRequest("user", undefined);

  app.decorate("requireAuth", async (request: FastifyRequest) => {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedError("En-tete Authorization manquant.");
    }
    const token = header.slice("Bearer ".length);
    let payload;
    try {
      payload = verifyAccessToken(app.env, token);
    } catch {
      throw new UnauthorizedError("Jeton d'acces invalide ou expire.");
    }

    // Le jeton signe reste valide jusqu'a son expiration meme si le compte
    // a ete supprime entre-temps (RGPD) : on verifie donc systematiquement
    // que l'utilisateur existe toujours plutot que de faire confiance au
    // seul contenu du jeton.
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true } });
    if (!user) {
      throw new UnauthorizedError("Ce compte n'existe plus.");
    }
    request.user = { id: user.id, role: user.role };
  });

  app.decorate("requireAdmin", async (request: FastifyRequest, reply: FastifyReply) => {
    await app.requireAuth(request, reply);
    if (request.user?.role !== "admin") {
      throw new ForbiddenError("Reserve aux administrateurs.");
    }
  });
});
