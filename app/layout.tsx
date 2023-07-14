import { inter } from "./fonts";
import "./globals.css";

export const metadata = {
  title: "MotoGP Rider Selector",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
