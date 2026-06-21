// Client-side helpers for the communal save pool (spec §14). Thin fetch wrappers
// around the /api/careers routes.

import type { GameState } from "./game/types";

// A row as returned by the list/browse endpoint (no full state).
export interface CareerRow {
  id: string;
  title: string;
  scientist_name: string;
  field: string;
  mode: string;
  scenario: string;
  stage: string;
  term: number;
  score: number;
  status: string;
  version: number;
  last_player: string | null;
  updated_at: string;
}

export async function listCareers(limit = 20, offset = 0): Promise<CareerRow[]> {
  const res = await fetch(`/api/careers?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error("Could not load the pool.");
  return (await res.json()).careers as CareerRow[];
}

export async function loadCareer(id: string): Promise<{ state: GameState; version: number }> {
  const res = await fetch(`/api/careers/${id}`);
  if (!res.ok) throw new Error("Could not open the run.");
  const row = (await res.json()).career;
  return { state: row.state as GameState, version: row.version as number };
}

// Create a new pool entry; returns the assigned id + version.
export async function createCareer(state: GameState, lastPlayer: string): Promise<{ id: string; version: number }> {
  const res = await fetch(`/api/careers`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ state, lastPlayer }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Could not save.");
  return res.json();
}

export type SaveResult =
  | { ok: true; version: number }
  | { ok: false; stale: true } // someone else advanced it — caller should reload
  | { ok: false; stale: false; message: string };

// Save an advance, version-guarded. 409 → stale (reload required).
export async function saveCareer(id: string, version: number, state: GameState, lastPlayer: string): Promise<SaveResult> {
  const res = await fetch(`/api/careers/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ version, state, lastPlayer }),
  });
  if (res.status === 409) return { ok: false, stale: true };
  if (!res.ok) return { ok: false, stale: false, message: (await res.json().catch(() => ({}))).error ?? "Save failed." };
  return { ok: true, version: (await res.json()).version };
}
