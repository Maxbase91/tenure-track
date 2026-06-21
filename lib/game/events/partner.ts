// The partner thread events (spec §13) + the solo-life variants for runs with
// no partner. These join the main deck so the engine draws them like any other
// event. Private/partner events cost Time and Morale, not just flavour — that's
// the point (§13).

import {
  adjustRel,
  apply,
  lightFuse,
  pushLog,
  setFlag,
} from "./effects";
import type { EventChoice, GameEvent } from "./types";

// Spending Time on the partner also defuses the "declined for you" resentment
// fuse (#5) by marking that you've invested since.
const invest = (s: import("../types").GameState) => setFlag(s, "ellieInvested", 1);

export const PARTNER_EVENTS: GameEvent[] = [
  // ---- P1 Date Night vs Deadline -----------------------------------------
  {
    id: "p1-date-night",
    title: "Date Night vs Deadline",
    body: "It's the third cancelled dinner this month. The reservation is at eight. So is the grant deadline.",
    rarity: "common",
    weight: 2,
    trigger: (s) => s.hasPartner && s.relationship > 15,
    choices: () => [
      { id: "go", label: "Go (½ day)", detail: "+Relationship, +Morale", apply: (st) => invest(adjustRel(apply(st, { time: -0.5, morale: 4, log: "You went to dinner. They noticed. +Relationship." }), 12)) },
      { id: "cancel", label: "Cancel and work", detail: "Progress the grant, −Relationship", apply: (st) => adjustRel(apply(st, { knowledge: 3, morale: -2, log: "Cancelled again. The grant inches forward; the dinner goes cold." }), -14) },
      { id: "laptop", label: "Bring the laptop", detail: "Half of each, −Morale", apply: (st) => adjustRel(apply(st, { time: -0.5, knowledge: 1, morale: -3, log: "You brought the laptop to dinner. Nobody enjoyed it." }), -4) },
    ],
  },

  // ---- P2 The 3am Life ----------------------------------------------------
  {
    id: "p2-3am-life",
    title: "The 3am Life",
    body: "They woke at 3am to find your side of the bed empty and the kitchen light on. Again.",
    rarity: "common",
    weight: 2,
    trigger: (s) => s.hasPartner && s.workload >= 55,
    choices: () => [
      { id: "promise", label: "Promise to change", detail: "Must under-load next term · fuse", apply: (st) => lightFuse(pushLog(st, "You promised to ease off. They're holding you to it."), { kind: "promise-underload", termsLeft: 1 }) },
      { id: "temporary", label: '"It\'s temporary"', detail: "−Relationship", apply: (st) => adjustRel(apply(st, { morale: -2, log: "\"It's temporary,\" you said, for the fourth year running." }), -10) },
      { id: "they-help", label: "They help you at 3am", detail: "+Relationship, a small Knowledge save", apply: (st) => invest(adjustRel(apply(st, { knowledge: 2, morale: 2, log: "They made tea and proofread at 3am. This is love, apparently." }), 8)) },
    ],
  },

  // ---- P3 A Good Year (healthy only) -------------------------------------
  {
    id: "p3-good-year",
    title: "A Good Year",
    body: "Things are good. They suggest two weeks off-grid, no email, no cluster.",
    rarity: "rare",
    weight: 2,
    trigger: (s) => s.hasPartner && s.relationship >= 70,
    choices: () => [
      { id: "go-offgrid", label: "Go off-grid (lose 2 weeks)", detail: "Big Morale + Relationship", apply: (st) => invest(adjustRel(apply(st, { time: -2, morale: 18, workload: -15, log: "Two weeks off-grid. You came back human. +Morale." }), 15)) },
      { id: "decline", label: "Decline — too much to do", detail: "−Relationship", apply: (st) => adjustRel(apply(st, { morale: -2, log: "You declined the holiday. The window quietly closed." }), -12) },
    ],
  },

  // ---- P4 The Question (milestone) ---------------------------------------
  {
    id: "p4-the-question",
    title: "The Question",
    body: "You're at a wedding. They look at you a certain way. The question is in the air.",
    rarity: "rare",
    weight: 2,
    oncePerRun: true,
    trigger: (s) => s.hasPartner && s.relationship >= 75 && (s.flags.relMarried ?? 0) === 0,
    choices: () => [
      { id: "commit", label: "Commit (Time + money)", detail: "Deeper Morale buffer, higher future stakes", apply: (st) => invest(adjustRel(setFlag(apply(st, { time: -1, money: -5000, morale: 6, log: "You committed. The buffer deepens; so do the stakes." }), "relMarried", 1), 10)) },
      { id: "not-yet", label: "Not yet", detail: "The relationship plateaus · fuse", apply: (st) => lightFuse(pushLog(st, "\"Not yet,\" you said. Something settled, and not in a good way."), { kind: "partner-plateau", termsLeft: 3 }) },
    ],
  },

  // ---- P-end Drifting Apart (fired when the relationship bottoms out) -----
  {
    id: "p-end-drifting",
    title: "Drifting Apart",
    body: "There's no fight left. Just two people who became flatmates, then strangers.",
    rarity: "common",
    weight: 0,
    trigger: () => false, // engine-fired at relationship ≤ breakup threshold
    choices: () => [
      { id: "its-over", label: "It's over", detail: "A Morale crash now — then +Time/term, married to the lab", apply: (st) => setFlag({ ...apply(st, { morale: -20, log: "It ended. The flat is quiet. From now on, it's just you and the lab." }), hasPartner: false, relationship: 0 }, "marriedToLab", 1) },
    ],
  },

  // ---- Solo-life variants (no partner; spec §13) -------------------------
  {
    id: "solo-aging-parents",
    title: "Aging Parents",
    body: "Your mother fell. She's fine — but the phone call lands at the worst possible week.",
    rarity: "common",
    weight: 2,
    trigger: (s) => !s.hasPartner && s.term >= 2,
    choices: () => [
      { id: "go-home", label: "Go home for a week (lose 1 week)", detail: "+Morale, the right thing", apply: (st) => apply(st, { time: -1, morale: 8, log: "You went home for a week. The deadline waited. They mattered more." }) },
      { id: "cant", label: "Can't — too much on", detail: "−Morale, the guilt", apply: (st) => apply(st, { morale: -8, log: "You couldn't get away. The guilt files itself with the others." }) },
    ],
  },
  {
    id: "solo-hobby",
    title: "The Neglected Hobby",
    body: "You find your guitar under a pile of preprints. It's badly out of tune. So are you.",
    rarity: "common",
    weight: 1,
    trigger: (s) => !s.hasPartner,
    choices: () => [
      { id: "pick-up", label: "Pick it back up (½ day/week)", detail: "+Morale", apply: (st) => apply(st, { time: -0.5, morale: 6, log: "You started playing again. Badly, happily." }) },
      { id: "let-go", label: "Let it go", detail: "−Morale, a small grey loss", apply: (st) => apply(st, { morale: -3, log: "You put the guitar back under the preprints." }) },
    ],
  },
];

// Re-export the type so deck.ts can concatenate without an extra import.
export type { EventChoice };
