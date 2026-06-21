"use client";

import { useEffect, useRef, useState } from "react";
import { activeEvent } from "@/lib/game/events/engine";
import { canDo, eventPending } from "@/lib/game/machine";
import type { ActionId, GameState } from "@/lib/game/types";
import { cueForLog, isMuted, play, toggleMute } from "@/lib/sound";
import { LabScene } from "./LabScene";
import { Meter } from "./Meter";

const ACTION_LABELS: { id: ActionId; label: string; hint: string }[] = [
  { id: "experiment", label: "Run experiment", hint: "−3 wk, −£4,000 → +6 Knowledge" },
  { id: "paper", label: "Write paper", hint: "−3 wk, −£3,000 APC, needs 10 Knowledge → 2d6 roll" },
  { id: "grant", label: "Write grant", hint: "−5 wk, −£1,000 → 2d6 roll for £15,000" },
  { id: "mentor", label: "Mentor student", hint: "−½ day → +2 Knowledge, +2 Morale, +loyalty" },
  { id: "coffee", label: "Coffee", hint: "+2 wk, +15 Workload, −2 Morale" },
];

// The shared playable board: meters, the under-the-hood panel, the event modal,
// the five actions, and End Turn. Presentational — all transitions come in via
// callbacks, so it serves both solo (useGameStore) and match (useMatchStore).
export function GameBoard({
  state: s,
  onAct,
  onChoose,
  onEndTurn,
}: {
  state: GameState;
  onAct: (a: ActionId) => void;
  onChoose: (id: string) => void;
  onEndTurn: () => void;
}) {
  const { meters } = s;
  const ev = activeEvent(s);
  const paused = eventPending(s);
  const over = s.phase === "gameover";

  // Sound cues react to state changes (M6). Refs avoid replaying on remount.
  const [muted, setMuted] = useState(false);
  const lastLog = useRef<string | undefined>(undefined);
  const lastEvent = useRef<string | undefined>(undefined);
  const lastOutcome = useRef<string | null>(null);
  useEffect(() => setMuted(isMuted()), []);
  useEffect(() => {
    if (s.outcome && s.outcome !== lastOutcome.current) play(s.outcome === "win" ? "win" : "loss");
    lastOutcome.current = s.outcome;
    if (s.eventQueue[0] && s.eventQueue[0] !== lastEvent.current) play("event");
    lastEvent.current = s.eventQueue[0];
    if (s.log[0] !== lastLog.current) {
      if (lastLog.current !== undefined) {
        const c = cueForLog(s.log[0]);
        if (c) play(c);
      }
      lastLog.current = s.log[0];
    }
  }, [s.log, s.eventQueue, s.outcome]);

  return (
    <>
      <LabScene s={s} />
      <div style={{ margin: "12px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: "bold" }}>
          Term {Math.min(s.term, s.maxTerms)} / {s.maxTerms} · {s.role === "pi" ? "PI" : "junior"}
        </span>
        <button onClick={() => setMuted(toggleMute())} title={muted ? "Unmute" : "Mute"} style={{ padding: "2px 8px", cursor: "pointer" }}>
          {muted ? "🔇" : "🔊"}
        </button>
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
              <button key={c.id} onClick={() => onChoose(c.id)} style={{ padding: "8px 12px", fontSize: 15, textAlign: "left", cursor: "pointer" }}>
                <strong>{c.label}</strong>
                {c.detail ? <span style={{ color: "#777" }}> — {c.detail}</span> : null}
              </button>
            ))}
          </div>
        </section>
      )}

      {!over && !paused && (
        <>
          <section style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {ACTION_LABELS.map(({ id, label, hint }) => {
              const v = canDo(s, id);
              return (
                <button key={id} onClick={() => onAct(id)} disabled={!v.ok} title={v.ok ? hint : v.reason}
                  style={{ padding: "8px 12px", fontSize: 15, textAlign: "left", cursor: v.ok ? "pointer" : "not-allowed" }}>
                  <strong>{label}</strong> — {v.ok ? hint : v.reason}
                </button>
              );
            })}
          </section>
          <div style={{ marginTop: 16 }}>
            <button onClick={onEndTurn} style={{ padding: "10px 16px", fontSize: 16, cursor: "pointer", fontWeight: "bold" }}>
              End Turn ▶
            </button>
          </div>
        </>
      )}

      <section aria-label="Log" style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, color: "#aaa", textTransform: "uppercase" }}>log</div>
        <ul style={{ paddingLeft: 18, margin: "4px 0", color: "#444", fontSize: 14 }}>
          {s.log.map((line, i) => <li key={i} style={{ marginBottom: 2 }}>{line}</li>)}
        </ul>
      </section>
    </>
  );
}
