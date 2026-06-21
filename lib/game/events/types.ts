// Event engine data model (spec §10). An event is a deck card with a conditional
// trigger and a set of choices; every choice depends on player state, and some
// light a fuse. Definitions live here in code (never serialized) — state only
// stores event ids (see GameState.eventQueue/seenEvents).

import type { GameState } from "../types";

export type Rarity = "common" | "rare" | "legendary";

export interface EventChoice {
  id: string;
  label: string;
  detail?: string; // cost / consequence hint shown under the label
  // Conditional choice (spec §8/§12 "if Rep ≥ 8: Negotiate"). Hidden if false.
  available?: (s: GameState) => boolean;
  apply: (s: GameState) => GameState; // returns the new state (may light fuses)
}

export interface GameEvent {
  id: string;
  title: string;
  body: string; // flavour text
  rarity: Rarity;
  weight: number; // draw weighting within its rarity
  oncePerRun?: boolean;
  // Conditional trigger (spec §10): may this event be drawn now?
  trigger: (s: GameState) => boolean;
  // Choices can branch on role/state (role-aware events return different sets).
  choices: (s: GameState) => EventChoice[];
}
