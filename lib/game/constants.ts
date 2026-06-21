// Tunables (spec §17). All £ and week values follow the realistic UK numbers in
// spec §4. These were stress-tested by a balance pass — see the M1 plan for the
// rationale behind Time=11, grant=£15k, and the score weights.

// Per-term time budget. Tight on purpose (§17): at 11 weeks a term fits ~3
// meaningful actions, so allocation actually hurts and Coffee earns a niche.
export const WEEKS_PER_TERM = 11;

// Starting values for a Postdoc Gamble run (spec §4 scale).
export const STARTING = {
  time: WEEKS_PER_TERM,
  money: 15_000, // tight research budget; you will need a grant
  morale: 55, // 0–100; 0 → Burnout (§6)
  reputation: 4, // h-index-ish; gates talks/grants (§4, §7)
  workload: 20, // 0–100
  knowledge: 0,
  publications: 0,
} as const;

// Action costs / effects (§4: experiment campaign 3 wks + reagents £3–10k;
// paper 3 wks + open-access APC £3k; grant 4–6 wks; mentoring ½ day).
export const COSTS = {
  experiment: { time: 3, money: 4_000, knowledge: 6, workload: 15 },
  paper: { time: 3, money: 3_000, workload: 12, knowledgeRequired: 10 },
  grant: { time: 5, money: 1_000, workload: 8 },
  mentor: { time: 0.5, knowledge: 2, morale: 2, workload: 3 },
  coffee: { time: 2, workload: 15, morale: 2 }, // time GAINED; morale LOST
} as const;

// Paper acceptance: roll 2d6 + ⌊Rep/4⌋ ≥ threshold (§5 "2d6 on mid/top tiers").
export const PAPER = {
  repDivisor: 4,
  threshold: 9,
  accept: { knowledge: 10, publications: 1, reputation: 3, morale: 5 }, // deltas
  fail: { knowledge: 5, morale: 2 }, // losses
} as const;

// Grant: roll 2d6 + ⌊Rep/3⌋ ≥ threshold → pump-priming award (§4: £25k pump-
// priming; we award £15k so one win doesn't trivialise the economy — §17).
export const GRANT = {
  repDivisor: 3,
  threshold: 9,
  award: 15_000,
  failMorale: 3, // morale lost on rejection
} as const;

// End-of-term resolution (§5, §6).
export const END_OF_TERM = {
  salary: 3_000, // £ income/term (postdoc spare after living costs)
  lowMoneyThreshold: 2_000, // below this → Morale pain
  lowMoneyMorale: 5,
  overloadThreshold: 70, // Workload >70 → lose Morale
  overloadMorale: 10,
  underloadThreshold: 20, // Workload <20 → recover Morale
  underloadMorale: 5,
  workloadDecay: 15, // Workload recovered between terms
} as const;

// Burnout limits (§6).
export const BURNOUT = { morale: 0, workload: 100 } as const;

// Quick-mode score (§9): scenario-specific win bar + a comparable score.
// Score rewards overshoot so turn 5 stays tense once the binary win is locked.
export const SCORE = { repWeight: 3, moneyScale: 5_000, pubWeight: 5 } as const;
