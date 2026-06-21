import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Tenure Track",
  description: "A satirical academic-life strategy game.",
  manifest: "/manifest.webmanifest",
};

// Phone-first (spec §1, §15).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a1a1a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          lineHeight: 1.5,
        }}
      >
        {children}
      </body>
    </html>
  );
}
