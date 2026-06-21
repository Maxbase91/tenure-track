// Competitive match layer (spec §2 "Solo vs AI + hotseat", §16 M5). N players —
// humans (pass-the-phone) and rule-based AIs — each run the same scenario on
// their own GameState, round-robin by term. Pure model + helpers; the
// orchestration (sequential AI auto-play, handoff) lives in matchStore.ts.

import { AI_PROFILES, type AIProfile } from "./ai";
import type { FieldId } from "./fields";
import { buildRun } from "./scenarios";
import type { GameState, ScenarioId } from "./types";

export interface MatchPlayer {
  id: number;
  name: string;
  kind: "human" | "ai";
  profile: AIProfile | null; // ai only
  state: GameState;
}

// 'handoff' → pass-the-phone screen before a human turn; 'playing' → that human
// is acting; 'done' → all runs finished, show standings.
export type MatchPhase = "handoff" | "playing" | "done";

export interface Match {
  players: MatchPlayer[];
  current: number; // index of the active player
  phase: MatchPhase;
  scenario: ScenarioId;
  field: FieldId;
}

export interface PlayerConfig {
  name: string;
  kind: "human" | "ai";
  profileId?: string;
}

export interface MatchConfig {
  scenario: ScenarioId;
  field: FieldId;
  players: PlayerConfig[];
}

export function createMatch(config: MatchConfig): Match {
  const players: MatchPlayer[] = config.players.map((pc, i) => ({
    id: i,
    name: pc.name || (pc.kind === "ai" ? `AI ${i + 1}` : `Player ${i + 1}`),
    kind: pc.kind,
    profile: pc.kind === "ai" ? AI_PROFILES.find((p) => p.id === pc.profileId) ?? AI_PROFILES[0] : null,
    // Each player runs the same scenario on their own board (partner thread off
    // in matches to keep the contest about the science).
    state: buildRun({
      mode: config.scenario === "career" ? "career" : "quick",
      scenario: config.scenario,
      field: config.field,
      scientistName: pc.name || `Player ${i + 1}`,
      hasPartner: false,
      partnerName: null,
      partnerField: null,
      offer: null,
    }),
  }));
  return { players, current: 0, phase: "handoff", scenario: config.scenario, field: config.field };
}

export const isFinished = (p: MatchPlayer) => p.state.phase === "gameover";

// Next still-playing player after `from` (cyclic). Returns -1 if everyone's done.
export function nextPlayable(match: Match, from: number): number {
  const n = match.players.length;
  for (let step = 1; step <= n; step++) {
    const idx = (from + step) % n;
    if (!isFinished(match.players[idx])) return idx;
  }
  return -1;
}

export const allFinished = (match: Match) => match.players.every(isFinished);

// Final standings: highest score first (finished runs carry a computed score).
export function standings(match: Match): MatchPlayer[] {
  return [...match.players].sort((a, b) => b.state.score - a.state.score);
}
