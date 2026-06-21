// Pure helpers for applying event-choice effects to GameState. Keeping these in
// one place keeps the deck declarative and the clamping/logging consistent.

import type { ActiveFuse, FuseKind, GameState } from "../types";

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

// A bundle of deltas a choice can apply in one shot. All optional.
export interface Effect {
  time?: number;
  money?: number;
  reputation?: number;
  morale?: number;
  workload?: number;
  knowledge?: number;
  publications?: number;
  loyalty?: number; // applied to every current student (lab-wide karma)
  log?: string; // feedback line (newest-first)
}

export function pushLog(s: GameState, line: string): GameState {
  return { ...s, log: [line, ...s.log].slice(0, 8) };
}

export function apply(s: GameState, e: Effect): GameState {
  const m = s.meters;
  const next: GameState = {
    ...s,
    meters: {
      time: m.time + (e.time ?? 0),
      money: m.money + (e.money ?? 0),
      reputation: Math.max(0, m.reputation + (e.reputation ?? 0)),
      morale: clamp(m.morale + (e.morale ?? 0), 0, 100),
    },
    workload: clamp(s.workload + (e.workload ?? 0), 0, 100),
    knowledge: Math.max(0, s.knowledge + (e.knowledge ?? 0)),
    publications: Math.max(0, s.publications + (e.publications ?? 0)),
    students:
      e.loyalty != null
        ? s.students.map((st) => ({
            ...st,
            loyalty: clamp(st.loyalty + e.loyalty!, 0, 100),
          }))
        : s.students,
  };
  return e.log ? pushLog(next, e.log) : next;
}

// Adjust one named student's loyalty (e.g. the breakthrough's author).
export function adjustStudent(
  s: GameState,
  name: string,
  delta: number,
): GameState {
  return {
    ...s,
    students: s.students.map((st) =>
      st.name === name
        ? { ...st, loyalty: clamp(st.loyalty + delta, 0, 100) }
        : st,
    ),
  };
}

// Partner thread (spec §13): nudge the hidden Relationship value, clamped.
export function adjustRel(s: GameState, delta: number): GameState {
  return { ...s, relationship: clamp(s.relationship + delta, 0, 100) };
}

export function addStudent(s: GameState, name: string, loyalty: number): GameState {
  if (s.students.some((st) => st.name === name)) return s;
  return { ...s, students: [...s.students, { name, loyalty }] };
}

// Highest current loyalty — gates the "a loyal student saves you" branches.
export function maxLoyalty(s: GameState): number {
  return s.students.reduce((hi, st) => Math.max(hi, st.loyalty), 0);
}

export function lightFuse(s: GameState, fuse: ActiveFuse): GameState {
  // Don't stack duplicate fuses of the same kind.
  if (s.fuses.some((f) => f.kind === fuse.kind)) return s;
  return { ...s, fuses: [...s.fuses, fuse] };
}

export function setFlag(s: GameState, key: string, value: number): GameState {
  return { ...s, flags: { ...s.flags, [key]: value } };
}

export function getFlag(s: GameState, key: string): number {
  return s.flags[key] ?? 0;
}

export function hasFuse(s: GameState, kind: FuseKind): boolean {
  return s.fuses.some((f) => f.kind === kind);
}

// Queue a chained event id behind the current one (chaining mechanic).
export function enqueueEvent(s: GameState, id: string): GameState {
  return { ...s, eventQueue: [...s.eventQueue, id] };
}

export function endRun(s: GameState, outcome: "win" | "loss", line: string): GameState {
  return { ...pushLog(s, line), phase: "gameover", outcome };
}
