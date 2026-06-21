// Turn-loop state machine (spec §5–§6, §9), kept as pure functions so the rules
// are testable in isolation and later milestones can hook events / AI in without
// touching the React layer.

import {
  BURNOUT,
  COSTS,
  END_OF_TERM,
  GRANT,
  PAPER,
  SCORE,
  WEEKS_PER_TERM,
} from "./constants";
import { roll2d6 } from "./dice";
import { POSTDOC_GAMBLE, startState } from "./scenarios";
import type { ActionId, GameState } from "./types";

// --- helpers ---------------------------------------------------------------

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

// Newest-first, capped so the UI list stays short.
function log(s: GameState, line: string): string[] {
  return [line, ...s.log].slice(0, 8);
}

// --- lifecycle -------------------------------------------------------------

export function initialState(): GameState {
  return startState(POSTDOC_GAMBLE);
}

export function reset(): GameState {
  return initialState();
}

// --- action availability ---------------------------------------------------
// Drives button disabling + the reason shown to the player.

export function canDo(
  s: GameState,
  action: ActionId,
): { ok: boolean; reason?: string } {
  if (s.phase !== "playing") return { ok: false, reason: "Run is over." };
  const m = s.meters;

  switch (action) {
    case "experiment": {
      const c = COSTS.experiment;
      if (m.time < c.time) return { ok: false, reason: "Not enough time." };
      if (m.money < c.money)
        return { ok: false, reason: `Need £${c.money.toLocaleString()}.` };
      return { ok: true };
    }
    case "paper": {
      const c = COSTS.paper;
      if (m.time < c.time) return { ok: false, reason: "Not enough time." };
      if (s.knowledge < c.knowledgeRequired)
        return {
          ok: false,
          reason: `Need ${c.knowledgeRequired} Knowledge.`,
        };
      if (m.money < c.money)
        return { ok: false, reason: `Need £${c.money.toLocaleString()} APC.` };
      return { ok: true };
    }
    case "grant": {
      const c = COSTS.grant;
      if (m.time < c.time) return { ok: false, reason: "Not enough time." };
      if (m.money < c.money)
        return { ok: false, reason: `Need £${c.money.toLocaleString()}.` };
      return { ok: true };
    }
    case "mentor": {
      if (m.time < COSTS.mentor.time)
        return { ok: false, reason: "Not enough time." };
      return { ok: true };
    }
    case "coffee":
      return { ok: true }; // coffee buys time; always available while playing
  }
}

// --- actions ---------------------------------------------------------------
// Each assumes canDo() passed (the store + UI gate on it) but is harmless to
// call otherwise: it just no-ops via the guard below.

function blocked(s: GameState, action: ActionId): GameState | null {
  const v = canDo(s, action);
  return v.ok ? null : s;
}

export function runExperiment(s: GameState): GameState {
  const stop = blocked(s, "experiment");
  if (stop) return stop;
  const c = COSTS.experiment;
  const knowledge = s.knowledge + c.knowledge;
  return {
    ...s,
    meters: { ...s.meters, time: s.meters.time - c.time, money: s.meters.money - c.money },
    knowledge,
    workload: clamp(s.workload + c.workload, 0, 100),
    log: log(s, `Ran experiments: +${c.knowledge} Knowledge (now ${knowledge}), −£${c.money.toLocaleString()}.`),
  };
}

export function writePaper(s: GameState): GameState {
  const stop = blocked(s, "paper");
  if (stop) return stop;
  const c = COSTS.paper;
  const total = roll2d6();
  const bonus = Math.floor(s.meters.reputation / PAPER.repDivisor);
  const accepted = total + bonus >= PAPER.threshold;

  const base: GameState = {
    ...s,
    meters: { ...s.meters, time: s.meters.time - c.time, money: s.meters.money - c.money },
    workload: clamp(s.workload + c.workload, 0, 100),
  };

  if (accepted) {
    const a = PAPER.accept;
    return {
      ...base,
      knowledge: s.knowledge - a.knowledge,
      publications: s.publications + a.publications,
      meters: {
        ...base.meters,
        reputation: s.meters.reputation + a.reputation,
        morale: clamp(s.meters.morale + a.morale, 0, 100),
      },
      log: log(s, `Paper ACCEPTED (rolled ${total}+${bonus}≥${PAPER.threshold}): +${a.reputation} Reputation, publication #${s.publications + 1}.`),
    };
  }
  const f = PAPER.fail;
  return {
    ...base,
    knowledge: Math.max(0, s.knowledge - f.knowledge),
    meters: { ...base.meters, morale: clamp(s.meters.morale - f.morale, 0, 100) },
    log: log(s, `Paper REJECTED (rolled ${total}+${bonus}<${PAPER.threshold}): −${f.knowledge} Knowledge, −${f.morale} Morale.`),
  };
}

export function writeGrant(s: GameState): GameState {
  const stop = blocked(s, "grant");
  if (stop) return stop;
  const c = COSTS.grant;
  const total = roll2d6();
  const bonus = Math.floor(s.meters.reputation / GRANT.repDivisor);
  const won = total + bonus >= GRANT.threshold;

  const base: GameState = {
    ...s,
    meters: { ...s.meters, time: s.meters.time - c.time, money: s.meters.money - c.money },
    workload: clamp(s.workload + c.workload, 0, 100),
  };

  if (won) {
    return {
      ...base,
      meters: { ...base.meters, money: base.meters.money + GRANT.award },
      log: log(s, `Grant FUNDED (rolled ${total}+${bonus}≥${GRANT.threshold}): +£${GRANT.award.toLocaleString()}.`),
    };
  }
  return {
    ...base,
    meters: { ...base.meters, morale: clamp(s.meters.morale - GRANT.failMorale, 0, 100) },
    log: log(s, `Grant REJECTED (rolled ${total}+${bonus}<${GRANT.threshold}): −${GRANT.failMorale} Morale.`),
  };
}

export function mentor(s: GameState): GameState {
  const stop = blocked(s, "mentor");
  if (stop) return stop;
  const c = COSTS.mentor;
  return {
    ...s,
    meters: {
      ...s.meters,
      time: s.meters.time - c.time,
      morale: clamp(s.meters.morale + c.morale, 0, 100),
    },
    knowledge: s.knowledge + c.knowledge,
    workload: clamp(s.workload + c.workload, 0, 100),
    log: log(s, `Mentored a student: +${c.knowledge} Knowledge, +${c.morale} Morale.`),
  };
}

export function drinkCoffee(s: GameState): GameState {
  const stop = blocked(s, "coffee");
  if (stop) return stop;
  const c = COSTS.coffee;
  return {
    ...s,
    meters: {
      ...s.meters,
      time: s.meters.time + c.time, // coffee BUYS time
      morale: clamp(s.meters.morale - c.morale, 0, 100),
    },
    workload: clamp(s.workload + c.workload, 0, 100),
    coffeeCups: s.coffeeCups + 1,
    log: log(s, `Drank coffee: +${c.time} weeks, +${c.workload} Workload, −${c.morale} Morale.`),
  };
}

export const ACTIONS: Record<ActionId, (s: GameState) => GameState> = {
  experiment: runExperiment,
  paper: writePaper,
  grant: writeGrant,
  mentor,
  coffee: drinkCoffee,
};

// --- end of term -----------------------------------------------------------

function score(s: GameState): number {
  return (
    SCORE.repWeight * s.meters.reputation +
    Math.round(s.meters.money / SCORE.moneyScale) +
    SCORE.pubWeight * s.publications
  );
}

function gameOver(s: GameState, outcome: "win" | "loss", line: string): GameState {
  return { ...s, phase: "gameover", outcome, score: score(s), log: log(s, line) };
}

// End the current term: salary, Morale checks, burnout, then advance or finish.
export function endTurn(s: GameState): GameState {
  if (s.phase !== "playing") return s;
  const e = END_OF_TERM;
  const notes: string[] = [];

  let money = s.meters.money + e.salary;
  notes.push(`+£${e.salary.toLocaleString()} salary`);

  let morale = s.meters.morale;
  if (money < e.lowMoneyThreshold) {
    morale -= e.lowMoneyMorale;
    notes.push(`−${e.lowMoneyMorale} Morale (broke)`);
  }
  if (s.workload > e.overloadThreshold) {
    morale -= e.overloadMorale;
    notes.push(`−${e.overloadMorale} Morale (overloaded)`);
  } else if (s.workload < e.underloadThreshold) {
    morale += e.underloadMorale;
    notes.push(`+${e.underloadMorale} Morale (rested)`);
  }
  morale = clamp(morale, 0, 100);

  const settled: GameState = {
    ...s,
    meters: { ...s.meters, money, morale },
    log: log(s, `End of term ${s.term}: ${notes.join(", ")}.`),
  };

  // Burnout (§6): Morale 0 or Workload 100.
  if (morale <= BURNOUT.morale || s.workload >= BURNOUT.workload) {
    return gameOver(settled, "loss", "BURNOUT. The lab carries on without you.");
  }

  // Tenure clock runs out → win/score check (§9).
  if (s.term >= s.maxTerms) {
    const won = POSTDOC_GAMBLE.hasWon(settled);
    return won
      ? gameOver(settled, "win", "You landed the job offer. Tenure track, here you come.")
      : gameOver(settled, "loss", "No offer this cycle. The postdoc treadmill turns again.");
  }

  // Advance: refresh Time, decay Workload, reset per-term Coffee.
  return {
    ...settled,
    term: s.term + 1,
    meters: { ...settled.meters, time: WEEKS_PER_TERM },
    workload: clamp(s.workload - e.workloadDecay, 0, 100),
    coffeeCups: 0,
  };
}
