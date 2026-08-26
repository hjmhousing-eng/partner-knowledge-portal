import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner knowledge portal",
  description:
    "Pages in front of a Box library. Authors stay in Box; this site is the reader experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
