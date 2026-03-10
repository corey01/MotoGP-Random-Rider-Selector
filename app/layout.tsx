import Header from "./_components/Header";
import { AuthProvider } from "./_components/AuthProvider";
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
    <html lang="en">
      <meta name="theme-color" content="#242424" />
      <body className={`${inter.className} ${inter.variable} ${motoGP.variable}`}>
        <AuthProvider>
          <main>
            <Header />
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
