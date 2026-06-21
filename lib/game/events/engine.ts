// Event engine (spec §10): the deck draw, the fuse/chaining resolver, and the
// player's choice application. All randomness is Math.random (deterministic
// seeding only matters at M4 serialisation).

import { EVENTS } from "../constants";
import type { ActiveFuse, FuseKind, GameState } from "../types";
import { DECK, DECK_BY_ID } from "./deck";
import {
  adjustRel,
  adjustStudent,
  apply,
  endRun,
  getFlag,
  pushLog,
  setFlag,
} from "./effects";

// --- draw ------------------------------------------------------------------

function eligible(s: GameState) {
  return DECK.filter(
    (e) =>
      e.weight > 0 &&
      e.trigger(s) &&
      !(e.oncePerRun && s.seenEvents.includes(e.id)) &&
      !s.eventQueue.includes(e.id),
  );
}

// Draw at most one event at a term boundary, weighted by weight × rarity bias.
export function drawEvent(s: GameState): GameState {
  if (Math.random() > EVENTS.drawChance) return s;
  const pool = eligible(s);
  if (pool.length === 0) return s;

  const weights = pool.map((e) => e.weight * EVENTS.rarityWeight[e.rarity]);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  let pick = pool[0];
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      pick = pool[i];
      break;
    }
  }
  return enqueue(s, pick.id);
}

// Enqueue an event id (used by draw, by the engine specials, and by chaining).
export function enqueue(s: GameState, id: string): GameState {
  return { ...s, eventQueue: [...s.eventQueue, id] };
}

// --- choice application ----------------------------------------------------

export function activeEvent(s: GameState) {
  const id = s.eventQueue[0];
  return id ? DECK_BY_ID[id] : null;
}

export function chooseEvent(s: GameState, choiceId: string): GameState {
  const ev = activeEvent(s);
  if (!ev) return s;
  const choice = ev.choices(s).find((c) => c.id === choiceId);
  if (!choice || (choice.available && !choice.available(s))) return s;

  let next = choice.apply(s);
  // Pop the resolved event; record once-per-run.
  next = {
    ...next,
    eventQueue: next.eventQueue.filter((id, i) => !(i === 0 && id === ev.id)),
    seenEvents: next.seenEvents.includes(ev.id)
      ? next.seenEvents
      : [...next.seenEvents, ev.id],
  };
  return next;
}

// --- fuses (chaining) ------------------------------------------------------

// Resolve fuses at a term boundary: countdown fuses fire at 0; probabilistic
// fuses (the p-hack retraction) roll each term and climb until they hit.
export function resolveFuses(s: GameState): GameState {
  let next = s;
  const surviving: ActiveFuse[] = [];

  for (const fuse of s.fuses) {
    if (fuse.prob != null) {
      // Probabilistic, rising (spec §10 "probability rising each term").
      if (Math.random() < fuse.prob) {
        next = fireFuse(next, fuse.kind);
      } else {
        surviving.push({ ...fuse, prob: fuse.prob + (fuse.risePerTerm ?? 0) });
      }
      continue;
    }
    const termsLeft = fuse.termsLeft - 1;
    if (termsLeft <= 0) next = fireFuse(next, fuse.kind);
    else surviving.push({ ...fuse, termsLeft });
  }

  return { ...next, fuses: surviving };
}

function fireFuse(s: GameState, kind: FuseKind): GameState {
  switch (kind) {
    case "reviewer2-bigger":
      return apply(s, { knowledge: 8, log: "The reviewer's experiments revealed something bigger. +8 Knowledge." });
    case "predatory-exposed":
      return apply(s, { reputation: -3, log: "Your predatory 'paper' was spotted at review. −3 Rep." });
    case "authorship-dispute":
      return apply(s, { reputation: -1, morale: -5, log: "The authorship dispute blew up. −5 Morale, −1 Rep." });
    case "name-order-betrayal": {
      const left = adjustStudent(s, "Chloe Adeyemi", -100);
      return apply({ ...left, students: left.students.filter((st) => st.name !== "Chloe Adeyemi") }, { knowledge: -6, morale: -4, log: "Chloe left the lab — and took her project with her." });
    }
    case "ellie-resentment":
      return getFlag(s, "ellieInvested") > 0
        ? setFlag(pushLog(s, "You'd put the time in with Ellie. The resentment never came."), "ellieInvested", 0)
        : apply(s, { morale: -12, log: "The resentment you planted with Ellie came due. −12 Morale." });
    case "aisha-rival":
      return apply(s, { reputation: -2, morale: -4, knowledge: -4, log: "You met Aisha at a conference — thriving, in Holloway's lab. They scooped you." });
    case "imposter-relapse":
      return apply(s, { morale: -8, workload: 10, log: "The imposter syndrome you buried resurfaced, worse. −8 Morale." });
    case "marsh-enemy":
      return apply(s, { reputation: -1, morale: -4, log: "Marsh's faction made life difficult. −4 Morale, −1 Rep." });
    case "phack-retraction": {
      const hit = apply(s, { reputation: -8, morale: -10, knowledge: -6, log: "RETRACTION. The massaged paper unravelled. −8 Rep. A Misconduct Inquiry looms." });
      return hit.meters.reputation <= 0
        ? endRun(hit, "loss", "The Misconduct Inquiry ended your career. The spiciest button cost everything.")
        : hit;
    }
    case "leaving-academia":
      // The pushed-through burnout: a run-ender unless you clawed Morale back.
      return s.meters.morale < 30
        ? endRun(s, "loss", "You left academia. The fuse you lit pushing through burnout caught up.")
        : pushLog(s, "You pushed through burnout — but clawed your Morale back in time. The fuse fizzled.");
    case "promise-underload":
      // P2: you promised to ease off — kept only if you under-loaded since.
      return s.workload <= 40
        ? adjustRel(pushLog(s, "You kept your promise and eased off. They noticed."), 8)
        : adjustRel(apply(s, { morale: -6, log: "You broke your promise — another overloaded term. −Relationship." }), -15);
    case "partner-plateau":
      // P4 "not yet": the relationship quietly erodes.
      return adjustRel(apply(s, { morale: -4, log: "The plateau after \"not yet\" set in. The relationship cooled." }), -12);
  }
}
