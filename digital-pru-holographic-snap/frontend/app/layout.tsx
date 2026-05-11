import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Juicy Juicy · Digital Pru Holographic Snap",
  description:
    "Digital Pru Snap Portal v2.0 — Hero Jo audio → φ-harmonic Isaac Sim bridge.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
