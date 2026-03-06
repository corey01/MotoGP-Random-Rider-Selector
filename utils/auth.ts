export type AuthRole = "user" | "admin";

export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  role: AuthRole;
  profilePhotoUrl: string | null;
  authProvider: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_TOKEN_STORAGE_KEY = "auth:accessToken";
const REFRESH_TOKEN_STORAGE_KEY = "auth:refreshToken";

let refreshInFlight: Promise<AuthTokens | null> | null = null;

function hasWindow() {
  return typeof window !== "undefined";
}

function readStorage(key: string): string | null {
  if (!hasWindow()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function removeStorage(key: string) {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

export function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_RACECAL_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_RACECAL_URL is not set");
  }
  return baseUrl.replace(/\/$/, "");
}

export function buildApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export function getAccessToken(): string | null {
  return readStorage(ACCESS_TOKEN_STORAGE_KEY);
}

export function getRefreshToken(): string | null {
  return readStorage(REFRESH_TOKEN_STORAGE_KEY);
}

export function getAuthTokens(): AuthTokens | null {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function setAuthTokens(tokens: AuthTokens) {
  writeStorage(ACCESS_TOKEN_STORAGE_KEY, tokens.accessToken);
  writeStorage(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
}

export function clearAuthTokens() {
  removeStorage(ACCESS_TOKEN_STORAGE_KEY);
  removeStorage(REFRESH_TOKEN_STORAGE_KEY);
}

function withAuthorizationHeader(
  headers: HeadersInit | undefined,
  accessToken: string | null
): Headers {
  const next = new Headers(headers ?? {});
  if (accessToken) {
    next.set("Authorization", `Bearer ${accessToken}`);
  } else {
    next.delete("Authorization");
  }
  return next;
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  } catch {}
  return `${fallback} (${response.status})`;
}

async function refreshTokens(): Promise<AuthTokens | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthTokens();
    return null;
  }

  try {
    const response = await fetch(buildApiUrl("/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearAuthTokens();
      return null;
    }

    const payload = (await response.json()) as Partial<AuthTokens>;
    if (!payload.accessToken || !payload.refreshToken) {
      clearAuthTokens();
      return null;
    }

    const nextTokens = {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    };
    setAuthTokens(nextTokens);
    return nextTokens;
  } catch {
    clearAuthTokens();
    return null;
  }
}

async function refreshTokensOnce(): Promise<AuthTokens | null> {
  if (!refreshInFlight) {
    refreshInFlight = refreshTokens().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function fetchWithAuth(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = buildApiUrl(path);
  const doRequest = (accessToken: string | null) =>
    fetch(url, {
      ...init,
      headers: withAuthorizationHeader(init.headers, accessToken),
    });

  const response = await doRequest(getAccessToken());
  if (response.status !== 401) return response;

  const refreshed = await refreshTokensOnce();
  if (!refreshed) return response;

  const retryResponse = await doRequest(refreshed.accessToken);
  if (retryResponse.status === 401) {
    clearAuthTokens();
  }
  return retryResponse;
}

export async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(buildApiUrl(path), init);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Request failed"));
  }

  return (await response.json()) as T;
}

export async function fetchWithAuthJson<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetchWithAuth(path, init);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Authenticated request failed"));
  }

  return (await response.json()) as T;
}
