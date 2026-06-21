// Zustand store: the React-facing wrapper around the pure turn-loop machine +
// event engine (spec §15), plus the communal-pool sync actions (spec §14).
// All game rules live in machine.ts / events; the store holds the current
// GameState, the pool sync status, and dispatches transitions.

import { create } from "zustand";
import * as machine from "./machine";
import { createCareer, loadCareer, saveCareer } from "../pool";
import type { SetupConfig } from "./scenarios";
import type { ActionId, GameState } from "./types";

export type PoolStatus = "idle" | "saving" | "saved" | "error" | "stale";

interface GameStore extends GameState {
  poolStatus: PoolStatus;
  poolMessage: string | null;

  start: (config: SetupConfig) => void;
  act: (action: ActionId) => void;
  choose: (choiceId: string) => void;
  endTurn: () => void;
  reset: () => void;

  // Communal pool (spec §14).
  saveToPool: () => Promise<void>; // create on first save, then version-guarded updates
  openFromPool: (id: string) => Promise<void>; // continue any run
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...machine.initialState(),
  poolStatus: "idle",
  poolMessage: null,

  start: (config) => set(() => ({ ...machine.startRun(config), poolStatus: "idle" as PoolStatus, poolMessage: null })),
  act: (action) => set((s) => machine.ACTIONS[action](s)),
  choose: (choiceId) => set((s) => machine.choose(s, choiceId)),
  endTurn: () => set((s) => machine.endTurn(s)),
  reset: () => set(() => ({ ...machine.reset(), poolStatus: "idle" as PoolStatus, poolMessage: null })),

  saveToPool: async () => {
    const s = get();
    set({ poolStatus: "saving", poolMessage: null });
    try {
      // First save → create; thereafter → version-guarded update.
      if (!s.poolId) {
        const { id, version } = await createCareer(s, s.scientistName);
        set({ poolId: id, poolVersion: version, poolStatus: "saved" });
        return;
      }
      const r = await saveCareer(s.poolId, s.poolVersion ?? 1, s, s.scientistName);
      if (r.ok) {
        set({ poolVersion: r.version, poolStatus: "saved" });
      } else if (r.stale) {
        // Someone else advanced this run — reload their version (§14).
        const { state, version } = await loadCareer(s.poolId);
        set({ ...state, poolId: s.poolId, poolVersion: version, poolStatus: "stale", poolMessage: "Someone advanced this run; you're now on their version." });
      } else {
        set({ poolStatus: "error", poolMessage: r.message });
      }
    } catch (e) {
      set({ poolStatus: "error", poolMessage: e instanceof Error ? e.message : "Save failed." });
    }
  },

  openFromPool: async (id) => {
    set({ poolStatus: "saving", poolMessage: null });
    try {
      const { state, version } = await loadCareer(id);
      set({ ...state, poolId: id, poolVersion: version, poolStatus: "idle", poolMessage: null });
    } catch (e) {
      set({ poolStatus: "error", poolMessage: e instanceof Error ? e.message : "Could not open the run." });
    }
  },
}));
