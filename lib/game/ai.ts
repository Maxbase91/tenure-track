// Rule-based utility AI opponent (spec §15 "rule-based utility AI opponents,
// local, no LLM"; §16 M5). Drives a GameState through a whole term: resolve any
// pending event by one-step utility, allocate actions greedily, then end turn.
//
// Event choices are scored generically — apply each choice to a clone and value
// the resulting state — so the AI handles all 20+ events (including role-aware
// and partner ones) without per-event code. Profiles tune risk appetite and how
// much the AI values the humane resources (Morale, loyalty, relationship).

import { COSTS } from "./constants";
import { activeEvent, chooseEvent } from "./events/engine";
import { ACTIONS, canDo, endTurn, eventPending } from "./machine";
import type { ActionId, FuseKind, GameState } from "./types";

export interface AIProfile {
  id: string;
  label: string;
  kind: boolean; // mentors, shares credit, protects Morale
  risk: number; // 0 cautious … 1 reckless (how readily it lights fuses)
}

export const AI_PROFILES: AIProfile[] = [
  { id: "careerist", label: "The Careerist", kind: false, risk: 0.85 },
  { id: "collegial", label: "The Collegial PI", kind: true, risk: 0.2 },
  { id: "plodder", label: "The Steady Plodder", kind: false, risk: 0.35 },
];

// Value of a state to a given profile. Cynics discount the humane resources.
function evalState(s: GameState, p: AIProfile): number {
  const m = s.meters;
  const humane = p.kind ? 1.5 : 0.5;
  const loyalty = s.students.length
    ? s.students.reduce((a, b) => a + b.loyalty, 0) / s.students.length
    : 0;
  return (
    5 * m.reputation +
    7 * s.publications +
    0.5 * s.knowledge +
    m.money / 8000 +
    humane * (0.4 * m.morale + 0.08 * loyalty + (s.hasPartner ? 0.08 * s.relationship : 0)) -
    0.15 * s.workload
  );
}

// Penalty for newly-lit fuses, scaled by caution (1 − risk). Reckless profiles
// barely care; cautious ones avoid the spicy buttons (p-hack, push-through).
const FUSE_COST: Partial<Record<FuseKind, number>> = {
  "phack-retraction": 45,
  "leaving-academia": 35,
  "name-order-betrayal": 18,
  "ellie-resentment": 12,
  "partner-plateau": 10,
};
function fusePenalty(before: GameState, after: GameState, p: AIProfile): number {
  const had = new Set(before.fuses.map((f) => f.kind));
  let pen = 0;
  for (const f of after.fuses) if (!had.has(f.kind)) pen += FUSE_COST[f.kind] ?? 8;
  return pen * (1 - p.risk);
}

// Resolve the active event by picking the highest-utility available choice.
export function resolveEventAI(s: GameState, p: AIProfile): GameState {
  const ev = activeEvent(s);
  if (!ev) return s;
  const choices = ev.choices(s).filter((c) => !c.available || c.available(s));
  if (choices.length === 0) return s;

  let bestId = choices[0].id;
  let bestU = -Infinity;
  const baseline = evalState(s, p);
  for (const c of choices) {
    const after = c.apply(s);
    const u = evalState(after, p) - baseline - fusePenalty(s, after, p);
    if (u > bestU) {
      bestU = u;
      bestId = c.id;
    }
  }
  return chooseEvent(s, bestId);
}

// Greedy action policy: publish ready Knowledge, stay funded, build Knowledge,
// and (kind profiles) mentor when there's slack.
function chooseAction(s: GameState, p: AIProfile): ActionId | null {
  const ok = (a: ActionId) => canDo(s, a).ok;
  const paper = COSTS.paper;

  if (s.knowledge >= paper.knowledgeRequired) {
    if (ok("paper")) return "paper";
    // Ready to publish but short on Time — buy some with Coffee if not too burnt.
    if (s.meters.money >= paper.money && s.meters.time < paper.time && s.workload < 55 && ok("coffee"))
      return "coffee";
  }
  if (s.meters.money < COSTS.experiment.money && ok("grant")) return "grant";
  if (ok("experiment")) return "experiment";
  if (ok("grant")) return "grant";
  if (p.kind && s.workload < 65 && ok("mentor")) return "mentor";
  return null;
}

// Play one full term and end it. Leaves any event drawn at end-of-term queued
// for the AI's next turn (resolved at the top of this function then).
export function aiTakeTurn(state: GameState, p: AIProfile): GameState {
  let s = state;

  // 1. Clear any pending events (drawn last term, burnout, caffeine).
  let guard = 0;
  while (eventPending(s) && s.phase === "playing" && guard++ < 25) s = resolveEventAI(s, p);

  // 2. Allocate the term's Time greedily.
  guard = 0;
  while (s.phase === "playing" && !eventPending(s) && guard++ < 40) {
    const a = chooseAction(s, p);
    if (!a) break;
    s = ACTIONS[a](s);
  }

  // 3. End the term (may enqueue next term's event — left for the next turn).
  if (s.phase === "playing" && !eventPending(s)) s = endTurn(s);
  return s;
}
