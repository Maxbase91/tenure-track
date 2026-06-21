// Quick-mode scenarios (spec §2). M1 wires only The Postdoc Gamble; M3 adds the
// PhD Crunch, New PI / Empty Lab, and Tenure Sprint beside it using this shape.

import { STARTING } from "./constants";
import type { GameState, ScenarioId } from "./types";

export interface Scenario {
  id: ScenarioId;
  label: string;
  blurb: string; // the run's framing / win goal, shown to the player
  maxTerms: number;
  // Win predicate, evaluated at the end of the final term (§9).
  hasWon: (s: GameState) => boolean;
}

export const POSTDOC_GAMBLE: Scenario = {
  id: "postdoc-gamble",
  label: "The Postdoc Gamble",
  blurb:
    "Land a faculty job offer before the contract runs out: reach Reputation 9 with at least 2 papers by the end of term 5.",
  // §2 baseline is 3–4 terms; 5 here is a deliberate tunable (§17).
  maxTerms: 5,
  hasWon: (s) => s.meters.reputation >= 9 && s.publications >= 2,
};

// Build the opening state for a scenario.
export function startState(scenario: Scenario): GameState {
  return {
    phase: "playing",
    outcome: null,
    scenario: scenario.id,
    term: 1,
    maxTerms: scenario.maxTerms,
    meters: {
      time: STARTING.time,
      money: STARTING.money,
      morale: STARTING.morale,
      reputation: STARTING.reputation,
    },
    workload: STARTING.workload,
    knowledge: STARTING.knowledge,
    publications: STARTING.publications,
    coffeeCups: 0,
    score: 0,
    log: [`${scenario.label}. ${scenario.blurb}`],
  };
}
