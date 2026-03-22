const API = process.env.NEXT_PUBLIC_RACECAL_URL ?? "http://localhost:3001";

const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";

export interface AuthUser {
  id: string;
  email: string;
  role: "user" | "admin" | "legacy";
  displayName: string;
  onboardingComplete: boolean;
  profilePhotoUrl: string | null;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json();
  saveTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function fetchWithAuth(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const doFetch = (token: string) =>
    fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    });

  let token = getAccessToken();
  if (!token) throw new Error("Not authenticated");

  let res = await doFetch(token);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) throw new Error("Session expired");
    res = await doFetch(newToken);
  }

  return res;
}

export async function apiLogin(
  email: string,
  password: string
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? data.message ?? "Login failed");
  return data;
}

export async function apiRegister(
  email: string,
  password: string,
  displayName: string
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? data.message ?? "Registration failed");
  return data;
}

export async function apiLogout(refreshToken: string | null): Promise<void> {
  const token = getAccessToken();
  if (!token) return;

  await fetch(`${API}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {});
}

export async function apiMe(): Promise<AuthUser> {
  const res = await fetchWithAuth("/auth/me");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch user");
  return data.user ?? data;
}

export async function apiGoogleLogin(
  idToken: string
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const res = await fetch(`${API}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Google sign-in failed");
  return data;
}

export async function apiOnboarding(series: string[]): Promise<void> {
  const res = await fetchWithAuth("/subscriptions/onboarding", {
    method: "POST",
    body: JSON.stringify({ series }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Onboarding failed");
  }
}
