"use client";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function getTokens(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof window === "undefined") return { accessToken: null, refreshToken: null };
  return {
    accessToken: window.localStorage.getItem("relook_access_token"),
    refreshToken: window.localStorage.getItem("relook_refresh_token"),
  };
}

export function storeTokens(accessToken: string, refreshToken: string): void {
  window.localStorage.setItem("relook_access_token", accessToken);
  window.localStorage.setItem("relook_refresh_token", refreshToken);
}

export function clearTokens(): void {
  window.localStorage.removeItem("relook_access_token");
  window.localStorage.removeItem("relook_refresh_token");
}

async function tryRefresh(): Promise<boolean> {
  const { refreshToken } = getTokens();
  if (!refreshToken) return false;
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) return false;
  const body = await response.json();
  storeTokens(body.accessToken, body.refreshToken);
  return true;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  isFormData?: boolean;
  skipAuth?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken } = getTokens();
  const headers: Record<string, string> = {};
  if (accessToken && !options.skipAuth) headers["Authorization"] = `Bearer ${accessToken}`;
  if (options.body && !options.isFormData) headers["Content-Type"] = "application/json";

  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.isFormData
        ? (options.body as FormData)
        : options.body
          ? JSON.stringify(options.body)
          : undefined,
    });

  let response = await doFetch();

  if (response.status === 401 && accessToken && !options.skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const { accessToken: newToken } = getTokens();
      headers["Authorization"] = `Bearer ${newToken}`;
      response = await doFetch();
    }
  }

  if (!response.ok) {
    let message = response.statusText;
    let code = "error";
    try {
      const body = await response.json();
      message = body.message ?? message;
      code = body.error ?? code;
    } catch {
      // reponse non-JSON (ex: erreur reseau amont)
    }
    throw new ApiError(response.status, code, message);
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.blob()) as unknown as T;
}

export function apiImageUrl(path: string): string {
  // Utilise pour <img src> : le navigateur ne peut pas joindre un en-tete
  // Authorization a une balise <img>, donc ces routes sont recuperees en
  // amont via fetch (blob) par les composants qui en ont besoin.
  return `${API_URL}${path}`;
}

export async function fetchAuthedBlobUrl(path: string): Promise<string> {
  const blob = await apiFetch<Blob>(path);
  return URL.createObjectURL(blob);
}

export { API_URL };
