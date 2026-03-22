import { Providers } from "./_components/Providers";
import { inter, spaceGrotesk, motoGP } from "./fonts";
import "./globals.css";

export const metadata = {
  title: "RaceCal",
  description: "Multi-series motorsport calendar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <meta name="theme-color" content="#0e0e0e" />
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${motoGP.variable}`} style={{ fontFamily: 'var(--font-space-grotesk), var(--font-inter), sans-serif' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
