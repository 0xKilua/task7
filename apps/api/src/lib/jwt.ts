import jwt from "jsonwebtoken";
import type { Env } from "../env.js";
import type { UserRole } from "@relook/types";

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  type: "refresh";
  jti: string;
}

export function signAccessToken(env: Env, userId: string, role: UserRole): string {
  const payload: AccessTokenPayload = { sub: userId, role, type: "access" };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"] });
}

export function signRefreshToken(env: Env, userId: string, jti: string): string {
  const payload: RefreshTokenPayload = { sub: userId, type: "refresh", jti };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(env: Env, token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (typeof decoded === "string" || decoded["type"] !== "access") {
    throw new Error("Jeton d'acces invalide.");
  }
  return decoded as AccessTokenPayload;
}

export function verifyRefreshToken(env: Env, token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  if (typeof decoded === "string" || decoded["type"] !== "refresh") {
    throw new Error("Jeton de rafraichissement invalide.");
  }
  return decoded as RefreshTokenPayload;
}
