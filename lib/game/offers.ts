// Procedural PhD offer generator (spec §12). Each career game generates 3–5
// varied offers honouring the set constraints: span ≥3 distinct prestige tiers,
// no duplicate universities, and always include ≥1 well-funded and ≥1
// high-mentoring option so the choice is real.

import { pickUniversity, type Stars } from "./universities";

export type Team = "tiny" | "small" | "large";
export type Funding = "tight" | "modest" | "comfortable" | "flush";

export interface Offer {
  id: string;
  profile: string;
  university: string;
  stars: Stars;
  supervisor: string;
  instRep: number; // 2–5 (drives the Reputation halo + grant/journal gate)
  mentoring: number; // 1–5 (per-term Knowledge bonus + fewer credit-grabs)
  team: Team; // collaboration vs first-author competition
  funding: Funding; // starting research funding + experiment ease
  hotTopic: boolean; // start on a frontier topic with an active scoop race
  runFeel: string;
}

type Range = [number, number];
interface Profile {
  name: string;
  instRep: Range;
  mentoring: Range;
  team: Team | "random";
  funding: Funding | "random";
  hotTopicChance: number;
}

// The generation profiles (spec §12 table) that bias the attribute vector.
const PROFILES: Record<string, Profile> = {
  cathedral: { name: "Cathedral", instRep: [5, 5], mentoring: [1, 2], team: "large", funding: "flush", hotTopicChance: 0.05 },
  risingStar: { name: "Rising Star", instRep: [3, 4], mentoring: [5, 5], team: "small", funding: "comfortable", hotTopicChance: 0.1 },
  quietLife: { name: "Quiet Life", instRep: [2, 2], mentoring: [3, 3], team: "small", funding: "modest", hotTopicChance: 0 },
  longShot: { name: "Long Shot", instRep: [3, 3], mentoring: [3, 3], team: "tiny", funding: "tight", hotTopicChance: 1 },
  wildcard: { name: "Wildcard", instRep: [2, 5], mentoring: [1, 5], team: "random", funding: "random", hotTopicChance: 0.25 },
};

const FIRST = ["Alan", "Nadia", "Brian", "Marcus", "Sarah", "Margaret", "James", "Priya", "Stephen", "Elena", "Klaus", "Sofia", "Henrik", "Daniel", "Anya", "Raj", "Claire", "Lukas", "Maria", "David", "Ingrid", "Pierre", "Mei", "Tomas"];
const SURNAME = ["Pemberton", "Rahman", "Oakes", "Reid", "Whitfield", "Critchley", "Holloway", "Nair", "Marsh", "Vogel", "Bianchi", "Lindqvist", "Moreau", "Schneider", "Novak", "Andersson", "Müller", "Rossi", "Fischer", "Laurent", "Petrova", "Okafor"];

const TEAMS: Team[] = ["tiny", "small", "large"];
const FUNDINGS: Funding[] = ["tight", "modest", "comfortable", "flush"];

const rnd = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function supervisorName(used: Set<string>): string {
  for (let i = 0; i < 50; i++) {
    const name = `Dr. ${pick(FIRST)} ${pick(SURNAME)}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  return `Dr. ${pick(FIRST)} ${pick(SURNAME)}`;
}

// A random person name (used for the scientist + partner Randomise buttons).
export function randomPersonName(): string {
  return `${pick(FIRST)} ${pick(SURNAME)}`;
}

function runFeel(o: Omit<Offer, "runFeel">): string {
  if (o.hotTopic) return "A frontier topic with a rival breathing down your neck — glory or scooped.";
  if (o.profile === "Cathedral") return "A famous name on your CV — if you can get noticed in the crowd.";
  if (o.profile === "Rising Star") return "A hungry young PI who'll actually read your drafts.";
  if (o.profile === "Quiet Life") return "Modest, humane, unhurried. You might even sleep.";
  if (o.funding === "flush") return "Money is no object; attention is.";
  if (o.funding === "tight") return "You'll learn to do a lot with very little.";
  return "A solid bet. Not flashy, not foolish.";
}

function buildOffer(profileKey: string, exclude: Set<string>, usedSupervisors: Set<string>, i: number): Offer {
  const p = PROFILES[profileKey];
  const instRep = rnd(p.instRep[0], p.instRep[1]);
  const stars = Math.max(2, Math.min(5, instRep)) as Stars;
  const university = pickUniversity(stars, exclude);
  exclude.add(university);
  const base: Omit<Offer, "runFeel"> = {
    id: `offer-${i}`,
    profile: p.name,
    university,
    stars,
    supervisor: supervisorName(usedSupervisors),
    instRep,
    mentoring: rnd(p.mentoring[0], p.mentoring[1]),
    team: p.team === "random" ? pick(TEAMS) : p.team,
    funding: p.funding === "random" ? pick(FUNDINGS) : p.funding,
    hotTopic: Math.random() < p.hotTopicChance,
  };
  return { ...base, runFeel: runFeel(base) };
}

function satisfiesConstraints(offers: Offer[]): boolean {
  const tiers = new Set(offers.map((o) => o.stars));
  const unis = new Set(offers.map((o) => o.university));
  const wellFunded = offers.some((o) => o.funding === "flush" || o.funding === "comfortable");
  const highMentoring = offers.some((o) => o.mentoring >= 4);
  return tiers.size >= 3 && unis.size === offers.length && wellFunded && highMentoring;
}

// Generate 3–5 offers honouring the constraints. Seeds with Cathedral (flush,
// tier 5) + Rising Star (mentoring 5) to guarantee the well-funded and
// high-mentoring requirements, then varies the rest; retries until valid.
export function generateOffers(): Offer[] {
  for (let attempt = 0; attempt < 40; attempt++) {
    const count = rnd(3, 5);
    const extras = ["quietLife", "longShot", "wildcard", "wildcard"];
    const keys = ["cathedral", "risingStar"];
    while (keys.length < count) keys.push(pick(extras));

    const exclude = new Set<string>();
    const sup = new Set<string>();
    const offers = keys.map((k, i) => buildOffer(k, exclude, sup, i));
    if (satisfiesConstraints(offers)) return offers;
  }
  // Fallback (should never hit): the two guaranteed seeds + one quiet life.
  const exclude = new Set<string>();
  const sup = new Set<string>();
  return ["cathedral", "risingStar", "quietLife"].map((k, i) => buildOffer(k, exclude, sup, i));
}

// Map an offer's attributes onto starting-state tilts (spec §12 "attribute
// meanings"). Returns plain deltas/flags the run builder applies.
export function offerTilt(o: Offer): {
  money: number;
  reputation: number;
  knowledge: number;
  mentorshipBonus: number;
  hotTopic: number;
} {
  const fundingMoney: Record<Funding, number> = { tight: 0, modest: 6000, comfortable: 14000, flush: 30000 };
  const teamKnowledge: Record<Team, number> = { tiny: 0, small: 2, large: 5 };
  return {
    money: fundingMoney[o.funding],
    reputation: o.instRep - 3, // tier 3 is neutral; 5 → +2 halo, 2 → −1
    knowledge: teamKnowledge[o.team],
    mentorshipBonus: o.mentoring >= 4 ? 1 : 0, // strong mentor → supervisor halo
    hotTopic: o.hotTopic ? 1 : 0,
  };
}
