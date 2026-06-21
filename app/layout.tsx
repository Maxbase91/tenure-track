import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tenure Track",
  description: "A satirical academic-life strategy game.",
  manifest: "/manifest.webmanifest",
};

// Phone-first (spec §1, §15).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ece5d6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Base styles (background, font) live in globals.css so every screen shares
  // one cohesive surface.
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
