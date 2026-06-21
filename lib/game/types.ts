// Core game types. Quick mode shows four meters (Time, Money, Morale,
// Reputation); Workload, Knowledge and Publications run underneath. Other
// hidden systems (Coffee-as-event, student loyalty, relationship) arrive in
// later milestones — do not add them here yet.

// The turn-loop state machine phases (spec §5).
//   playing  → a term is in progress; the player allocates Time, then ends turn.
//   gameover → the run is over (tenure clock ran out, or burnout); show summary.
export type Phase = "playing" | "gameover";

// How the run ended.
export type Outcome = "win" | "loss" | null;

// Quick-mode scenario ids (spec §2). Only the Postdoc Gamble is wired in M1;
// the other three entry points arrive in M3.
export type ScenarioId =
  | "postdoc-gamble"
  | "phd-crunch"
  | "new-pi"
  | "tenure-sprint";

// The five turn-loop actions (spec §5). End-turn is handled separately.
export type ActionId =
  | "experiment"
  | "paper"
  | "grant"
  | "mentor"
  | "coffee";

// The four quick-mode meters (spec §4 "Quick mode" column = visible).
export interface Meters {
  time: number; // weeks remaining this term
  money: number; // £, merged personal + research funding
  morale: number; // 0–100
  reputation: number; // h-index-ish
}

export interface GameState {
  phase: Phase;
  outcome: Outcome;
  scenario: ScenarioId;
  term: number; // 1-indexed current term
  maxTerms: number; // tenure clock length for this run
  meters: Meters;

  // Underneath (spec §4): not in the visible four, but drive the loop.
  workload: number; // 0–100; >70 bleeds Morale, 100 → Burnout
  knowledge: number; // results; → papers
  publications: number; // accepted papers; part of the win bar
  coffeeCups: number; // cups this term (reset each term; future Caffeine Crash)

  score: number; // computed at game over
  log: string[]; // newest-first feedback lines for the player
}
