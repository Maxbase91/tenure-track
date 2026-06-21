"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { canDo } from "@/lib/game/machine";
import type { ActionId, GameState } from "@/lib/game/types";

// The isometric "growing lab" (spec §16 M6), now interactive (Stage 2): objects
// are tappable/focusable controls that dispatch the five actions via onAct. The
// scene stays presentational — it only calls the callback; canDo gates each
// hotspot. The GameBoard action dock remains as the labelled fallback.

const TW = 44; // iso tile width
const TH = 22; // iso tile height

// Same labels/hints as the action dock (duplicated to avoid a GameBoard↔Scene
// import cycle). Shown on hover / focus; tap fires the action.
const INFO: Record<ActionId, { label: string; hint: string }> = {
  experiment: { label: "Experiment", hint: "−3 wk · −£4k → +6 Knowledge" },
  paper: { label: "Write paper", hint: "−3 wk · −£3k · needs 10 Know" },
  grant: { label: "Write grant", hint: "−5 wk · −£1k → 2d6 for £15k" },
  mentor: { label: "Mentor", hint: "−½ day → +Know, +Morale" },
  coffee: { label: "Coffee", hint: "+2 wk · +Workload · −Morale" },
};

function proj(col: number, row: number, ox: number, oy: number) {
  return { x: ox + (col - row) * (TW / 2), y: oy + (col + row) * (TH / 2) };
}

function darken(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `rgb(${r},${g},${b})`;
}

function IsoBox({ cx, cy, size, h, base }: { cx: number; cy: number; size: number; h: number; base: string }) {
  const tw = (TW / 2) * size;
  const th = (TH / 2) * size;
  const T = `${cx},${cy - th}`, R = `${cx + tw},${cy}`, B = `${cx},${cy + th}`, L = `${cx - tw},${cy}`;
  const T2 = `${cx},${cy - th - h}`, R2 = `${cx + tw},${cy - h}`, B2 = `${cx},${cy + th - h}`, L2 = `${cx - tw},${cy - h}`;
  return (
    <g>
      <polygon points={`${L} ${B} ${B2} ${L2}`} fill={darken(base, 0.78)} />
      <polygon points={`${B} ${R} ${R2} ${B2}`} fill={darken(base, 0.6)} />
      <polygon points={`${T2} ${R2} ${B2} ${L2}`} fill={base} />
    </g>
  );
}

function Tile({ cx, cy, fill }: { cx: number; cy: number; fill: string }) {
  return <polygon points={`${cx},${cy - TH / 2} ${cx + TW / 2},${cy} ${cx},${cy + TH / 2} ${cx - TW / 2},${cy}`} fill={fill} stroke="#d8d4cc" strokeWidth={0.5} />;
}

function Student({ cx, cy, loyalty, delay }: { cx: number; cy: number; loyalty: number; delay: number }) {
  const coat = loyalty >= 50 ? "#3f7d5a" : loyalty >= 25 ? "#7a8aa0" : "#9c6b6b";
  return (
    <g className="tt-bob" style={{ animationDelay: `${delay}s` }}>
      <ellipse cx={cx} cy={cy + 4} rx={8} ry={3} fill="rgba(0,0,0,0.12)" />
      <path d={`M${cx - 5},${cy} Q${cx},${cy - 14} ${cx + 5},${cy} Z`} fill={coat} />
      <circle cx={cx} cy={cy - 14} r={4} fill="#f1c9a5" />
      <text x={cx} y={cy - 20} textAnchor="middle" fontSize={7} fill="#c0392b">{loyalty >= 50 ? "♥" : ""}</text>
    </g>
  );
}

// Floating SVG label (clamped to the viewBox; flips below if it would clip top).
function Tooltip({ cx, top, label, text }: { cx: number; top: number; label: string; text: string }) {
  const w = 158, h = 30;
  const x = Math.max(4, Math.min(376 - w, cx - w / 2));
  const y = top - h - 6 < 4 ? top + 8 : top - h - 6;
  return (
    <g pointerEvents="none">
      <rect x={x} y={y} width={w} height={h} rx={6} fill="rgba(27,42,50,0.95)" />
      <text x={x + 9} y={y + 13} fontSize={10} fontWeight={700} fill="#f1ead9">{label}</text>
      <text x={x + 9} y={y + 25} fontSize={9} fill="#9fb2b9" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{text}</text>
    </g>
  );
}

// A focusable, accessible interaction layer over an already-drawn object.
function Hotspot({
  id, label, text, enabled, x, y, w, h, active, setActive, onAct,
}: {
  id: ActionId; label: string; text: string; enabled: boolean;
  x: number; y: number; w: number; h: number;
  active: string | null; setActive: Dispatch<SetStateAction<string | null>>; onAct: (a: ActionId) => void;
}) {
  const key = `${id}@${x},${y}`; // unique per placement (experiment has several)
  const isActive = active === key;
  const fire = () => { if (enabled) onAct(id); };
  // Functional updates: only clear if *this* hotspot is still the active one,
  // so moving focus/hover between hotspots can't stomp the new one to null.
  const leave = () => setActive((a) => (a === key ? null : a));
  return (
    <g
      role="button"
      tabIndex={enabled ? 0 : -1}
      aria-label={`${label}. ${text}`}
      aria-disabled={!enabled}
      onClick={fire}
      onKeyDown={(e) => { if (enabled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); fire(); } }}
      onPointerEnter={() => setActive(key)}
      onPointerLeave={leave}
      onFocus={() => setActive(key)}
      onBlur={leave}
      style={{ cursor: enabled ? "pointer" : "not-allowed", outline: "none" }}
    >
      <rect x={x} y={y} width={w} height={h} fill="transparent" />
      {!enabled && <rect x={x} y={y} width={w} height={h} rx={6} fill="rgba(236,230,216,0.5)" />}
      {isActive && (
        <rect x={x} y={y} width={w} height={h} rx={6}
          fill={enabled ? "rgba(244,212,60,0.16)" : "rgba(216,88,80,0.10)"}
          stroke={enabled ? "#f4d43c" : "#d85850"} strokeWidth={2} />
      )}
      {isActive && <Tooltip cx={x + w / 2} top={y} label={label} text={text} />}
    </g>
  );
}

export function LabScene({ s, onAct }: { s: GameState; onAct?: (a: ActionId) => void }) {
  const [active, setActive] = useState<string | null>(null);

  const rep = s.meters.reputation;
  const level = rep >= 12 ? 3 : rep >= 8 ? 2 : rep >= 4 ? 1 : 0;
  const n = Math.min(5, 3 + level); // floor grows with Reputation
  const ox = 190, oy = 92;
  const back = (c: number, r: number) => proj(c, r, ox, oy);

  // Floor tiles.
  const tiles = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const { x, y } = proj(c, r, ox, oy);
      tiles.push(<Tile key={`t${c}-${r}`} cx={x} cy={y} fill={(c + r) % 2 ? "#efe9dd" : "#e7e0d2"} />);
    }

  // Back-wall framed papers — one per publication (display cap 8).
  const pubs = Math.min(s.publications, 8);
  const papers = Array.from({ length: pubs }, (_, i) => (
    <g key={`p${i}`}>
      <rect x={36 + i * 36} y={14} width={26} height={20} fill="#fff" stroke="#333" strokeWidth={1.2} />
      <line x1={40 + i * 36} y1={20} x2={58 + i * 36} y2={20} stroke="#bbb" />
      <line x1={40 + i * 36} y1={24} x2={58 + i * 36} y2={24} stroke="#bbb" />
      <line x1={40 + i * 36} y1={28} x2={54 + i * 36} y2={28} stroke="#bbb" />
    </g>
  ));

  const fr = back(n - 1, 0); // freezer (back-right)
  const cf = back(0, 0); // centrifuge (back-left)
  const cm = back(n - 1, n - 1); // coffee machine (front-right)
  const pl = back(0, n - 1); // plant (front-left)

  // New foreground furniture: a writing desk (paper) and a filing cabinet (grant).
  const frontY = oy + (n - 1) * (TH / 2 + TH / 2); // ~ front-row centre y
  const desk = { x: 150, y: frontY + 18 };
  const filing = { x: 238, y: frontY + 18 };

  const morale = s.meters.morale;
  const leaf = morale >= 60 ? "#4caf50" : morale >= 30 ? "#9e9d24" : "#8d6e63";
  const droop = morale >= 60 ? 0 : morale >= 30 ? 6 : 14;

  const clutter = Math.min(8, Math.floor(s.workload / 12));
  const scraps = Array.from({ length: clutter }, (_, i) => {
    const t = back(1 + (i % Math.max(1, n - 2)), 1 + ((i * 2) % Math.max(1, n - 1)));
    return <rect key={`s${i}`} x={t.x - 4 + (i % 3) * 3} y={t.y - 2} width={6} height={4} fill="#cfc8ba" transform={`rotate(${(i * 37) % 60 - 30} ${t.x} ${t.y})`} />;
  });

  // Benches.
  const benchPos: { x: number; y: number }[] = [];
  for (let c = 1; c < n - 1; c++) benchPos.push(back(c, 1));
  const benches = benchPos.map((b, i) => <IsoBox key={`b${i}`} cx={b.x} cy={b.y} size={0.8} h={9} base="#c9b79a" />);

  // Students.
  const studentPos = s.students.slice(0, 4).map((_, i) => back(1 + (i % 2), 2 + (i % 2)));
  const students = s.students.slice(0, 4).map((st, i) => (
    <Student key={`st${i}`} cx={studentPos[i].x} cy={studentPos[i].y} loyalty={st.loyalty} delay={i * 0.4} />
  ));

  const tint = morale >= 60 ? "rgba(255,206,84,0.07)" : morale < 30 ? "rgba(70,100,200,0.12)" : "rgba(0,0,0,0)";

  // --- interaction layer -----------------------------------------------------
  const av = (id: ActionId) => canDo(s, id);
  const hot = (id: ActionId, x: number, y: number, w: number, h: number) => {
    const v = av(id);
    return (
      <Hotspot key={`h-${id}-${x}-${y}`} id={id} label={INFO[id].label}
        text={v.ok ? INFO[id].hint : v.reason ?? ""} enabled={!!onAct && v.ok}
        x={x} y={y} w={w} h={h} active={active} setActive={setActive} onAct={onAct ?? (() => {})} />
    );
  };
  const hotspots = onAct ? [
    ...benchPos.map((b) => hot("experiment", b.x - 18, b.y - 20, 36, 28)),
    ...(level >= 1 ? [hot("experiment", fr.x - 16, fr.y - 44, 32, 54)] : []),
    hot("coffee", cm.x - 13, cm.y - 26, 26, 40),
    ...studentPos.map((t) => hot("mentor", t.x - 10, t.y - 24, 20, 30)),
    hot("paper", desk.x - 18, desk.y - 28, 36, 36),
    hot("grant", filing.x - 14, filing.y - 32, 28, 42),
  ] : [];

  return (
    <svg viewBox="0 0 380 250" width="100%" style={{ display: "block", background: "linear-gradient(#f5f2ea,#ece6d8)", borderRadius: 8 }}
      role={onAct ? "group" : "img"} aria-label={onAct ? "Your lab — tap an object to act" : "Your lab"}>
      {/* back wall */}
      <rect x={20} y={6} width={340} height={36} fill="#f0ece2" />
      {papers}

      {tiles}
      {scraps}

      {/* centrifuge (haunted — always spinning) */}
      <g>
        <IsoBox cx={cf.x} cy={cf.y} size={0.7} h={14} base="#9aa7b3" />
        <g className="tt-spin">
          <ellipse cx={cf.x} cy={cf.y - 14} rx={9} ry={4.5} fill="#5b6b78" />
          <line x1={cf.x - 8} y1={cf.y - 14} x2={cf.x + 8} y2={cf.y - 14} stroke="#cdd6df" strokeWidth={1.5} />
        </g>
      </g>

      {/* −80 freezer */}
      {level >= 1 && (
        <g>
          <IsoBox cx={fr.x} cy={fr.y} size={0.8} h={40} base="#dfe7ee" />
          <rect x={fr.x - 8} y={fr.y - 38} width={16} height={3} fill="#aebfcb" />
          <text x={fr.x} y={fr.y - 18} textAnchor="middle" fontSize={9} fill="#7fa6c4">❄</text>
        </g>
      )}

      {benches}
      {students}

      {/* writing desk + monitor (Write paper) */}
      <g>
        <IsoBox cx={desk.x} cy={desk.y} size={0.7} h={7} base="#8a6f52" />
        <IsoBox cx={desk.x} cy={desk.y - 7} size={0.34} h={12} base="#2e3b42" />
        <rect x={desk.x - 6} y={desk.y - 19} width={12} height={8} rx={1} fill="#86b6cc" />
        <rect x={desk.x - 7} y={desk.y - 5} width={14} height={3} rx={1} fill="#cbb79a" />
      </g>

      {/* filing cabinet (Write grant) */}
      <g>
        <IsoBox cx={filing.x} cy={filing.y} size={0.45} h={26} base="#6b7b86" />
        {[8, 15, 22].map((dy) => (
          <g key={dy}>
            <line x1={filing.x - 7} y1={filing.y - dy} x2={filing.x + 7} y2={filing.y - dy + 3.5} stroke="#46535c" strokeWidth={1} />
            <rect x={filing.x - 2} y={filing.y - dy + 1} width={4} height={2} fill="#cdd6db" />
          </g>
        ))}
      </g>

      {/* coffee machine + steam */}
      <g>
        <IsoBox cx={cm.x} cy={cm.y} size={0.6} h={18} base="#4a4a4a" />
        <rect x={cm.x - 3} y={cm.y - 10} width={6} height={5} fill="#2b2b2b" />
        {[0, 0.5, 1].map((d) => (
          <ellipse key={d} className="tt-steam" style={{ animationDelay: `${d}s` }} cx={cm.x} cy={cm.y - 20} rx={3} ry={5} fill="rgba(180,180,180,0.6)" />
        ))}
      </g>

      {/* plant (Morale) */}
      <g>
        <IsoBox cx={pl.x} cy={pl.y} size={0.4} h={7} base="#b5651d" />
        <g transform={`rotate(${droop} ${pl.x} ${pl.y - 7})`}>
          <ellipse cx={pl.x - 4} cy={pl.y - 12} rx={5} ry={3} fill={leaf} />
          <ellipse cx={pl.x + 4} cy={pl.y - 12} rx={5} ry={3} fill={leaf} />
          <ellipse cx={pl.x} cy={pl.y - 16} rx={4} ry={5} fill={leaf} />
        </g>
      </g>

      {/* tenure clock */}
      <g>
        <circle cx={350} cy={24} r={14} fill="#fff" stroke="#333" strokeWidth={1.5} />
        <line x1={350} y1={24} x2={350} y2={13} stroke="#333" strokeWidth={1.5}
          transform={`rotate(${(Math.min(s.term, s.maxTerms) / s.maxTerms) * 360} 350 24)`} />
        <text x={350} y={46} textAnchor="middle" fontSize={8} fill="#666">{Math.min(s.term, s.maxTerms)}/{s.maxTerms}</text>
      </g>

      {/* celebratory ring on a new publication */}
      {pubs > 0 && <circle key={`flash${s.publications}`} className="tt-pulse" cx={190} cy={120} r={60} fill="none" stroke="#f1c40f" strokeWidth={3} />}

      <rect x={0} y={0} width={380} height={250} fill={tint} pointerEvents="none" />
      {morale < 30 && <rect className="tt-flicker" x={0} y={0} width={380} height={250} fill="rgba(20,20,40,0.10)" pointerEvents="none" />}

      {/* interactive hotspots last so highlights/labels sit on top */}
      {hotspots}
    </svg>
  );
}
