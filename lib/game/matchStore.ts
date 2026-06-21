// Match orchestration store (spec §16 M5). Holds the Match and drives the
// round-robin: a human plays via act/choose/endTurn; AIs auto-play their term
// in sequence; between human turns the phase is 'handoff' (pass-the-phone).

import { create } from "zustand";
import { aiTakeTurn } from "./ai";
import {
  allFinished,
  createMatch,
  nextPlayable,
  type Match,
  type MatchConfig,
} from "./match";
import { chooseEvent } from "./events/engine";
import { ACTIONS, endTurn as machineEndTurn } from "./machine";
import type { ActionId } from "./types";

// Run AI turns until the next human is up (→ 'handoff') or everyone's done
// (→ 'done'). `match.current` points at the player whose turn it is to begin.
function runToNextHuman(match: Match): Match {
  let m = match;
  // Bounded to avoid any pathological loop; far above a real match's length.
  for (let guard = 0; guard < 500; guard++) {
    if (allFinished(m)) return { ...m, phase: "done" };
    const cur = m.players[m.current];

    if (cur.state.phase === "gameover") {
      const nxt = nextPlayable(m, m.current);
      if (nxt < 0) return { ...m, phase: "done" };
      m = { ...m, current: nxt };
      continue;
    }
    if (cur.kind === "ai") {
      const newState = aiTakeTurn(cur.state, cur.profile!);
      const players = m.players.map((p, i) => (i === m.current ? { ...p, state: newState } : p));
      m = { ...m, players };
      const nxt = nextPlayable(m, m.current);
      if (nxt < 0) return { ...m, phase: "done" };
      m = { ...m, current: nxt };
      continue;
    }
    return { ...m, phase: "handoff" }; // a human is up
  }
  return { ...m, phase: "done" };
}

interface MatchStore {
  match: Match | null;
  create: (config: MatchConfig) => void;
  ready: () => void; // handoff → playing (the human takes the phone)
  act: (action: ActionId) => void;
  choose: (choiceId: string) => void;
  endTurn: () => void;
  reset: () => void;
}

// Apply a transition to the current player's GameState.
function mutateCurrent(match: Match, fn: (s: Match["players"][number]["state"]) => Match["players"][number]["state"]): Match {
  const players = match.players.map((p, i) => (i === match.current ? { ...p, state: fn(p.state) } : p));
  return { ...match, players };
}

export const useMatchStore = create<MatchStore>((set, get) => ({
  match: null,

  create: (config) => set(() => ({ match: runToNextHuman(createMatch(config)) })),

  ready: () => set((st) => (st.match ? { match: { ...st.match, phase: "playing" } } : st)),

  act: (action) => set((st) => (st.match ? { match: mutateCurrent(st.match, (s) => ACTIONS[action](s)) } : st)),

  choose: (choiceId) => set((st) => (st.match ? { match: mutateCurrent(st.match, (s) => chooseEvent(s, choiceId)) } : st)),

  endTurn: () =>
    set((st) => {
      if (!st.match) return st;
      // Advance the current player's term, then hand off / run AIs to the next human.
      const advanced = mutateCurrent(st.match, (s) => machineEndTurn(s));
      const next = nextPlayable(advanced, advanced.current);
      const m = next < 0 ? { ...advanced, phase: "done" as const } : runToNextHuman({ ...advanced, current: next });
      return { match: m };
    }),

  reset: () => set(() => ({ match: null })),
}));
