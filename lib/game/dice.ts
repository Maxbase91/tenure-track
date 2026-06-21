// Dice. Math.random is fine for M1 — deterministic/seeded rolls only matter once
// runs are serialised to Neon (M4).

export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

// 2d6 (spec §5). Returns the summed total, 2–12.
export function roll2d6(): number {
  return rollD6() + rollD6();
}
