// Zustand store: the React-facing wrapper around the pure turn-loop machine +
// event engine (spec §15). All rules live in machine.ts / events; the store
// only holds the current GameState and dispatches transitions.

import { create } from "zustand";
import * as machine from "./machine";
import type { ActionId, GameState } from "./types";

interface GameStore extends GameState {
  act: (action: ActionId) => void;
  choose: (choiceId: string) => void; // resolve the active event
  endTurn: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  ...machine.initialState(),
  act: (action) => set((s) => machine.ACTIONS[action](s)),
  choose: (choiceId) => set((s) => machine.choose(s, choiceId)),
  endTurn: () => set((s) => machine.endTurn(s)),
  reset: () => set(() => machine.reset()),
}));
