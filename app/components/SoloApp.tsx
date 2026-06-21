"use client";

import { FIELD_BY_ID } from "@/lib/game/fields";
import { SCENARIOS } from "@/lib/game/scenarios";
import { useGameStore } from "@/lib/game/store";
import { GameBoard } from "./GameBoard";
import { SetupFlow } from "./SetupFlow";

// Solo play: the setup flow + pool, then the shared GameBoard wrapped with the
// header, communal-pool controls (§14), and the game-over summary.
export function SoloApp({ onExit }: { onExit: () => void }) {
  const s = useGameStore();
  const { meters } = s;

  if (s.phase === "setup") return <SetupFlow onStart={s.start} onOpen={s.openFromPool} />;

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginBottom: 4 }}>Tenure Track</h1>
      <p style={{ color: "#666", marginTop: 0 }}>
        {s.scientistName} · {SCENARIOS[s.scenario].label} · {FIELD_BY_ID[s.field].label}
        {s.hasPartner ? ` · with ${s.partnerName}` : " · solo"}
      </p>

      <GameBoard state={s} onAct={s.act} onChoose={s.choose} onEndTurn={s.endTurn} />

      {/* Communal pool sync (spec §14). */}
      <section aria-label="Pool" style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => s.saveToPool()} disabled={s.poolStatus === "saving"} style={{ padding: "6px 12px", cursor: s.poolStatus === "saving" ? "wait" : "pointer" }}>
          {s.poolId ? "Save to pool" : "Publish to pool"}
        </button>
        <span style={{ fontSize: 13, color: "#777" }}>
          {s.poolId ? `in pool · v${s.poolVersion}` : "not saved"}
          {s.poolStatus === "saving" && " · saving…"}
          {s.poolStatus === "saved" && " · saved ✓"}
          {s.poolStatus === "stale" && " · reloaded"}
          {s.poolStatus === "error" && " · error"}
        </span>
        {s.poolMessage && <span style={{ fontSize: 12, color: "#b00" }}>{s.poolMessage}</span>}
      </section>

      {s.phase === "gameover" && (
        <section style={{ marginTop: 16 }}>
          <h2 style={{ marginBottom: 4 }}>{s.outcome === "win" ? "🎓 You won." : "💀 Run over."}</h2>
          <p style={{ margin: "4px 0" }}>
            Final score: <strong>{s.score}</strong>{" "}
            <span style={{ color: "#888" }}>(3×Rep {3 * meters.reputation} + £/5k {Math.round(meters.money / 5000)} + 5×Pubs {5 * s.publications})</span>
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={s.reset} style={{ padding: "10px 16px", fontSize: 16, cursor: "pointer" }}>New Run</button>
            <button onClick={onExit} style={{ padding: "10px 16px", fontSize: 16, cursor: "pointer" }}>Main menu</button>
          </div>
        </section>
      )}

      <div style={{ marginTop: 24 }}>
        <button onClick={onExit} style={{ padding: "4px 8px", fontSize: 12, color: "#888" }}>← main menu</button>
      </div>
    </main>
  );
}
