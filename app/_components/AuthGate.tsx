"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

const PUBLIC_PATHS = ["/login", "/register"];
const ONBOARDING_PATH = "/onboarding";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_PATHS.includes(pathname);
    const isOnboarding = pathname === ONBOARDING_PATH;

    if (!isAuthenticated && !isPublic && !isOnboarding) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && user && !user.onboardingComplete && !isOnboarding) {
      router.replace("/onboarding");
      return;
    }

    if (isAuthenticated && user?.onboardingComplete && (isPublic || isOnboarding)) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--kc-text-2)',
        fontFamily: 'var(--font-space-grotesk)',
        fontSize: '0.875rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
