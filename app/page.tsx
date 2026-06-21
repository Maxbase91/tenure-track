"use client";

import { useState } from "react";
import { Home } from "./components/Home";
import { MatchApp } from "./components/MatchApp";
import { SoloApp } from "./components/SoloApp";

type AppMode = "home" | "solo" | "match";

// Top-level switch between the home menu, solo play, and a match (spec §16 M5).
export default function Page() {
  const [mode, setMode] = useState<AppMode>("home");
  const home = () => setMode("home");

  if (mode === "solo") return <SoloApp onExit={home} />;
  if (mode === "match") return <MatchApp onExit={home} />;
  return <Home onSolo={() => setMode("solo")} onMatch={() => setMode("match")} />;
}
