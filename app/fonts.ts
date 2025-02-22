import { Inter } from "next/font/google";
import localFont from "next/font/local";

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: '--font-inter'
});

export const motoGP = localFont({ 
  src: './motogp.woff2',
  display: 'swap',
  variable: '--font-motogp-font'  // Changed to be more specific
});

export const motoGPTextMed = localFont({
  src: './motogp-text-med.woff2'
})
export const motoGPTextBold = localFont({
  src: './motogp-text-bold.woff2'
})