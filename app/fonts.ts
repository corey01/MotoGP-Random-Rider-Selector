import { Inter } from "next/font/google";
import localFont from "next/font/local";

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: '--font-inter'
});

export const motoGP = localFont({ 
  src: './motogp.woff',
  display: 'swap',
  variable: '--font-motogp-font'  // Changed to be more specific
});
