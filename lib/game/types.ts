// Core game types. M0 models only the four visible quick-mode meters and the
// turn-loop phases. Hidden/underneath meters (Workload, Coffee, Knowledge,
// loyalty, relationship) arrive in later milestones — do not add them here yet.

// The turn-loop state machine phases (spec §5).
//   playing  → a term is in progress; the player allocates Time, then ends turn.
//   gameover → the tenure clock has run out; show the run summary.
export type Phase = "playing" | "gameover";

// The four quick-mode meters (spec §4 "Quick mode" column = visible).
export interface Meters {
  time: number; // weeks remaining this term
  money: number; // £, merged personal + research funding
  morale: number; // 0–100
  reputation: number; // h-index-ish
}

export interface GameState {
  phase: Phase;
  term: number; // 1-indexed current term
  maxTerms: number; // tenure clock length for this run
  meters: Meters;
}
