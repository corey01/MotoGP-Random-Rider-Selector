import Header from "./_components/Header";
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
      <meta name="theme-color" content="#242424" />
      <body className={inter.className}>
        <main>
          <Header />
          {children}
        </main>
      </body>
    </html>
  );
}
