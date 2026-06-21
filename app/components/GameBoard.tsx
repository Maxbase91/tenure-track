"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { activeEvent } from "@/lib/game/events/engine";
import { canDo, eventPending } from "@/lib/game/machine";
import type { ActionId, GameState } from "@/lib/game/types";
import { cueForLog, isMuted, play, toggleMute } from "@/lib/sound";
import styles from "./GameBoard.module.css";
import { LabScene } from "./LabScene";
import { ConferenceScene } from "./ConferenceScene";

// The four real actions — how you spend a term. Coffee is NOT here: it's a
// booster (rendered separately) that buys time back, not a peer of these.
const ACTIONS: { id: ActionId; label: string; hint: string }[] = [
  { id: "experiment", label: "Run experiment", hint: "3 weeks · £4,000 → new data" },
  { id: "paper", label: "Write paper", hint: "3 weeks · £3,000 · needs 10 Knowledge" },
  { id: "grant", label: "Apply for grant", hint: "5 weeks · £1,000 → a shot at £15,000" },
  { id: "mentor", label: "Mentor student", hint: "Half a day → progress + loyalty" },
];

// Crisp monoline icons (currentColor) — replace the old emoji glyphs.
const sIcon = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const ICON: Record<ActionId, JSX.Element> = {
  experiment: <svg {...sIcon}><path d="M9 3h6M10 3v5L5.6 16.4A2 2 0 0 0 7.4 19.4h9.2a2 2 0 0 0 1.8-3L14 8V3" /><path d="M8 14h8" /></svg>,
  paper: <svg {...sIcon}><path d="M6 3h7l5 5v13H6z" /><path d="M13 3v5h5" /><path d="M9 13h6M9 16.5h6" /></svg>,
  grant: <svg {...sIcon}><circle cx="12" cy="12" r="8.5" /><path d="M9.5 16h5M9 12.2h3.4M11 16v-4.7A2.4 2.4 0 0 1 15 9.8" /></svg>,
  mentor: <svg {...sIcon}><circle cx="9" cy="8.5" r="3" /><path d="M3.8 19a5.2 5.2 0 0 1 10.4 0" /><path d="M15.5 6.2a3 3 0 0 1 0 5.6M16 13.6A5.2 5.2 0 0 1 20 18.5" /></svg>,
  coffee: <svg {...sIcon}><path d="M4 8.5h12V13a4.5 4.5 0 0 1-4.5 4.5H8.5A4.5 4.5 0 0 1 4 13z" /><path d="M16 9.5h2.2a2.3 2.3 0 0 1 0 4.6H16" /><path d="M7 3.2c0 1 .9 1 .9 2M11 3.2c0 1 .9 1 .9 2" /></svg>,
};

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
        <span className={styles.gauge}><i style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} /></span>
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
  const tap = reduced ? undefined : { scale: 0.97 };

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
      if (lastLog.current !== undefined) { const c = cueForLog(s.log[0]); if (c) play(c); }
      lastLog.current = s.log[0];
    }
  }, [s.log, s.eventQueue, s.outcome]);

  // Outcome toast: surface the newest log line briefly, then let it fade.
  const [toast, setToast] = useState<string | null>(null);
  const toastSeen = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (s.log[0] && s.log[0] !== toastSeen.current) {
      if (toastSeen.current !== undefined) {
        setToast(s.log[0]);
        const t = setTimeout(() => setToast(null), 2800);
        toastSeen.current = s.log[0];
        return () => clearTimeout(t);
      }
      toastSeen.current = s.log[0];
    }
  }, [s.log]);

  const coffee = canDo(s, "coffee");

  return (
    <div className={styles.board}>
      {/* status */}
      <div className={styles.status}>
        <span className={styles.role}>{s.role === "pi" ? "PI" : "Junior"}</span>
        <span className={styles.term}>Term {Math.min(s.term, s.maxTerms)} of {s.maxTerms}</span>
        <button className={styles.mute} onClick={() => setMuted(toggleMute())} title={muted ? "Unmute" : "Mute"}>
          {muted ? "Sound off" : "Sound on"}
        </button>
      </div>

      {/* scene — shows lab or conference based on active event */}
      <div className={styles.scene}>
        {ev?.id === "conference" ? <ConferenceScene s={s} /> : <LabScene s={s} />}
      </div>

      {/* vital signs */}
      <div className={styles.meters}>
        <MeterCard label="Time" value={meters.time} format={(n) => `${Math.round(n)} wk`} pct={(meters.time / 11) * 100} color="#F4D43C" reduced={reduced} />
        <MeterCard label="Money" value={meters.money} format={(n) => `£${(n / 1000).toFixed(0)}k`} pct={(meters.money / 30000) * 100} color="#54B089" reduced={reduced} />
        <MeterCard label="Morale" value={meters.morale} format={(n) => `${Math.round(n)}`} pct={meters.morale} color={meters.morale < 30 ? "#D85850" : "#54B089"} reduced={reduced} />
        <MeterCard label="Rep" value={meters.reputation} format={(n) => `h-${Math.round(n)}`} pct={(meters.reputation / 15) * 100} color="#F1EAD9" reduced={reduced} />
      </div>

      {/* outcome toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className={styles.toast} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* event document */}
      {paused && ev && (
        <div className={styles.docWrap}>
          <div className={styles.doc}>
            <div className={styles.kicker}>event{ev.rarity !== "common" ? ` · ${ev.rarity}` : ""}</div>
            <h2 className={styles.docTitle}>{ev.title}</h2>
            <p className={styles.docBody}>{ev.body}</p>
            <div className={styles.choices}>
              {ev.choices(s).filter((c) => !c.available || c.available(s)).map((c) => (
                <motion.button key={c.id} className={styles.choice} onClick={() => onChoose(c.id)} whileTap={tap}>
                  <span>{c.label}</span>
                  {c.detail ? <span className={styles.choiceCost}>{c.detail}</span> : null}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* actions + booster + advance */}
      {!over && !paused && (
        <>
          <div className={styles.actionsHead}>This term</div>
          <div className={styles.actions}>
            {ACTIONS.map(({ id, label, hint }) => {
              const v = canDo(s, id);
              return (
                <motion.button key={id} className={styles.act} onClick={() => onAct(id)} disabled={!v.ok}
                  title={v.ok ? hint : v.reason} whileTap={v.ok ? tap : undefined}>
                  <span className={styles.actTop}>
                    <span className={styles.actIcon}>{ICON[id]}</span>
                    <span className={styles.actLabel}>{label}</span>
                  </span>
                  <span className={styles.actHint}>{v.ok ? hint : v.reason}</span>
                </motion.button>
              );
            })}
          </div>

          {/* booster — coffee buys time back; distinct from actions */}
          <motion.button className={styles.booster} onClick={() => onAct("coffee")} disabled={!coffee.ok}
            title={coffee.ok ? "Buy time this term" : coffee.reason} whileTap={coffee.ok ? tap : undefined}>
            <span className={styles.boosterIcon}>{ICON.coffee}</span>
            <span className={styles.boosterText}>
              <span className={styles.boosterLabel}>Coffee</span>
              <span className={styles.boosterHint}>{coffee.ok ? "+2 weeks this term · raises Workload" : coffee.reason}</span>
            </span>
          </motion.button>

          <motion.button className={styles.endTurn} onClick={onEndTurn} whileTap={tap}>End term ▸</motion.button>
        </>
      )}

      {/* details, tucked away */}
      <details className={styles.hood} open={career}>
        <summary>{career ? "Details" : "Under the hood (hidden in final build)"}</summary>
        <div className={styles.hoodGrid}>
          <span>Workload <b>{s.workload}/100</b></span>
          <span>Knowledge <b>{s.knowledge}</b></span>
          <span>Publications <b>{s.publications}</b></span>
          {s.hasPartner && <span>Relationship <b>{s.relationship}/100</b></span>}
          <span className={styles.wide}>Students <b>{s.students.map((st) => `${st.name} ♥${st.loyalty}`).join(", ") || "—"}</b></span>
          {s.fuses.length > 0 && <span className={styles.wide}>Live fuses <b>{s.fuses.map((f) => f.kind).join(", ")}</b></span>}
        </div>
      </details>

      <details className={styles.recent}>
        <summary>Recent</summary>
        <ul>{s.log.slice(0, 12).map((line, i) => <li key={i}>{line}</li>)}</ul>
      </details>
    </div>
  );
}
