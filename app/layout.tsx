import Header from "./_components/Header";
import { inter, motoGP } from "./fonts";
import "./globals.css";

export const metadata = {
  title: "MotoGP Sweepstake Generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${motoGP.variable}`}>
      <meta name="theme-color" content="#242424" />
      <body>
        <main>
          <Header />
          {children}
        </main>
      </body>
    </html>
  );
}
