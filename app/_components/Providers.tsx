"use client";

import { GoogleProvider } from "./GoogleProvider";
import { AuthProvider } from "./AuthProvider";
import { AuthGate } from "./AuthGate";
import Header from "./Header";
import { SubscriptionsProvider } from "@/utils/SubscriptionsContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleProvider>
      <AuthProvider>
        <SubscriptionsProvider>
          <AuthGate>
            <Header />
            <main>{children}</main>
          </AuthGate>
        </SubscriptionsProvider>
      </AuthProvider>
    </GoogleProvider>
  );
}
