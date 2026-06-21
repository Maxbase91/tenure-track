"use client";

import { useGameStore } from "@/lib/game/store";
import { Meter } from "./components/Meter";

// M0 screen: the four quick-mode meters + a working end-turn button that drives
// the turn-loop state machine. Empty turns by design — actions land in M1.
export default function Home() {
  const { phase, term, maxTerms, meters, endTurn, reset } = useGameStore();

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginBottom: 4 }}>Tenure Track</h1>
      <p style={{ color: "#666", marginTop: 0 }}>
        Quick mode — The Postdoc Gamble (skeleton)
      </p>

      <div style={{ margin: "16px 0", fontWeight: "bold" }}>
        Term {Math.min(term, maxTerms)} / {maxTerms}
      </div>

      <section aria-label="Meters">
        <Meter label="Time" value={String(meters.time)} unit="weeks" />
        <Meter label="Money" value={`£${meters.money.toLocaleString()}`} />
        <Meter label="Morale" value={String(meters.morale)} unit="/ 100" />
        <Meter label="Reputation" value={String(meters.reputation)} />
      </section>

      <div style={{ marginTop: 24 }}>
        {phase === "playing" ? (
          <button
            onClick={endTurn}
            style={{ padding: "10px 16px", fontSize: 16, cursor: "pointer" }}
          >
            End Turn
          </button>
        ) : (
          <div>
            <p style={{ fontWeight: "bold" }}>
              Tenure clock ran out. Run over.
            </p>
            <button
              onClick={reset}
              style={{ padding: "10px 16px", fontSize: 16, cursor: "pointer" }}
            >
              New Run
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
