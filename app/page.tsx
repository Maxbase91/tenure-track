"use client";

import { canDo } from "@/lib/game/machine";
import { useGameStore } from "@/lib/game/store";
import type { ActionId } from "@/lib/game/types";
import { Meter } from "./components/Meter";

// M1 screen: the five real actions, the four visible meters, a dim "under the
// hood" panel (Workload / Knowledge / Publications — surfaced for tuning), a
// result log, and a game-over summary. Keep it ugly.

const ACTION_LABELS: { id: ActionId; label: string; hint: string }[] = [
  { id: "experiment", label: "Run experiment", hint: "−3 wk, −£4,000 → +6 Knowledge" },
  { id: "paper", label: "Write paper", hint: "−3 wk, −£3,000 APC, needs 10 Knowledge → 2d6 roll" },
  { id: "grant", label: "Write grant", hint: "−5 wk, −£1,000 → 2d6 roll for £15,000" },
  { id: "mentor", label: "Mentor student", hint: "−½ day → +2 Knowledge, +2 Morale" },
  { id: "coffee", label: "Coffee", hint: "+2 wk, +15 Workload, −2 Morale" },
];

export default function Home() {
  const s = useGameStore();
  const { meters } = s;

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginBottom: 4 }}>Tenure Track</h1>
      <p style={{ color: "#666", marginTop: 0 }}>Quick mode — The Postdoc Gamble</p>

      <div style={{ margin: "12px 0", fontWeight: "bold" }}>
        Term {Math.min(s.term, s.maxTerms)} / {s.maxTerms}
      </div>

      <section aria-label="Meters">
        <Meter label="Time" value={String(meters.time)} unit="weeks" />
        <Meter label="Money" value={`£${meters.money.toLocaleString()}`} />
        <Meter label="Morale" value={String(meters.morale)} unit="/ 100" />
        <Meter label="Reputation" value={String(meters.reputation)} />
      </section>

      <section aria-label="Under the hood" style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12, color: "#aaa", textTransform: "uppercase" }}>
          under the hood (hidden in final build)
        </div>
        <Meter label="Workload" value={String(s.workload)} unit="/ 100" muted />
        <Meter label="Knowledge" value={String(s.knowledge)} muted />
        <Meter label="Publications" value={String(s.publications)} muted />
      </section>

      {s.phase === "playing" ? (
        <>
          <section style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {ACTION_LABELS.map(({ id, label, hint }) => {
              const v = canDo(s, id);
              return (
                <button
                  key={id}
                  onClick={() => s.act(id)}
                  disabled={!v.ok}
                  title={v.ok ? hint : v.reason}
                  style={{ padding: "8px 12px", fontSize: 15, textAlign: "left", cursor: v.ok ? "pointer" : "not-allowed" }}
                >
                  <strong>{label}</strong> — {v.ok ? hint : v.reason}
                </button>
              );
            })}
          </section>

          <div style={{ marginTop: 16 }}>
            <button
              onClick={s.endTurn}
              style={{ padding: "10px 16px", fontSize: 16, cursor: "pointer", fontWeight: "bold" }}
            >
              End Turn ▶
            </button>
          </div>
        </>
      ) : (
        <section style={{ marginTop: 16 }}>
          <h2 style={{ marginBottom: 4 }}>
            {s.outcome === "win" ? "🎓 You won." : "💀 Run over."}
          </h2>
          <p style={{ margin: "4px 0" }}>
            Final score: <strong>{s.score}</strong>{" "}
            <span style={{ color: "#888" }}>
              (3×Rep {3 * meters.reputation} + £/5k {Math.round(meters.money / 5000)} + 5×Pubs {5 * s.publications})
            </span>
          </p>
          <button onClick={s.reset} style={{ padding: "10px 16px", fontSize: 16, cursor: "pointer" }}>
            New Run
          </button>
        </section>
      )}

      <section aria-label="Log" style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, color: "#aaa", textTransform: "uppercase" }}>log</div>
        <ul style={{ paddingLeft: 18, margin: "4px 0", color: "#444", fontSize: 14 }}>
          {s.log.map((line, i) => (
            <li key={i} style={{ marginBottom: 2 }}>{line}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
