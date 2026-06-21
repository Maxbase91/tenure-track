"use client";

// Side-view lab scene. Display-only — no callbacks, no game state mutations.
// Reads GameState to drive all visual indicators.

import { useReducedMotion } from "framer-motion";
import type { GameState } from "@/lib/game/types";
import { Scientist } from "./Scientist";
import type { ScientistMood } from "./Scientist";

function deriveMood(s: GameState): ScientistMood {
  if (s.phase === "gameover" && s.outcome === "loss") return "exhausted";
  if (s.phase === "gameover" && s.outcome === "win") return "celebrating";
  if (s.meters.morale >= 65) return "focused";
  if (s.meters.morale < 30) return "stressed";
  if (s.workload > 70) return "exhausted";
  return "neutral";
}

// Corkboard publication papers
function Publications({ count }: { count: number }) {
  return (
    <>
      {/* Corkboard */}
      <rect x={140} y={12} width={180} height={75} rx={3} fill="#2a1e14" stroke="#5a3f2a" strokeWidth={1} />
      <text
        x={230}
        y={10}
        fontSize={7}
        fill="#9a8f74"
        fontFamily="'IBM Plex Mono', monospace"
        textAnchor="middle"
      >
        PUBLICATIONS
      </text>
      {Array.from({ length: count }, (_, i) => {
        const px = 150 + i * 28;
        const pinColors = ["#d85850", "#54b089", "#f4d43c", "#9fb2b9", "#d85850", "#54b089"];
        return (
          <g key={i} transform={`rotate(${(i % 3 - 1) * 3} ${px + 10} ${28 + 14})`}>
            {/* Paper */}
            <rect x={px} y={18} width={20} height={28} fill="#f1ead9" stroke="#cdbf9f" strokeWidth={0.8} />
            {/* Text lines */}
            <line x1={px + 3} y1={24} x2={px + 17} y2={24} stroke="#9a8f74" strokeWidth={0.7} />
            <line x1={px + 3} y1={28} x2={px + 17} y2={28} stroke="#9a8f74" strokeWidth={0.7} />
            <line x1={px + 3} y1={32} x2={px + 14} y2={32} stroke="#9a8f74" strokeWidth={0.7} />
            {/* Pushpin */}
            <circle cx={px + 10} cy={18} r={2.5} fill={pinColors[i % pinColors.length]} />
          </g>
        );
      })}
    </>
  );
}

// Morale-driven desk plant
function Plant({ morale }: { morale: number }) {
  const leafColor =
    morale >= 60 ? "#4caf50" : morale >= 30 ? "#9e9d24" : "#6d4c41";
  const drooping = morale < 30;
  const wrapper = drooping ? `rotate(15 390 128)` : undefined;

  return (
    <g>
      {/* Pot trapezoid */}
      <rect x={382} y={130} width={16} height={16} rx={1} fill="#8a5a32" />
      {/* Pot rim */}
      <ellipse cx={390} cy={130} rx={12} ry={5} fill="#7a4f2a" />
      {/* Leaves */}
      <g transform={wrapper}>
        <path
          d="M390,128 C383,118 376,115 378,122 S390,128 390,128"
          fill={leafColor}
          stroke="none"
          className={morale >= 60 ? "tt-bob" : undefined}
        />
        <path
          d="M390,128 C397,118 404,115 402,122 S390,128 390,128"
          fill={leafColor}
          stroke="none"
          className={morale >= 60 ? "tt-bob" : undefined}
          style={morale >= 60 ? { animationDelay: "0.3s" } : undefined}
        />
        <path
          d="M390,128 C390,116 390,108 390,114 S390,128 390,128"
          fill={leafColor}
          stroke="none"
          className={morale >= 60 ? "tt-bob" : undefined}
          style={morale >= 60 ? { animationDelay: "0.6s" } : undefined}
        />
      </g>
    </g>
  );
}

// Microscope on bench
function Microscope({ morale }: { morale: number }) {
  return (
    <g>
      {/* Base */}
      <ellipse cx={110} cy={118} rx={14} ry={5} fill="#2e4953" />
      {/* Arm */}
      <rect x={107} y={80} width={6} height={40} fill="#243a44" />
      {/* Head — bob animation on the whole head group */}
      <g className="tt-bob" style={{ animationDuration: "3.2s" }}>
        <rect x={100} y={76} width={20} height={12} rx={3} fill="#2e4953" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
        {/* Eyepiece */}
        <rect x={108} y={68} width={4} height={10} rx={2} fill="#1b2a32" />
      </g>
      {/* Objective lens */}
      <circle cx={110} cy={118} r={4} fill="#1b2a32" stroke={morale > 50 ? "rgba(84,176,137,0.5)" : "rgba(84,176,137,0.2)"} strokeWidth={1} />
      {/* Glow when morale is high */}
      {morale > 50 && (
        <circle cx={110} cy={118} r={7} fill="rgba(84,176,137,0.06)" />
      )}
    </g>
  );
}

// Computer monitor — center of bench
function Monitor() {
  return (
    <g>
      {/* Screen glow behind bezel */}
      <rect x={192} y={66} width={56} height={50} rx={6} fill="rgba(49,83,110,0.15)" style={{ filter: "blur(8px)" }} />
      {/* Stand */}
      <rect x={216} y={110} width={8} height={10} fill="#243a44" />
      {/* Stand base */}
      <rect x={210} y={119} width={20} height={4} rx={2} fill="#1b2a32" />
      {/* Bezel */}
      <rect x={196} y={70} width={48} height={42} rx={4} fill="#1b2a32" stroke="#2e4953" strokeWidth={1.5} />
      {/* Screen surface */}
      <rect x={200} y={74} width={40} height={34} rx={2} fill="url(#monitorGrad)" />
      {/* Code/data lines */}
      <line x1={204} y1={82} x2={228} y2={82} stroke="rgba(244,212,60,0.5)" strokeWidth={1} />
      <line x1={204} y1={87} x2={220} y2={87} stroke="rgba(244,212,60,0.3)" strokeWidth={1} />
      <line x1={204} y1={92} x2={232} y2={92} stroke="rgba(244,212,60,0.4)" strokeWidth={1} />
      <line x1={204} y1={97} x2={215} y2={97} stroke="rgba(244,212,60,0.25)" strokeWidth={1} />
    </g>
  );
}

// Coffee machine on bench
function CoffeeMachine({ morale, coffeeCups }: { morale: number; coffeeCups: number }) {
  const powerLight = morale < 30 ? "#d85850" : "#54b089";
  return (
    <g>
      {/* Body */}
      <rect x={316} y={86} width={28} height={34} rx={4} fill="#2a2a2a" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      {/* Top section */}
      <rect x={318} y={82} width={24} height={8} rx={2} fill="#1f1f1f" />
      {/* Water tank */}
      <rect x={340} y={84} width={6} height={20} rx={2} fill="#1e3a44" stroke="#2e4953" strokeWidth={0.8} />
      {/* Power light */}
      <circle cx={321} cy={89} r={3} fill={powerLight} />
      {/* Drip tray */}
      <rect x={312} y={118} width={36} height={4} rx={2} fill="#1b2a32" />
      {/* Steam */}
      <ellipse className="tt-steam" cx={325} cy={82} rx={3} ry={5} fill="rgba(200,200,200,0.4)" style={{ animationDelay: "0s" }} />
      <ellipse className="tt-steam" cx={330} cy={80} rx={3} ry={5} fill="rgba(200,200,200,0.4)" style={{ animationDelay: "0.7s" }} />
      <ellipse className="tt-steam" cx={335} cy={82} rx={3} ry={5} fill="rgba(200,200,200,0.4)" style={{ animationDelay: "1.4s" }} />
      {/* Cup */}
      {coffeeCups > 0 && (
        <circle cx={328} cy={117} r={5} fill="#6b3f1a" stroke="#8a5a32" strokeWidth={0.8} />
      )}
    </g>
  );
}

// Scattered papers clutter on bench (workload indicator)
function BenchClutter({ workload }: { workload: number }) {
  const count = Math.min(6, Math.floor(workload / 16));
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const x = 140 + (i * 27);
        const angle = (i * 37) % 30 - 15;
        return (
          <rect
            key={i}
            x={x}
            y={115}
            width={14}
            height={10}
            fill="#f1ead9"
            opacity={0.85}
            transform={`rotate(${angle} ${x + 7} ${120})`}
          />
        );
      })}
    </>
  );
}

// Workload bar strip (bottom-right)
function WorkloadBar({ workload }: { workload: number }) {
  const barFill =
    workload > 70 ? "#d85850" : workload > 40 ? "#f4d43c" : "#54b089";
  const barWidth = (workload / 100) * 60;
  return (
    <g>
      <text
        x={460}
        y={208}
        fontSize={6}
        fill="rgba(159,178,185,0.6)"
        fontFamily="'IBM Plex Mono', monospace"
        textAnchor="end"
      >
        WORKLOAD
      </text>
      <rect x={410} y={212} width={60} height={3} rx={1.5} fill="rgba(255,255,255,0.06)" />
      <rect x={410} y={212} width={barWidth} height={3} rx={1.5} fill={barFill} />
    </g>
  );
}

// Tenure clock (top-right corner)
function TenureClock({ term, maxTerms }: { term: number; maxTerms: number }) {
  const progress = Math.min(term, maxTerms) / maxTerms;
  const urgent = progress > 0.8;
  const handColor = urgent ? "#d85850" : "#f4d43c";
  // 8 tick marks at 45° increments
  const ticks = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 * Math.PI) / 180;
    const innerR = 14;
    const outerR = 18;
    const cx = 452;
    const cy = 28;
    return (
      <line
        key={i}
        x1={cx + innerR * Math.sin(angle)}
        y1={cy - innerR * Math.cos(angle)}
        x2={cx + outerR * Math.sin(angle)}
        y2={cy - outerR * Math.cos(angle)}
        stroke="#2e4953"
        strokeWidth={1}
        strokeLinecap="round"
      />
    );
  });

  return (
    <g>
      <circle cx={452} cy={28} r={18} fill="none" stroke="#2e4953" strokeWidth={1.5} />
      {ticks}
      {/* Clock hand */}
      <line
        x1={452}
        y1={28}
        x2={452}
        y2={12}
        stroke={handColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        transform={`rotate(${progress * 360} 452 28)`}
      />
      {/* Center dot */}
      <circle cx={452} cy={28} r={2} fill={handColor} />
      {/* T label */}
      <text x={452} y={31} fontSize={8} fill="#9fb2b9" textAnchor="middle">T</text>
      {/* Term fraction */}
      <text
        x={452}
        y={54}
        fontSize={7.5}
        fill="#9fb2b9"
        fontFamily="'IBM Plex Mono', monospace"
        textAnchor="middle"
      >
        {Math.min(term, maxTerms)}/{maxTerms}
      </text>
    </g>
  );
}

export function LabScene({ s }: { s: GameState }) {
  const reduced = useReducedMotion() ?? false;
  const mood = deriveMood(s);
  const pubCount = Math.min(s.publications, 6);

  // Window sky color based on time of day
  const windowFill =
    s.meters.time >= 8 ? "#1a3a5c" : s.meters.time >= 4 ? "#0f1e30" : "#060e18";

  return (
    <svg
      viewBox="0 0 480 220"
      width="100%"
      role="img"
      aria-label="Your lab"
      style={{ display: "block", borderRadius: 16, background: "#1b2a32" }}
    >
      <defs>
        <linearGradient id="monitorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d2233" />
          <stop offset="100%" stopColor="#132d44" />
        </linearGradient>
      </defs>

      {/* Layer 1 — Room structure */}
      <rect x={0} y={0} width={480} height={165} fill="#1b2a32" />
      <rect x={0} y={160} width={480} height={60} fill="#16222a" />
      <line x1={0} y1={160} x2={480} y2={160} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />

      {/* Layer 2 — Window */}
      {/* Window glow behind frame */}
      {s.meters.time >= 8 && (
        <rect x={28} y={18} width={84} height={74} rx={5} fill="rgba(100,160,255,0.04)" />
      )}
      <rect x={30} y={20} width={80} height={70} rx={4} fill={windowFill} stroke="#2e4953" strokeWidth={2} />
      {/* Window panes — cross lines */}
      <line x1={70} y1={20} x2={70} y2={90} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
      <line x1={30} y1={55} x2={110} y2={55} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />

      {/* Layer 3 — Corkboard with publications */}
      <Publications count={pubCount} />

      {/* Layer 4 — Morale plant */}
      <Plant morale={s.meters.morale} />

      {/* Layer 5 — Lab bench */}
      <rect x={60} y={118} width={350} height={14} rx={3} fill="#2a3a2e" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      <rect x={60} y={131} width={350} height={10} fill="#1e2c22" />
      <rect x={65} y={141} width={8} height={20} fill="#1a2a1e" />
      <rect x={397} y={141} width={8} height={20} fill="#1a2a1e" />

      {/* Layer 6 — Equipment on bench */}
      <Microscope morale={s.meters.morale} />
      <Monitor />
      <CoffeeMachine morale={s.meters.morale} coffeeCups={s.coffeeCups} />
      {!reduced && <BenchClutter workload={s.workload} />}

      {/* Layer 7 — Workload bar */}
      <WorkloadBar workload={s.workload} />

      {/* Layer 8 — Scientist character embedded as <g> */}
      {/* The Scientist SVG is 40x80 viewBox, scaled ~0.9 and placed at (160, 48) */}
      {/* We render the character inline by using foreignObject approach substitution:
          Since Scientist is a React motion.svg, we embed it via foreignObject */}
      <foreignObject x={142} y={44} width={56} height={76}>
        <Scientist mood={mood} size={56} />
      </foreignObject>

      {/* Layer — Tenure clock */}
      <TenureClock term={s.term} maxTerms={s.maxTerms} />

      {/* Layer 9 — Mood tint overlay */}
      {s.meters.morale < 30 && (
        <rect
          x={0} y={0} width={480} height={220}
          fill="rgba(20,20,60,0.12)"
          className="tt-flicker"
          pointerEvents="none"
        />
      )}
      {s.meters.morale >= 65 && (
        <rect
          x={0} y={0} width={480} height={220}
          fill="rgba(255,200,50,0.03)"
          pointerEvents="none"
        />
      )}
    </svg>
  );
}
