"use client";

// Conference hall scene — shown during the "conference" game event.
// Display-only. No callbacks.

import type { GameState } from "@/lib/game/types";
import { Scientist } from "./Scientist";
import type { ScientistMood } from "./Scientist";

// Audience silhouette — head + body block
function AudienceHead({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 1.1} fill="#0d1820" />
      <rect
        x={cx - r * 0.6}
        y={cy}
        width={r * 1.2}
        height={r * 2}
        rx={r * 0.3}
        fill="#0d1820"
      />
    </g>
  );
}

// Projector beam polygon — very subtle warm light
function ProjectorBeam({
  tipX,
  bl,
  br,
}: {
  tipX: number;
  bl: [number, number];
  br: [number, number];
}) {
  return (
    <polygon
      points={`${tipX},0 ${bl[0]},${bl[1]} ${br[0]},${br[1]}`}
      fill="rgba(255,240,200,0.04)"
      pointerEvents="none"
    />
  );
}

export function ConferenceScene({ s }: { s: GameState }) {
  const mood: ScientistMood =
    s.meters.morale >= 50 ? "presenting" : "stressed";

  const scientistName = s.scientistName || "Dr. Anonymous";

  // Row 1 — 6 heads, r=14, y=130
  const row1 = [30, 80, 130, 350, 400, 450];
  // Row 2 — 8 heads, r=10, y=108
  const row2 = [30, 80, 118, 155, 325, 362, 400, 440];
  // Row 3 — 5 heads, r=8, y=92
  const row3 = [60, 110, 370, 420, 450];

  return (
    <svg
      viewBox="0 0 480 220"
      width="100%"
      role="img"
      aria-label="Academic conference presentation"
      style={{ display: "block", borderRadius: 16, background: "#1b2a32" }}
    >
      {/* Layer 1 — Auditorium background */}
      <rect x={0} y={0} width={480} height={155} fill="#0f1922" />
      <rect x={0} y={150} width={480} height={70} fill="#141e24" />
      <line x1={0} y1={155} x2={480} y2={155} stroke="rgba(255,255,255,0.04)" strokeWidth={2} />

      {/* Layer 6 — Stage lighting (drawn early — behind screen for correct depth) */}
      {/* Left spotlight beam */}
      <ProjectorBeam tipX={80} bl={[180, 155]} br={[220, 155]} />
      {/* Right spotlight beam */}
      <ProjectorBeam tipX={400} bl={[260, 155]} br={[300, 155]} />
      {/* Center warm fill on stage */}
      <ellipse cx={240} cy={155} rx={80} ry={20} fill="rgba(255,220,100,0.06)" />

      {/* Layer 2 — Projection screen */}
      {/* Screen glow */}
      <rect x={135} y={5} width={210} height={125} rx={5} fill="rgba(241,234,217,0.08)" />
      {/* Projector beam from ceiling center */}
      <polygon
        points="240,0 140,16 340,16"
        fill="rgba(255,240,200,0.03)"
        pointerEvents="none"
      />
      {/* Screen frame */}
      <rect x={140} y={10} width={200} height={115} rx={3} fill="#0a1218" stroke="#2e4953" strokeWidth={2} />
      {/* Screen surface */}
      <rect x={146} y={16} width={188} height={103} rx={2} fill="#f1ead9" />
      {/* Slide content */}
      {/* Title block */}
      <rect x={158} y={30} width={100} height={8} rx={2} fill="#1b2a32" />
      {/* Subtitle lines */}
      <rect x={158} y={44} width={80} height={5} rx={1.5} fill="#2e4953" />
      <rect x={158} y={52} width={80} height={5} rx={1.5} fill="#2e4953" />
      <rect x={158} y={60} width={80} height={5} rx={1.5} fill="#2e4953" />
      {/* Graph area */}
      <rect x={158} y={68} width={120} height={40} rx={2} fill="rgba(27,42,50,0.1)" stroke="rgba(27,42,50,0.2)" strokeWidth={0.5} />
      {/* Bar chart bars */}
      <rect x={168} y={88} width={12} height={18} fill="#54b089" />
      <rect x={184} y={82} width={12} height={24} fill="#f4d43c" />
      <rect x={200} y={94} width={12} height={12} fill="#d85850" />
      {/* Conference name on slide */}
      <text x={240} y={100} fontSize={7} fill="#9a8f74" fontFamily="'IBM Plex Mono', monospace" textAnchor="middle">
        LISBON 2026
      </text>

      {/* Layer 3 — Audience silhouettes */}
      {/* Row 3 — smallest, furthest */}
      {row3.map((x, i) => (
        <AudienceHead key={`r3-${i}`} cx={x} cy={92} r={8} />
      ))}
      {/* Row 2 — medium */}
      {row2.map((x, i) => (
        <AudienceHead key={`r2-${i}`} cx={x} cy={108} r={10} />
      ))}
      {/* Row 1 — largest, closest — with a couple of notebook papers */}
      {row1.map((x, i) => (
        <g key={`r1-${i}`}>
          <AudienceHead cx={x} cy={130} r={14} />
          {/* Notebooks for two front-row heads */}
          {(i === 1 || i === 3) && (
            <rect
              x={x - 10}
              y={140}
              width={20}
              height={14}
              rx={2}
              fill="rgba(241,234,217,0.06)"
            />
          )}
        </g>
      ))}

      {/* Layer 4 — Podium */}
      {/* Podium body trapezoid */}
      <polygon points="190,155 290,155 280,200 200,200" fill="#243a44" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      {/* Podium top */}
      <rect x={185} y={148} width={110} height={10} rx={2} fill="#2e4953" />
      {/* Podium front panel */}
      <rect x={200} y={165} width={80} height={20} rx={2} fill="#1b2a32" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      {/* Name badge text */}
      <text
        x={240}
        y={179}
        fontSize={7}
        fill="rgba(241,234,217,0.6)"
        fontFamily="'IBM Plex Mono', monospace"
        textAnchor="middle"
      >
        {scientistName}
      </text>
      {/* Microphone stem */}
      <line x1={240} y1={148} x2={240} y2={136} stroke="#9fb2b9" strokeWidth={1.5} strokeLinecap="round" />
      {/* Microphone head */}
      <ellipse cx={240} cy={134} rx={5} ry={8} fill="#1b2a32" stroke="#9fb2b9" strokeWidth={1.5} />

      {/* Layer 5 — Scientist at podium */}
      <foreignObject x={206} y={70} width={56} height={80}>
        <Scientist mood={mood} size={56} flipped={false} />
      </foreignObject>

      {/* Layer 7 — Conference name kicker */}
      <text
        x={240}
        y={216}
        fontSize={8}
        fill="rgba(159,178,185,0.5)"
        fontFamily="'IBM Plex Mono', monospace"
        textAnchor="middle"
      >
        ACADEMIC CONFERENCE · LISBON 2026
      </text>
    </svg>
  );
}
