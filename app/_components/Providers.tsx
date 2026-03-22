"use client";

import { GoogleProvider } from "./GoogleProvider";
import { AuthProvider } from "./AuthProvider";
import { AuthGate } from "./AuthGate";
import Header from "./Header";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleProvider>
      <AuthProvider>
        <AuthGate>
          <Header />
          <main>{children}</main>
        </AuthGate>
      </AuthProvider>
    </GoogleProvider>
  );
}
