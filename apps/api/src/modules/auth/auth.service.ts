import { createHash, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@relook/db";
import type { LoginInput, RegisterInput } from "@relook/types";
import type { Env } from "../../env.js";
import { ConflictError, UnauthorizedError } from "../../lib/errors.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";

const PASSWORD_SALT_ROUNDS = 12;

export interface AuthTokensWithUser {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; displayName: string | null; role: "user" | "admin" };
}

export async function registerUser(env: Env, input: RegisterInput): Promise<AuthTokensWithUser> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError("Un compte existe deja avec cet email.");
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, displayName: input.displayName },
  });

  return issueTokens(env, user.id, user.email, user.role, user.displayName);
}

export async function loginUser(env: Env, input: LoginInput): Promise<AuthTokensWithUser> {
  const user = await prisma.user.findFirst({ where: { email: input.email, deletedAt: null } });
  if (!user) throw new UnauthorizedError("Identifiants invalides.");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Identifiants invalides.");

  return issueTokens(env, user.id, user.email, user.role, user.displayName);
}

export async function refreshTokens(env: Env, refreshToken: string): Promise<AuthTokensWithUser> {
  let payload;
  try {
    payload = verifyRefreshToken(env, refreshToken);
  } catch {
    throw new UnauthorizedError("Jeton de rafraichissement invalide ou expire.");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new UnauthorizedError("Session expiree, merci de vous reconnecter.");
  }

  const user = await prisma.user.findFirst({ where: { id: payload.sub, deletedAt: null } });
  if (!user) throw new UnauthorizedError("Utilisateur introuvable.");

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

  return issueTokens(env, user.id, user.email, user.role, user.displayName);
}

export async function logoutUser(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function issueTokens(
  env: Env,
  userId: string,
  email: string,
  role: "user" | "admin",
  displayName: string | null,
): Promise<AuthTokensWithUser> {
  const accessToken = signAccessToken(env, userId, role);
  const jti = randomUUID();
  const refreshToken = signRefreshToken(env, userId, jti);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: addDuration(new Date(), env.JWT_REFRESH_TTL),
    },
  });

  return { accessToken, refreshToken, user: { id: userId, email, displayName, role } };
}

function hashToken(token: string): string {
  // Un simple hash (pas de secret) suffit ici : le jeton lui-meme est deja
  // signe et impossible a deviner ; on ne stocke jamais le jeton en clair.
  return createHash("sha256").update(token).digest("hex");
}

function addDuration(base: Date, duration: string): Date {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
  const value = Number(match[1]);
  const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return new Date(base.getTime() + value * unitMs[match[2] as string]!);
}
