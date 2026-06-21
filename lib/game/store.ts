// Zustand store: the React-facing wrapper around the pure turn-loop machine
// (spec §15). All rules live in machine.ts; the store only holds the current
// GameState and dispatches transitions.

import { create } from "zustand";
import * as machine from "./machine";
import type { ActionId, GameState } from "./types";

interface GameStore extends GameState {
  act: (action: ActionId) => void;
  endTurn: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  ...machine.initialState(),
  act: (action) => set((s) => machine.ACTIONS[action](s)),
  endTurn: () => set((s) => machine.endTurn(s)),
  reset: () => set(() => machine.reset()),
}));
