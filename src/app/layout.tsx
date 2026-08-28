import type { Metadata } from "next";
import { body, display } from "./fonts";
import { SiteShell } from "@/components/SiteShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Helios partner library",
  description:
    "Public specs and partner enablement in front of a Box library.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
