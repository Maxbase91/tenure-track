// Turn-loop state machine (spec §5), kept as pure functions so the rules are
// testable in isolation and later milestones can hook actions / events in
// without touching the React layer.
//
// M0 turn loop is intentionally empty: end-of-term does the structural work
// (advance the tenure clock, refresh the per-term Time budget, check for game
// over) but applies no salaries, events, or Workload→Morale check yet. Those
// land in M1/M2.

import { QUICK_MODE_TERMS, STARTING, WEEKS_PER_TERM } from "./constants";
import type { GameState } from "./types";

export function initialState(): GameState {
  return {
    phase: "playing",
    term: 1,
    maxTerms: QUICK_MODE_TERMS,
    meters: { ...STARTING },
  };
}

// End the current term. The single transition the M0 skeleton exposes.
export function endTurn(state: GameState): GameState {
  if (state.phase !== "playing") return state;

  // Last term done → the tenure clock runs out.
  if (state.term >= state.maxTerms) {
    return { ...state, phase: "gameover" };
  }

  // Advance the clock and refresh the per-term Time budget (§4, §5).
  return {
    ...state,
    term: state.term + 1,
    meters: { ...state.meters, time: WEEKS_PER_TERM },
  };
}

export function reset(): GameState {
  return initialState();
}
