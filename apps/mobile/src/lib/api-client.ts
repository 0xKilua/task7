import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_URL = process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const ACCESS_KEY = "relook_access_token";
const REFRESH_KEY = "relook_refresh_token";

export async function storeTokens(accessToken: string, refreshToken: string): Promise<void> {
  await AsyncStorage.setMany({ [ACCESS_KEY]: accessToken, [REFRESH_KEY]: refreshToken });
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.removeMany([ACCESS_KEY, REFRESH_KEY]);
}

async function getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  const values = await AsyncStorage.getMany([ACCESS_KEY, REFRESH_KEY]);
  return { accessToken: values[ACCESS_KEY] ?? null, refreshToken: values[REFRESH_KEY] ?? null };
}

async function tryRefresh(): Promise<boolean> {
  const { refreshToken } = await getTokens();
  if (!refreshToken) return false;
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) return false;
  const body = await response.json();
  await storeTokens(body.accessToken, body.refreshToken);
  return true;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  isFormData?: boolean;
  skipAuth?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken } = await getTokens();
  const headers: Record<string, string> = {};
  if (accessToken && !options.skipAuth) headers["Authorization"] = `Bearer ${accessToken}`;
  if (options.body && !options.isFormData) headers["Content-Type"] = "application/json";

  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.isFormData ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
    });

  let response = await doFetch();

  if (response.status === 401 && accessToken && !options.skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const { accessToken: newToken } = await getTokens();
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
      // reponse non-JSON
    }
    throw new ApiError(response.status, code, message);
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return (await response.json()) as T;
  return (await response.blob()) as unknown as T;
}

/**
 * React Native <Image> peut recevoir des en-tetes via
 * `source={{ uri, headers: await authHeader() }}`, ce qui evite de devoir
 * convertir les photos protegees en data URI base64 (couteux en memoire).
 */
export async function authHeader(): Promise<Record<string, string>> {
  const { accessToken } = await getTokens();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}
