// Core game types. Quick mode shows four meters (Time, Money, Morale,
// Reputation); Workload, Knowledge and Publications run underneath.
//
// IMPORTANT (M4 readiness): GameState must stay plain, serializable data — it
// will be written to Neon as jsonb. Event/fuse *logic* lives in code registries
// keyed by id (see lib/game/events). State only ever holds ids, counters, flags.

export type Phase = "playing" | "gameover";
export type Outcome = "win" | "loss" | null;

export type ScenarioId =
  | "postdoc-gamble"
  | "phd-crunch"
  | "new-pi"
  | "tenure-sprint";

// Career stage drives role-aware events (spec §8): junior = acted upon, PI =
// makes the call. M2 only runs the Postdoc Gamble (junior); PI activates in M3.
export type Role = "junior" | "pi";

export type ActionId = "experiment" | "paper" | "grant" | "mentor" | "coffee";

// The four quick-mode meters (spec §4 "Quick mode" column = visible).
export interface Meters {
  time: number;
  money: number; // £, merged personal + research funding
  morale: number; // 0–100
  reputation: number; // h-index-ish
}

// A lab member with their own loyalty (spec §8 karma). Loyal students cover
// Burnout, save samples, resist poaching; exploited ones leave / underperform.
export interface Student {
  name: string;
  loyalty: number; // 0–100
}

// Chaining mechanic (spec §10): a choice "lights a fuse" — a delayed or
// probability-rising consequence that resolves at later term boundaries.
// Resolution is looked up by `kind` in the engine (keeps state serializable).
export type FuseKind =
  | "reviewer2-bigger" // #1: demanded experiments reveal something bigger
  | "predatory-exposed" // #3: padded CV spotted at review → −Rep
  | "authorship-dispute" // #4 junior: telling the collaborator backfires
  | "name-order-betrayal" // #4 PI: exploited student won't cover you / leaves
  | "ellie-resentment" // #5: partner declined for you → resentment
  | "aisha-rival" // #6: ignored undergrad thrives in the rival lab
  | "phack-retraction" // #9: rising-probability retraction
  | "imposter-relapse" // #10: buried imposter syndrome resurfaces
  | "marsh-enemy" // #11: escalation made an enemy
  | "leaving-academia"; // #15: pushed through burnout → possible run-ender

export interface ActiveFuse {
  kind: FuseKind;
  termsLeft: number; // countdown; fires at 0 (or each term for prob fuses)
  prob?: number; // for probabilistic fuses (#9): current fire chance
  risePerTerm?: number; // how much prob climbs each term it doesn't fire
}

export interface GameState {
  phase: Phase;
  outcome: Outcome;
  scenario: ScenarioId;
  role: Role;
  term: number;
  maxTerms: number;
  meters: Meters;

  // Underneath (spec §4).
  workload: number; // 0–100; >70 bleeds Morale, 100 → Burnout
  knowledge: number;
  publications: number;
  coffeeCups: number; // cups this term (reset each term; feeds Caffeine Crash)

  // Event/karma layer (spec §8, §10).
  students: Student[];
  hasPartner: boolean; // gates the Ellie thread (full partner thread is M3)
  fuses: ActiveFuse[];
  flags: Record<string, number>; // misc counters/locks (e.g. funder-closed, donor-lock)
  seenEvents: string[]; // once-per-run guard
  eventQueue: string[]; // event ids awaiting the player's choice (queue[0] = active)

  score: number;
  log: string[]; // newest-first feedback lines
}
