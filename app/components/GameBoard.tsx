"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
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

// Tween a number toward its target; snaps instantly under reduced motion.
function useCountUp(value: number, reduced: boolean): number {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduced) { setDisplay(value); from.current = value; return; }
    const controls = animate(from.current, value, { duration: 0.4, ease: "easeOut", onUpdate: (v) => setDisplay(v) });
    from.current = value;
    return () => controls.stop();
  }, [value, reduced]);
  return display;
}

function MeterCard({ label, value, format, pct, color, reduced }: {
  label: string; value: number; format: (n: number) => string; pct: number | null; color: string; reduced: boolean;
}) {
  const display = useCountUp(value, reduced);
  return (
    <div className={styles.meter}>
      <span className={styles.meterLabel}>{label}</span>
      <span className={styles.meterValue}>{format(display)}</span>
      {pct !== null && (
        <span className={styles.gauge}>
          <i style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
        </span>
      )}
    </div>
  );
}

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
  const reduced = useReducedMotion() ?? false;
  const tap = reduced ? undefined : { scale: 0.96 };

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

  // Rubber-stamp "thunk" when an event choice is taken.
  const [stamp, setStamp] = useState<number | null>(null);
  const handleChoose = (id: string) => {
    onChoose(id);
    if (!reduced) {
      const k = performance.now();
      setStamp(k);
      setTimeout(() => setStamp((cur) => (cur === k ? null : cur)), 650);
    }
  };

  // Celebratory pulse when a publication lands (enhances the scene's ring).
  const prevPubs = useRef(s.publications);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (s.publications > prevPubs.current && !reduced) setPulse((p) => p + 1);
    prevPubs.current = s.publications;
  }, [s.publications, reduced]);

  return (
    <div className={styles.board}>
      <div className={styles.scene}>
        <LabScene s={s} onAct={onAct} />
        <div className={styles.sceneTag}>
          Term {Math.min(s.term, s.maxTerms)} / {s.maxTerms} · {s.role === "pi" ? "PI" : "junior"}
        </div>
        <button className={styles.mute} onClick={() => setMuted(toggleMute())} title={muted ? "Unmute" : "Mute"}>
          {muted ? "🔇" : "🔊"}
        </button>
        {pulse > 0 && (
          <motion.div
            key={pulse}
            initial={{ scale: 0.3, opacity: 0.85 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ position: "absolute", inset: "28%", border: "3px solid #f1c40f", borderRadius: "50%", pointerEvents: "none" }}
          />
        )}
      </div>

      <div className={styles.meters}>
        <MeterCard label="Time" value={meters.time} format={(n) => `${Math.round(n)} wk`} pct={(meters.time / 11) * 100} color="#F4D43C" reduced={reduced} />
        <MeterCard label="Money" value={meters.money} format={(n) => `£${(n / 1000).toFixed(0)}k`} pct={(meters.money / 30000) * 100} color="#54B089" reduced={reduced} />
        <MeterCard label="Morale" value={meters.morale} format={(n) => `${Math.round(n)}`} pct={meters.morale} color={meters.morale < 30 ? "#D85850" : "#54B089"} reduced={reduced} />
        <MeterCard label="Rep" value={meters.reputation} format={(n) => `h-${Math.round(n)}`} pct={(meters.reputation / 15) * 100} color="#F1EAD9" reduced={reduced} />
      </div>

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

      {paused && ev && (
        <div className={styles.docWrap}>
          <div className={styles.doc}>
            <div className={styles.kicker}>event{ev.rarity !== "common" ? ` · ${ev.rarity}` : ""}</div>
            <h2 className={styles.docTitle}>{ev.title}</h2>
            <p className={styles.docBody}>{ev.body}</p>
            <div className={styles.choices}>
              {ev.choices(s).filter((c) => !c.available || c.available(s)).map((c) => (
                <motion.button key={c.id} className={styles.choice} onClick={() => handleChoose(c.id)} whileTap={tap}>
                  <span>{c.label}</span>
                  {c.detail ? <span className={styles.choiceCost}>{c.detail}</span> : null}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!over && !paused && (
        <>
          <div className={styles.dock}>
            {ACTIONS.map(({ id, label, hint }) => {
              const v = canDo(s, id);
              return (
                <motion.button
                  key={id}
                  className={`${styles.act} ${id === "coffee" ? styles.coffee : ""}`}
                  onClick={() => onAct(id)}
                  disabled={!v.ok}
                  title={v.ok ? hint : v.reason}
                  whileTap={v.ok ? tap : undefined}
                >
                  <span className={styles.actLabel}>{label}</span>
                  <span className={styles.actHint}>{v.ok ? hint : v.reason}</span>
                </motion.button>
              );
            })}
          </div>
          <motion.button className={styles.endTurn} onClick={onEndTurn} whileTap={tap}>End term ▸</motion.button>
        </>
      )}

      <div className={styles.log}>
        <div className={styles.logHead}>log</div>
        <ul>{s.log.map((line, i) => <li key={i}>{line}</li>)}</ul>
      </div>

      {/* rubber-stamp on an event choice */}
      <AnimatePresence>
        {stamp !== null && (
          <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none", zIndex: 60 }}>
            <motion.div
              key={stamp}
              initial={{ scale: 2.2, opacity: 0, rotate: -18 }}
              animate={{ scale: 1, opacity: 1, rotate: -8 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 520, damping: 15 }}
              style={{
                padding: "8px 18px", border: "3px solid #c0392b", color: "#c0392b",
                borderRadius: 8, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
                fontSize: 22, letterSpacing: "0.1em", background: "rgba(241,234,217,0.92)",
              }}
            >
              ✓ FILED
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
