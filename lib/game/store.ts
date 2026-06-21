// Zustand store: the React-facing wrapper around the pure turn-loop machine
// (spec §15 — "client state machine (Zustand) serialised to state jsonb").
// All rules live in machine.ts; the store only holds the current GameState and
// dispatches transitions.

import { create } from "zustand";
import * as machine from "./machine";
import type { GameState } from "./types";

interface GameStore extends GameState {
  endTurn: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  ...machine.initialState(),
  endTurn: () => set((state) => machine.endTurn(state)),
  reset: () => set(() => machine.reset()),
}));
