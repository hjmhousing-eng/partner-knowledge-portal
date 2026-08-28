import { Figtree, Syne } from "next/font/google";

export const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

export const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});
