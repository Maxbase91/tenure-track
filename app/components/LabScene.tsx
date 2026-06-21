"use client";

import type { GameState } from "@/lib/game/types";

// The isometric "growing lab" (spec §16 M6). Pure SVG, driven entirely by
// GameState: the floor and kit grow with Reputation, publications hang on the
// back wall, students bob, the haunted centrifuge spins, coffee steams, and a
// plant tracks Morale. AI-generated raster sprites can replace these vector
// sprites later on the PixiJS path (§15).

const TW = 44; // iso tile width
const TH = 22; // iso tile height

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

// An iso cuboid sitting on tile centre (cx, cy), footprint `size`, height H.
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

export function LabScene({ s }: { s: GameState }) {
  const rep = s.meters.reputation;
  const level = rep >= 12 ? 3 : rep >= 8 ? 2 : rep >= 4 ? 1 : 0;
  const n = Math.min(5, 3 + level); // floor grows with Reputation
  const ox = 190, oy = 92;

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

  // Equipment placed on tiles (back-to-front order is roughly handled by layout).
  const back = (c: number, r: number) => proj(c, r, ox, oy);
  const fr = back(n - 1, 0); // freezer (back-right)
  const cf = back(0, 0); // centrifuge (back-left)
  const cm = back(n - 1, n - 1); // coffee machine (front-right)
  const pl = back(0, n - 1); // plant (front-left)

  // Morale-driven plant.
  const morale = s.meters.morale;
  const leaf = morale >= 60 ? "#4caf50" : morale >= 30 ? "#9e9d24" : "#8d6e63";
  const droop = morale >= 60 ? 0 : morale >= 30 ? 6 : 14;

  // Workload clutter: scattered paper scraps, more as it climbs.
  const clutter = Math.min(8, Math.floor(s.workload / 12));
  const scraps = Array.from({ length: clutter }, (_, i) => {
    const t = back(1 + (i % Math.max(1, n - 2)), 1 + ((i * 2) % Math.max(1, n - 1)));
    return <rect key={`s${i}`} x={t.x - 4 + (i % 3) * 3} y={t.y - 2} width={6} height={4} fill="#cfc8ba" transform={`rotate(${(i * 37) % 60 - 30} ${t.x} ${t.y})`} />;
  });

  // Benches across the back rows (grow with level).
  const benches = [];
  for (let c = 1; c < n - 1; c++) {
    const b = back(c, 1);
    benches.push(<IsoBox key={`b${c}`} cx={b.x} cy={b.y} size={0.8} h={9} base="#c9b79a" />);
  }

  // Students.
  const students = s.students.slice(0, 4).map((st, i) => {
    const t = back(1 + (i % 2), 2 + (i % 2));
    return <Student key={`st${i}`} cx={t.x} cy={t.y} loyalty={st.loyalty} delay={i * 0.4} />;
  });

  // Morale lighting overlay.
  const tint = morale >= 60 ? "rgba(255,206,84,0.07)" : morale < 30 ? "rgba(70,100,200,0.12)" : "rgba(0,0,0,0)";

  return (
    <svg viewBox="0 0 380 250" width="100%" style={{ display: "block", background: "linear-gradient(#f5f2ea,#ece6d8)", borderRadius: 8 }} role="img" aria-label="Your lab">
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

      {/* −80 freezer (appears once the lab has any standing) */}
      {level >= 1 && (
        <g>
          <IsoBox cx={fr.x} cy={fr.y} size={0.8} h={40} base="#dfe7ee" />
          <rect x={fr.x - 8} y={fr.y - 38} width={16} height={3} fill="#aebfcb" />
          <text x={fr.x} y={fr.y - 18} textAnchor="middle" fontSize={9} fill="#7fa6c4">❄</text>
        </g>
      )}

      {benches}
      {students}

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

      {/* celebratory ring on a new publication (re-keys to replay) */}
      {pubs > 0 && <circle key={`flash${s.publications}`} className="tt-pulse" cx={190} cy={120} r={60} fill="none" stroke="#f1c40f" strokeWidth={3} />}

      <rect x={0} y={0} width={380} height={250} fill={tint} pointerEvents="none" />
      {morale < 30 && <rect className="tt-flicker" x={0} y={0} width={380} height={250} fill="rgba(20,20,40,0.10)" pointerEvents="none" />}
    </svg>
  );
}
