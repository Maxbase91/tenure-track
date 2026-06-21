"use client";

import { useEffect, useRef, useState } from "react";
import { activeEvent } from "@/lib/game/events/engine";
import { canDo, eventPending } from "@/lib/game/machine";
import type { ActionId, GameState } from "@/lib/game/types";
import { cueForLog, isMuted, play, toggleMute } from "@/lib/sound";
import { LabScene } from "./LabScene";
import styles from "./GameBoard.module.css";

const ACTIONS: { id: ActionId; label: string; hint: string }[] = [
  { id: "experiment", label: "Experiment", hint: "−3 wk · −£4k → +6 Knowledge" },
  { id: "paper", label: "Write paper", hint: "−3 wk · −£3k · needs 10 Know → 2d6" },
  { id: "grant", label: "Write grant", hint: "−5 wk · −£1k → 2d6 for £15k" },
  { id: "mentor", label: "Mentor", hint: "−½ day → +Know, +Morale, +loyalty" },
  { id: "coffee", label: "☕ Coffee", hint: "+2 wk · +Workload · −Morale" },
];

// Presentational board — every transition arrives via callbacks, so this serves
// both solo (useGameStore) and match (useMatchStore). Same engine APIs and sound
// cues as before; only the presentation changed.
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
  const career = s.mode === "career";

  // Sound cues (M6) — unchanged.
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

  const meterCard = (label: string, value: string, pct: number | null, color: string) => (
    <div className={styles.meter}>
      <span className={styles.meterLabel}>{label}</span>
      <span className={styles.meterValue}>{value}</span>
      {pct !== null && (
        <span className={styles.gauge}>
          <i style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
        </span>
      )}
    </div>
  );

  return (
    <div className={styles.board}>
      {/* the isometric lab — your existing scene, now framed */}
      <div className={styles.scene}>
        <LabScene s={s} />
        <div className={styles.sceneTag}>
          Term {Math.min(s.term, s.maxTerms)} / {s.maxTerms} · {s.role === "pi" ? "PI" : "junior"}
        </div>
        <button className={styles.mute} onClick={() => setMuted(toggleMute())} title={muted ? "Unmute" : "Mute"}>
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* the four meters as instruments */}
      <div className={styles.meters}>
        {meterCard("Time", `${meters.time} wk`, (meters.time / 11) * 100, "#F4D43C")}
        {meterCard("Money", `£${(meters.money / 1000).toFixed(0)}k`, (meters.money / 30000) * 100, "#54B089")}
        {meterCard("Morale", `${meters.morale}`, meters.morale, meters.morale < 30 ? "#D85850" : "#54B089")}
        {meterCard("Rep", `h-${meters.reputation}`, (meters.reputation / 15) * 100, "#F1EAD9")}
      </div>

      {/* under the hood */}
      <details className={styles.hood} open={career}>
        <summary>{career ? "resources" : "under the hood (hidden in final build)"}</summary>
        <div className={styles.hoodGrid}>
          <span>Workload <b>{s.workload}/100</b></span>
          <span>Knowledge <b>{s.knowledge}</b></span>
          <span>Publications <b>{s.publications}</b></span>
          {s.hasPartner && <span>Relationship <b>{s.relationship}/100</b></span>}
          <span className={styles.wide}>Students <b>{s.students.map((st) => `${st.name} ♥${st.loyalty}`).join(", ") || "—"}</b></span>
          {s.fuses.length > 0 && <span className={styles.wide}>Live fuses <b>{s.fuses.map((f) => f.kind).join(", ")}</b></span>}
        </div>
      </details>

      {/* event document */}
      {paused && ev && (
        <div className={styles.docWrap}>
          <div className={styles.doc}>
            <div className={styles.kicker}>event{ev.rarity !== "common" ? ` · ${ev.rarity}` : ""}</div>
            <h2 className={styles.docTitle}>{ev.title}</h2>
            <p className={styles.docBody}>{ev.body}</p>
            <div className={styles.choices}>
              {ev.choices(s).filter((c) => !c.available || c.available(s)).map((c) => (
                <button key={c.id} className={styles.choice} onClick={() => onChoose(c.id)}>
                  <span>{c.label}</span>
                  {c.detail ? <span className={styles.choiceCost}>{c.detail}</span> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* action dock + end turn */}
      {!over && !paused && (
        <>
          <div className={styles.dock}>
            {ACTIONS.map(({ id, label, hint }) => {
              const v = canDo(s, id);
              return (
                <button
                  key={id}
                  className={`${styles.act} ${id === "coffee" ? styles.coffee : ""}`}
                  onClick={() => onAct(id)}
                  disabled={!v.ok}
                  title={v.ok ? hint : v.reason}
                >
                  <span className={styles.actLabel}>{label}</span>
                  <span className={styles.actHint}>{v.ok ? hint : v.reason}</span>
                </button>
              );
            })}
          </div>
          <button className={styles.endTurn} onClick={onEndTurn}>End term ▸</button>
        </>
      )}

      {/* log */}
      <div className={styles.log}>
        <div className={styles.logHead}>log</div>
        <ul>{s.log.map((line, i) => <li key={i}>{line}</li>)}</ul>
      </div>
    </div>
  );
}
