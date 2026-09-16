import { z } from "zod";

export const UserRole = z.enum(["user", "admin"]);
export type UserRole = z.infer<typeof UserRole>;

export const PublicUser = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  role: UserRole,
  createdAt: z.string().datetime(),
});
export type PublicUser = z.infer<typeof PublicUser>;

export const RegisterInput = z.object({
  email: z.string().email(),
  password: z.string().min(10, "10 caracteres minimum"),
  displayName: z.string().min(1).max(80).optional(),
});
export type RegisterInput = z.infer<typeof RegisterInput>;

export const LoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInput>;

export const AuthTokens = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthTokens = z.infer<typeof AuthTokens>;
