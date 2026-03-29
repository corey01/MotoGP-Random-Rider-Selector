import type { Metadata, Viewport } from "next";
import { Providers } from "./_components/Providers";
import { inter, spaceGrotesk, motoGP } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "RaceCal",
  description: "Multi-series motorsport calendar",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/android-chrome-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/android-chrome-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
    ],
    shortcut: ["/favicon.ico"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0e0e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${motoGP.variable}`} style={{ fontFamily: 'var(--font-space-grotesk), var(--font-inter), sans-serif' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
