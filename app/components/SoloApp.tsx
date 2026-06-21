"use client";

import type { CSSProperties } from "react";
import { FIELD_BY_ID } from "@/lib/game/fields";
import { SCENARIOS } from "@/lib/game/scenarios";
import { useGameStore } from "@/lib/game/store";
import { GameBoard } from "./GameBoard";
import { SetupFlow } from "./SetupFlow";

// Solo play: the setup flow + pool, then the shared GameBoard wrapped with a
// compact header, the communal-pool controls (§14), and the game-over summary.
// Presentation only.
export function SoloApp({ onExit }: { onExit: () => void }) {
  const s = useGameStore();
  const { meters } = s;

  if (s.phase === "setup") return <SetupFlow onStart={s.start} onOpen={s.openFromPool} />;

  const subtitle =
    `${s.scientistName} · ${SCENARIOS[s.scenario].label} · ${FIELD_BY_ID[s.field].label}` +
    (s.hasPartner ? ` · with ${s.partnerName}` : " · solo");

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "14px 12px 40px" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 4px", marginBottom: 12 }}>
        <button onClick={onExit} aria-label="Main menu" style={backStyle}>‹</button>
        <div style={{ lineHeight: 1.15, minWidth: 0 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 19, color: "#1b2a32" }}>Tenure Track</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#7c8a86", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle}</div>
        </div>
      </header>

      {/* the board as a unified dark device */}
      <div style={deviceStyle}>
        <GameBoard state={s} onAct={s.act} onChoose={s.choose} onEndTurn={s.endTurn} />
      </div>

      {/* communal pool (spec §14) */}
      <section aria-label="Pool" style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "0 4px" }}>
        <button onClick={() => s.saveToPool()} disabled={s.poolStatus === "saving"} style={{ ...pillStyle, cursor: s.poolStatus === "saving" ? "wait" : "pointer" }}>
          {s.poolId ? "Save to pool" : "Publish to pool"}
        </button>
        <span style={{ fontSize: 12.5, color: "#7c8a86", fontFamily: "'IBM Plex Mono', monospace" }}>
          {s.poolId ? `in pool · v${s.poolVersion}` : "not saved"}
          {s.poolStatus === "saving" && " · saving…"}
          {s.poolStatus === "saved" && " · saved ✓"}
          {s.poolStatus === "stale" && " · reloaded"}
          {s.poolStatus === "error" && " · error"}
        </span>
        {s.poolMessage && <span style={{ fontSize: 12, color: "#b0463f" }}>{s.poolMessage}</span>}
      </section>

      {s.phase === "gameover" && (
        <section style={overStyle}>
          <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9a8f74", fontFamily: "'IBM Plex Mono', monospace" }}>
            run over
          </div>
          <h2 style={{ margin: "4px 0 2px", fontFamily: "'Fraunces', serif", fontSize: 26, color: s.outcome === "win" ? "#2f7d52" : "#b0463f" }}>
            {s.outcome === "win" ? "You made it." : "Not this time."}
          </h2>
          <p style={{ margin: "2px 0 14px", color: "#3a463f" }}>
            Final score <strong style={{ fontSize: 18 }}>{s.score}</strong>{" "}
            <span style={{ color: "#8a7f64", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
              (3×Rep {3 * meters.reputation} + £/5k {Math.round(meters.money / 5000)} + 5×Pubs {5 * s.publications})
            </span>
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={s.reset} style={primaryStyle}>New run</button>
            <button onClick={onExit} style={pillStyle}>Main menu</button>
          </div>
        </section>
      )}
    </main>
  );
}

const backStyle: CSSProperties = {
  flex: "none", width: 34, height: 34, borderRadius: 10, border: "1px solid #d6cdb8",
  background: "#fbf7ec", color: "#1b2a32", fontSize: 22, lineHeight: 1, cursor: "pointer",
};
const deviceStyle: CSSProperties = {
  background: "linear-gradient(#1b2a32, #16242b)", borderRadius: 20, padding: "10px 6px 14px",
  boxShadow: "0 24px 60px -28px rgba(20,30,36,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
};
const pillStyle: CSSProperties = {
  border: "1px solid #cdbf9f", background: "#fbf7ec", color: "#22312f", borderRadius: 999,
  padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
};
const primaryStyle: CSSProperties = {
  border: "none", background: "#f4d43c", color: "#1b2a32", borderRadius: 999,
  padding: "8px 18px", fontSize: 13, fontWeight: 800, cursor: "pointer",
};
const overStyle: CSSProperties = {
  marginTop: 14, background: "#f1ead9", border: "1px solid #d6cbb0", borderRadius: 16,
  padding: "16px 18px", boxShadow: "0 20px 46px -22px rgba(0,0,0,0.4)",
};
