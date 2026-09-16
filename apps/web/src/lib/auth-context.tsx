"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PublicUser } from "@relook/types";
import { apiFetch, clearTokens, storeTokens } from "./api-client";

interface AuthState {
  user: PublicUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await apiFetch<PublicUser>("/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const hasToken = typeof window !== "undefined" && window.localStorage.getItem("relook_access_token");
    if (!hasToken) {
      setLoading(false);
      return;
    }
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiFetch<{ accessToken: string; refreshToken: string; user: PublicUser }>(
        "/auth/login",
        { method: "POST", body: { email, password }, skipAuth: true },
      );
      storeTokens(result.accessToken, result.refreshToken);
      setUser(result.user);
    },
    [],
  );

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const result = await apiFetch<{ accessToken: string; refreshToken: string; user: PublicUser }>(
        "/auth/register",
        { method: "POST", body: { email, password, displayName }, skipAuth: true },
      );
      storeTokens(result.accessToken, result.refreshToken);
      setUser(result.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    const refreshToken = window.localStorage.getItem("relook_refresh_token");
    try {
      await apiFetch("/auth/logout", { method: "POST", body: { refreshToken } });
    } catch {
      // meme si l'appel echoue, on nettoie l'etat local
    }
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit etre utilise a l'interieur de <AuthProvider>.");
  return ctx;
}
