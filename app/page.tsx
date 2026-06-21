"use client";

import { FIELD_BY_ID } from "@/lib/game/fields";
import { activeEvent } from "@/lib/game/events/engine";
import { canDo, eventPending } from "@/lib/game/machine";
import { SCENARIOS } from "@/lib/game/scenarios";
import { useGameStore } from "@/lib/game/store";
import type { ActionId } from "@/lib/game/types";
import { Meter } from "./components/Meter";
import { SetupFlow } from "./components/SetupFlow";

const ACTION_LABELS: { id: ActionId; label: string; hint: string }[] = [
  { id: "experiment", label: "Run experiment", hint: "−3 wk, −£4,000 → +6 Knowledge" },
  { id: "paper", label: "Write paper", hint: "−3 wk, −£3,000 APC, needs 10 Knowledge → 2d6 roll" },
  { id: "grant", label: "Write grant", hint: "−5 wk, −£1,000 → 2d6 roll for £15,000" },
  { id: "mentor", label: "Mentor student", hint: "−½ day → +2 Knowledge, +2 Morale, +loyalty" },
  { id: "coffee", label: "Coffee", hint: "+2 wk, +15 Workload, −2 Morale" },
];

export default function Home() {
  const s = useGameStore();
  const { meters } = s;

  // Setup flow gates the game (spec §3).
  if (s.phase === "setup") return <SetupFlow onStart={s.start} />;

  const ev = activeEvent(s);
  const paused = eventPending(s);

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginBottom: 4 }}>Tenure Track</h1>
      <p style={{ color: "#666", marginTop: 0 }}>
        {s.scientistName} · {SCENARIOS[s.scenario].label} · {FIELD_BY_ID[s.field].label}
        {s.hasPartner ? ` · with ${s.partnerName}` : " · solo"}
      </p>

      <div style={{ margin: "12px 0", fontWeight: "bold" }}>
        Term {Math.min(s.term, s.maxTerms)} / {s.maxTerms} · {s.role === "pi" ? "PI" : "junior"}
      </div>

      <section aria-label="Meters">
        <Meter label="Time" value={String(meters.time)} unit="weeks" />
        <Meter label="Money" value={`£${meters.money.toLocaleString()}`} />
        <Meter label="Morale" value={String(meters.morale)} unit="/ 100" />
        <Meter label="Reputation" value={String(meters.reputation)} />
      </section>

      <section aria-label="Under the hood" style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12, color: "#aaa", textTransform: "uppercase" }}>
          {s.mode === "career" ? "resources" : "under the hood (hidden in final build)"}
        </div>
        <Meter label="Workload" value={String(s.workload)} unit="/ 100" muted />
        <Meter label="Knowledge" value={String(s.knowledge)} muted />
        <Meter label="Publications" value={String(s.publications)} muted />
        {s.hasPartner && <Meter label="Relationship" value={String(s.relationship)} unit="/ 100" muted />}
        <Meter label="Students" value={s.students.map((st) => `${st.name} ♥${st.loyalty}`).join(", ") || "—"} muted />
        <Meter label="Live fuses" value={s.fuses.map((f) => f.kind).join(", ") || "—"} muted />
      </section>

      {paused && ev && (
        <section aria-label="Event" style={{ marginTop: 16, border: "2px solid #333", padding: 12, background: "#fafafa" }}>
          <div style={{ fontSize: 12, color: "#aaa", textTransform: "uppercase" }}>
            event{ev.rarity !== "common" ? ` · ${ev.rarity}` : ""}
          </div>
          <h2 style={{ margin: "4px 0" }}>{ev.title}</h2>
          <p style={{ fontStyle: "italic", color: "#555", marginTop: 0 }}>{ev.body}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ev.choices(s).filter((c) => !c.available || c.available(s)).map((c) => (
              <button key={c.id} onClick={() => s.choose(c.id)} style={{ padding: "8px 12px", fontSize: 15, textAlign: "left", cursor: "pointer" }}>
                <strong>{c.label}</strong>
                {c.detail ? <span style={{ color: "#777" }}> — {c.detail}</span> : null}
              </button>
            ))}
          </div>
        </section>
      )}

      {s.phase === "playing" && !paused && (
        <>
          <section style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {ACTION_LABELS.map(({ id, label, hint }) => {
              const v = canDo(s, id);
              return (
                <button key={id} onClick={() => s.act(id)} disabled={!v.ok} title={v.ok ? hint : v.reason}
                  style={{ padding: "8px 12px", fontSize: 15, textAlign: "left", cursor: v.ok ? "pointer" : "not-allowed" }}>
                  <strong>{label}</strong> — {v.ok ? hint : v.reason}
                </button>
              );
            })}
          </section>
          <div style={{ marginTop: 16 }}>
            <button onClick={s.endTurn} style={{ padding: "10px 16px", fontSize: 16, cursor: "pointer", fontWeight: "bold" }}>
              End Turn ▶
            </button>
          </div>
        </>
      )}

      {s.phase === "gameover" && (
        <section style={{ marginTop: 16 }}>
          <h2 style={{ marginBottom: 4 }}>{s.outcome === "win" ? "🎓 You won." : "💀 Run over."}</h2>
          <p style={{ margin: "4px 0" }}>
            Final score: <strong>{s.score}</strong>{" "}
            <span style={{ color: "#888" }}>
              (3×Rep {3 * meters.reputation} + £/5k {Math.round(meters.money / 5000)} + 5×Pubs {5 * s.publications})
            </span>
          </p>
          <button onClick={s.reset} style={{ padding: "10px 16px", fontSize: 16, cursor: "pointer" }}>New Run</button>
        </section>
      )}

      <section aria-label="Log" style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, color: "#aaa", textTransform: "uppercase" }}>log</div>
        <ul style={{ paddingLeft: 18, margin: "4px 0", color: "#444", fontSize: 14 }}>
          {s.log.map((line, i) => <li key={i} style={{ marginBottom: 2 }}>{line}</li>)}
        </ul>
      </section>
    </main>
  );
}
