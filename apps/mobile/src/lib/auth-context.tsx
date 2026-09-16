import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, clearTokens, storeTokens } from "./api-client";

interface PublicUser {
  id: string;
  email: string;
  displayName?: string;
  role: "user" | "admin";
}

interface AuthState {
  user: PublicUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<PublicUser>("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiFetch<{ accessToken: string; refreshToken: string; user: PublicUser }>(
      "/auth/login",
      { method: "POST", body: { email, password }, skipAuth: true },
    );
    await storeTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
  }, []);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const result = await apiFetch<{ accessToken: string; refreshToken: string; user: PublicUser }>(
      "/auth/register",
      { method: "POST", body: { email, password, displayName }, skipAuth: true },
    );
    await storeTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit etre utilise a l'interieur de <AuthProvider>.");
  return ctx;
}
