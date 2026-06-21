"use client";

import { motion, useReducedMotion } from "framer-motion";

export type ScientistMood =
  | "neutral"
  | "focused"
  | "stressed"
  | "celebrating"
  | "exhausted"
  | "presenting";

export interface ScientistProps {
  mood: ScientistMood;
  size?: number;
  flipped?: boolean;
}

// Face elements vary by mood.
function Face({ mood }: { mood: ScientistMood }) {
  // Eyes
  const eyeL = { cx: 15, cy: 15 };
  const eyeR = { cx: 25, cy: 15 };

  switch (mood) {
    case "focused":
      return (
        <g>
          <ellipse cx={eyeL.cx} cy={eyeL.cy} rx={2} ry={1.5} fill="#1b2a32" />
          <ellipse cx={eyeR.cx} cy={eyeR.cy} rx={2} ry={1.5} fill="#1b2a32" />
          <path d="M17,20 Q20,21.5 23,20" stroke="#1b2a32" strokeWidth={0.7} fill="none" />
        </g>
      );
    case "stressed":
      return (
        <g>
          <circle cx={eyeL.cx} cy={eyeL.cy} r={2} fill="#1b2a32" />
          <circle cx={eyeR.cx} cy={eyeR.cy} r={2} fill="#1b2a32" />
          {/* angled brows — inward frown */}
          <line x1={13} y1={11.5} x2={17} y2={12.5} stroke="#1b2a32" strokeWidth={0.9} strokeLinecap="round" />
          <line x1={23} y1={12.5} x2={27} y2={11.5} stroke="#1b2a32" strokeWidth={0.9} strokeLinecap="round" />
          {/* slightly open mouth / frown */}
          <path d="M16,21 Q20,19.5 24,21" stroke="#1b2a32" strokeWidth={0.7} fill="none" />
        </g>
      );
    case "celebrating":
      return (
        <g>
          {/* eyes closed — two curved lines */}
          <path d="M13,15 Q15,13 17,15" stroke="#1b2a32" strokeWidth={0.9} fill="none" strokeLinecap="round" />
          <path d="M23,15 Q25,13 27,15" stroke="#1b2a32" strokeWidth={0.9} fill="none" strokeLinecap="round" />
          {/* wide smile */}
          <path d="M14,20 Q20,25 26,20" stroke="#1b2a32" strokeWidth={0.9} fill="none" strokeLinecap="round" />
        </g>
      );
    case "exhausted":
      return (
        <g>
          {/* half-closed eyes — top half only */}
          <path d="M13,15 Q15,12 17,15" stroke="#1b2a32" strokeWidth={0.9} fill="none" />
          <ellipse cx={eyeL.cx} cy={eyeL.cy + 0.5} rx={2} ry={1} fill="#1b2a32" />
          <path d="M23,15 Q25,12 27,15" stroke="#1b2a32" strokeWidth={0.9} fill="none" />
          <ellipse cx={eyeR.cx} cy={eyeR.cy + 0.5} rx={2} ry={1} fill="#1b2a32" />
          {/* flat mouth */}
          <line x1={16} y1={21} x2={24} y2={21} stroke="#1b2a32" strokeWidth={0.7} strokeLinecap="round" />
        </g>
      );
    case "presenting":
      return (
        <g>
          <circle cx={eyeL.cx} cy={eyeL.cy} r={2} fill="#1b2a32" />
          <circle cx={eyeR.cx} cy={eyeR.cy} r={2} fill="#1b2a32" />
          {/* slight smile */}
          <path d="M16,20 Q20,23 24,20" stroke="#1b2a32" strokeWidth={0.7} fill="none" strokeLinecap="round" />
        </g>
      );
    default: // neutral
      return (
        <g>
          <circle cx={eyeL.cx} cy={eyeL.cy} r={2} fill="#1b2a32" />
          <circle cx={eyeR.cx} cy={eyeR.cy} r={2} fill="#1b2a32" />
          <path d="M17,20 Q20,22 23,20" stroke="#1b2a32" strokeWidth={0.7} fill="none" strokeLinecap="round" />
        </g>
      );
  }
}

// Arms vary by mood.
function Arms({ mood }: { mood: ScientistMood }) {
  if (mood === "celebrating") {
    return (
      <g>
        {/* arms raised */}
        <path d="M12,30 L5,18" stroke="#1b2a32" strokeWidth={2} strokeLinecap="round" fill="none" />
        <path d="M28,30 L35,18" stroke="#1b2a32" strokeWidth={2} strokeLinecap="round" fill="none" />
        {/* sleeves */}
        <path d="M12,30 L5,18" stroke="#f0ece0" strokeWidth={1.2} strokeLinecap="round" fill="none" />
        <path d="M28,30 L35,18" stroke="#f0ece0" strokeWidth={1.2} strokeLinecap="round" fill="none" />
      </g>
    );
  }
  if (mood === "stressed") {
    return (
      <g>
        {/* hanging lower, slightly out */}
        <path d="M12,30 L6,44" stroke="#1b2a32" strokeWidth={2} strokeLinecap="round" fill="none" />
        <path d="M28,30 L34,44" stroke="#1b2a32" strokeWidth={2} strokeLinecap="round" fill="none" />
        <path d="M12,30 L6,44" stroke="#f0ece0" strokeWidth={1.2} strokeLinecap="round" fill="none" />
        <path d="M28,30 L34,44" stroke="#f0ece0" strokeWidth={1.2} strokeLinecap="round" fill="none" />
      </g>
    );
  }
  // neutral / focused / exhausted / presenting
  return (
    <g>
      <path d="M12,30 L8,46" stroke="#1b2a32" strokeWidth={2} strokeLinecap="round" fill="none" />
      <path d="M28,30 L32,46" stroke="#1b2a32" strokeWidth={2} strokeLinecap="round" fill="none" />
      <path d="M12,30 L8,46" stroke="#f0ece0" strokeWidth={1.2} strokeLinecap="round" fill="none" />
      <path d="M28,30 L32,46" stroke="#f0ece0" strokeWidth={1.2} strokeLinecap="round" fill="none" />
    </g>
  );
}

// Posture variants for Framer Motion.
const postureVariants: Record<ScientistMood, { rotate: number; y?: number }> = {
  neutral: { rotate: 0, y: 0 },
  focused: { rotate: -3, y: 0 },
  stressed: { rotate: 1, y: 2 },
  celebrating: { rotate: 0, y: 0 },
  exhausted: { rotate: 2, y: 3 },
  presenting: { rotate: 0, y: 0 },
};

export function Scientist({ mood, size = 80, flipped = false }: ScientistProps) {
  const reduced = useReducedMotion() ?? false;

  const posture = postureVariants[mood];

  // Celebrating bounce animation — runs once (repeat: 1 = 2 total cycles = 1 full bounce).
  const celebrateAnim =
    !reduced && mood === "celebrating"
      ? { y: [-4, 0, -4, 0] as number[] }
      : { y: posture.y ?? 0 };

  const celebrateTrans =
    !reduced && mood === "celebrating"
      ? { duration: 0.5, times: [0, 0.33, 0.66, 1], repeat: Infinity, repeatDelay: 1 }
      : { duration: 0.3 };

  const scale = size / 80;

  return (
    <motion.svg
      viewBox="0 0 40 80"
      width={size}
      height={size * 2} // viewBox is 40x80, aspect 1:2
      overflow="visible"
      style={{
        transformOrigin: "center bottom",
        transform: flipped ? "scaleX(-1)" : undefined,
        display: "block",
      }}
      animate={
        reduced
          ? {}
          : {
              rotate: posture.rotate,
              ...celebrateAnim,
            }
      }
      transition={reduced ? {} : celebrateTrans}
    >
      {/* Shadow */}
      <ellipse cx={20} cy={78} rx={10} ry={3} fill="rgba(0,0,0,0.18)" />

      {/* Shoes */}
      <ellipse cx={14} cy={75} rx={6} ry={2.5} fill="#1b2a32" />
      <ellipse cx={26} cy={75} rx={6} ry={2.5} fill="#1b2a32" />

      {/* Trousers */}
      <rect x={10} y={55} width={8} height={20} rx={1} fill="#2a3a42" />
      <rect x={22} y={55} width={8} height={20} rx={1} fill="#2a3a42" />

      {/* Lab coat body */}
      <path
        d="M8,26 C8,42 32,42 32,26 L28,24 A10,10 0 0 0 12,24 Z"
        fill="#f0ece0"
        stroke="#1b2a32"
        strokeWidth={0.7}
      />

      {/* Lab coat lapels */}
      <path d="M20,24 L17,32 L20,34 L23,32 Z" fill="#e8e4d8" stroke="#1b2a32" strokeWidth={0.4} />

      {/* Collar / neckline */}
      <rect x={17} y={22} width={6} height={4} rx={1} fill="#e8e4d8" />

      {/* Arms drawn before head so they appear behind */}
      <Arms mood={mood} />

      {/* Head */}
      <circle cx={20} cy={16} r={10} fill="#f5dfc0" stroke="#1b2a32" strokeWidth={0.8} />

      {/* Hair — simple cap */}
      <path d="M10,14 Q10,6 20,6 Q30,6 30,14" fill="#3a2a1a" stroke="none" />

      {/* Face */}
      <Face mood={mood} />
    </motion.svg>
  );
}
