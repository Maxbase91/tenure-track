// Tunables (spec §17). M0 keeps only what the turn loop and the four quick
// meters need. £ and week values follow the realistic UK numbers in spec §4.

// Quick mode runs 3–4 terms (§2). Postdoc-style default for M0 skeleton.
export const QUICK_MODE_TERMS = 4;

// Per-term time budget (§4: ~15 weeks/term).
export const WEEKS_PER_TERM = 15;

// Starting values for the four quick-mode meters (§4).
// Money merges personal + research funding in quick mode.
export const STARTING = {
  time: WEEKS_PER_TERM,
  money: 40_000, // postdoc salary order of magnitude (§4)
  morale: 70, // 0–100; 0 → Burnout (§6)
  reputation: 4, // h-index-ish; gates talks/grants (§4, §7)
} as const;
