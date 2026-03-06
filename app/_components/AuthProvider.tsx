"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearAuthTokens,
  fetchJson,
  fetchWithAuthJson,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  type AuthUser,
} from "@/utils/auth";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

type LoginResponse = {
  ok: boolean;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type RegisterResponse = {
  ok: boolean;
  user: AuthUser;
};

type MeResponse = {
  ok: boolean;
  user: AuthUser;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const payload = await fetchWithAuthJson<MeResponse>("/auth/me");
    setUser(payload.user);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const payload = await fetchJson<LoginResponse>("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    setAuthTokens({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });
    setUser(payload.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      await fetchJson<RegisterResponse>("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, displayName }),
      });

      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await fetchJson<{ ok: boolean }>("/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      // Token cleanup still happens below.
    } finally {
      clearAuthTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrapAuth = async () => {
      const hasSession = Boolean(getAccessToken() || getRefreshToken());
      if (!hasSession) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const payload = await fetchWithAuthJson<MeResponse>("/auth/me");
        if (!cancelled) {
          setUser(payload.user);
        }
      } catch {
        clearAuthTokens();
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void bootstrapAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [isLoading, login, logout, refreshUser, register, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
