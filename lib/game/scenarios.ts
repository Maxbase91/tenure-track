// Scenarios + the run builder (spec §2, §3, §5, §9). One career arc and the four
// quick-mode entry points, each setting starting stage and win condition. The
// setup flow (SetupFlow.tsx) collects a SetupConfig; buildRun turns it into the
// opening GameState, applying field and PhD-offer tilts and the partner thread.

import { STARTING, WEEKS_PER_TERM } from "./constants";
import { FIELD_BY_ID, type FieldId } from "./fields";
import type { Offer } from "./offers";
import { offerTilt } from "./offers";
import type { GameState, Mode, Role, ScenarioId, Student } from "./types";

interface ScenarioDef {
  id: ScenarioId;
  mode: Mode;
  label: string;
  blurb: string;
  role: Role;
  maxTerms: number;
  // Starting overrides on top of the postdoc baseline (STARTING).
  start: Partial<{ money: number; morale: number; reputation: number; workload: number }>;
  students: Student[];
  hasWon: (s: GameState) => boolean;
}

const ben = (): Student[] => [{ name: "Ben Hartley", loyalty: 30 }];

export const SCENARIOS: Record<ScenarioId, ScenarioDef> = {
  career: {
    id: "career",
    mode: "career",
    label: "Career",
    blurb: "The full arc, PhD to the tenure decision. Win tenure: Reputation 12 with at least 4 papers.",
    role: "junior",
    maxTerms: 9,
    start: { money: 8000, morale: 60, reputation: 2 }, // PhD stipend, fresh start
    students: [],
    hasWon: (s) => s.meters.reputation >= 12 && s.publications >= 4,
  },
  "phd-crunch": {
    id: "phd-crunch",
    mode: "quick",
    label: "The PhD Crunch",
    blurb: "3rd-year PhD, stipend running out. Submit a thesis-worthy paper: a publication and Reputation 5 by term 4.",
    role: "junior",
    maxTerms: 4,
    start: { money: 8000, morale: 60, reputation: 2 },
    students: [],
    hasWon: (s) => s.publications >= 1 && s.meters.reputation >= 5,
  },
  "postdoc-gamble": {
    id: "postdoc-gamble",
    mode: "quick",
    label: "The Postdoc Gamble",
    blurb: "Land a faculty job offer: reach Reputation 9 with at least 2 papers by the end of term 5.",
    role: "junior",
    maxTerms: 5,
    start: {},
    students: ben(),
    hasWon: (s) => s.meters.reputation >= 9 && s.publications >= 2,
  },
  "new-pi": {
    id: "new-pi",
    mode: "quick",
    label: "New PI, Empty Lab",
    blurb: "Freshly hired lecturer, no team, no grant. Pass probation: win a grant and reach Reputation 8 by term 4.",
    role: "pi",
    maxTerms: 4,
    start: { money: 20000, morale: 60, reputation: 6 },
    students: [], // empty lab
    hasWon: (s) => (s.flags.grantsWon ?? 0) >= 1 && s.meters.reputation >= 8,
  },
  "tenure-sprint": {
    id: "tenure-sprint",
    mode: "quick",
    label: "The Tenure Sprint",
    blurb: "Established, pre-tenure. Out-run the committee: reach Reputation 14 with at least 3 papers by term 4.",
    role: "pi",
    maxTerms: 4,
    start: { money: 30000, morale: 55, reputation: 10 },
    students: [{ name: "Chloe Adeyemi", loyalty: 55 }, { name: "Priya Nair", loyalty: 45 }],
    hasWon: (s) => s.meters.reputation >= 14 && s.publications >= 3,
  },
};

export interface SetupConfig {
  mode: Mode;
  scenario: ScenarioId; // "career" for career mode; an entry point for quick
  field: FieldId;
  scientistName: string;
  hasPartner: boolean;
  partnerName: string | null;
  partnerField: FieldId | null;
  offer: Offer | null; // career only (chosen PhD offer)
}

export function buildRun(config: SetupConfig): GameState {
  const def = SCENARIOS[config.scenario];
  const field = FIELD_BY_ID[config.field];

  // Baseline meters (postdoc) + scenario overrides + field tilt.
  let money = def.start.money ?? STARTING.money;
  let morale = def.start.morale ?? STARTING.morale;
  let reputation = def.start.reputation ?? STARTING.reputation;
  const workload = def.start.workload ?? STARTING.workload;
  let knowledge = STARTING.knowledge;

  money += field.tilt.money ?? 0;
  morale += field.tilt.morale ?? 0;
  reputation += field.tilt.reputation ?? 0;
  knowledge += field.tilt.knowledge ?? 0;

  const flags: Record<string, number> = { mentorshipBonus: 1 };

  // Apply the chosen PhD offer's tilt (career mode, spec §12).
  if (config.offer) {
    const t = offerTilt(config.offer);
    money += t.money;
    reputation = Math.max(0, reputation + t.reputation);
    knowledge += t.knowledge;
    flags.mentorshipBonus = t.mentorshipBonus;
    if (t.hotTopic) flags.hotTopic = 1; // active scoop race (Dr. Holloway)
  }

  const blurb = config.offer
    ? `${def.label} — ${config.offer.university}, ${config.offer.supervisor}. ${config.offer.runFeel}`
    : `${def.label}. ${def.blurb}`;

  return {
    phase: "playing",
    outcome: null,
    mode: def.mode,
    scenario: def.id,
    field: config.field,
    scientistName: config.scientistName || "Anonymous",
    role: def.role,
    term: 1,
    maxTerms: def.maxTerms,
    meters: { time: WEEKS_PER_TERM, money, morale: Math.max(0, Math.min(100, morale)), reputation },
    workload,
    knowledge,
    publications: 0,
    coffeeCups: 0,

    students: def.students.map((s) => ({ ...s })),
    hasPartner: config.hasPartner,
    partnerName: config.hasPartner ? config.partnerName : null,
    partnerField: config.hasPartner ? config.partnerField : null,
    relationship: config.hasPartner ? 70 : 0,

    fuses: [],
    flags,
    seenEvents: [],
    eventQueue: [],

    score: 0,
    log: [blurb],
  };
}

// The placeholder run the store holds while the setup flow is open. Phase is
// "setup" so the UI shows SetupFlow; the field values are never read until a
// real run is built by buildRun.
export function setupPlaceholder(): GameState {
  const run = buildRun({
    mode: "quick",
    scenario: "postdoc-gamble",
    field: "molecular-biology",
    scientistName: "",
    hasPartner: false,
    partnerName: null,
    partnerField: null,
    offer: null,
  });
  return { ...run, phase: "setup" };
}
