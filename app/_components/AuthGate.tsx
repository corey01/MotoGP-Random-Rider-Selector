"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./AuthProvider";
import {
  buildPathWithReturnTo,
  getCurrentPath,
  normalizeReturnTo,
  RETURN_TO_PARAM,
} from "@/utils/returnTo";

const PUBLIC_PATHS = ["/login", "/register"];
const ONBOARDING_PATH = "/onboarding";
const ONBOARDING_EXEMPT_PATHS = ["/results"];

function AuthGateInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnTo = normalizeReturnTo(searchParams.get(RETURN_TO_PARAM));

  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_PATHS.includes(pathname);
    const isOnboarding = pathname === ONBOARDING_PATH;

    if (!isAuthenticated && !isPublic && !isOnboarding) {
      const currentPath = getCurrentPath(pathname, searchParams);
      router.replace(buildPathWithReturnTo("/login", currentPath));
      return;
    }

    const isOnboardingExempt = ONBOARDING_EXEMPT_PATHS.some((p) => pathname.startsWith(p));
    const isReturnToExempt = returnTo != null && ONBOARDING_EXEMPT_PATHS.some((p) => returnTo.startsWith(p));
    if (isAuthenticated && user && !user.onboardingComplete && !isOnboarding && !isOnboardingExempt) {
      if (isReturnToExempt) {
        router.replace(returnTo);
      } else {
        router.replace(buildPathWithReturnTo(ONBOARDING_PATH, returnTo));
      }
      return;
    }

    if (isAuthenticated && user?.onboardingComplete && (isPublic || isOnboarding)) {
      router.replace(returnTo ?? "/");
    }
  }, [isLoading, isAuthenticated, pathname, returnTo, router, searchParams, user]);

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

export function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AuthGateInner>{children}</AuthGateInner>
    </Suspense>
  );
}
