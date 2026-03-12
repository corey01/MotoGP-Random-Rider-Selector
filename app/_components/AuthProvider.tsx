"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  type AuthUser,
  apiGoogleLogin,
  apiLogin,
  apiLogout,
  apiMe,
  clearTokens,
  getRefreshToken,
  saveTokens,
} from "@/utils/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  loginWithGoogle: (idToken: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, try to restore session from stored tokens
  useEffect(() => {
    const restore = async () => {
      try {
        const me = await apiMe();
        setUser(me);
      } catch {
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };
    void restore();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    saveTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const data = await apiGoogleLogin(idToken);
    saveTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout(getRefreshToken());
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        isLoading,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
