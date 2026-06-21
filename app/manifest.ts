import type { MetadataRoute } from "next";

// PWA manifest (spec §15 — phone-first installable PWA). Icons arrive with the
// M6 visual upgrade; M0 ships the installable shell only.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tenure Track",
    short_name: "Tenure Track",
    description: "A satirical academic-life strategy game.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a1a1a",
  };
}
