import localFont from "next/font/local";

export const inter = localFont({
  src: '../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
  display: "swap",
  variable: '--font-inter'
});

export const spaceGrotesk = localFont({
  src: '../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2',
  display: "swap",
  variable: '--font-space-grotesk',
});

export const motoGP = localFont({
  src: './motogp.woff2',
  display: 'swap',
  variable: '--font-motogp-font'
});

export const motoGPTextMed = localFont({
  src: './motogp-text-med.woff2'
});

export const motoGPTextBold = localFont({
  src: './motogp-text-bold.woff2'
});
