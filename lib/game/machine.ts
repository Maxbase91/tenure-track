// Turn-loop state machine (spec §5–§6, §9) + event-engine integration (§10).
// Pure functions: rules stay testable and serializable for M4.

import {
  BURNOUT,
  COSTS,
  END_OF_TERM,
  EVENTS,
  GRANT,
  PAPER,
  SCORE,
  WEEKS_PER_TERM,
} from "./constants";
import { rollD6, roll2d6 } from "./dice";
import { adjustStudent, getFlag, setFlag } from "./events/effects";
import { chooseEvent, drawEvent, enqueue, resolveFuses } from "./events/engine";
import { POSTDOC_GAMBLE, startState } from "./scenarios";
import type { ActionId, GameState } from "./types";

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

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

// An event modal is open → the turn is paused; nothing else may act.
export function eventPending(s: GameState): boolean {
  return s.eventQueue.length > 0;
}

// --- action availability ---------------------------------------------------

export function canDo(
  s: GameState,
  action: ActionId,
): { ok: boolean; reason?: string } {
  if (s.phase !== "playing") return { ok: false, reason: "Run is over." };
  if (eventPending(s)) return { ok: false, reason: "Resolve the event first." };
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
        return { ok: false, reason: `Need ${c.knowledgeRequired} Knowledge.` };
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
    case "mentor":
      if (m.time < COSTS.mentor.time)
        return { ok: false, reason: "Not enough time." };
      return { ok: true };
    case "coffee":
      return { ok: true };
  }
}

function blocked(s: GameState, action: ActionId): GameState | null {
  return canDo(s, action).ok ? null : s;
}

// --- actions ---------------------------------------------------------------

export function runExperiment(s: GameState): GameState {
  const stop = blocked(s, "experiment");
  if (stop) return stop;
  const c = COSTS.experiment;

  // Haunted centrifuge curse (#13): the next experiment may fail mysteriously.
  let cursed = false;
  let after = s;
  if (getFlag(s, "hauntedCentrifuge") > 0) {
    after = setFlag(s, "hauntedCentrifuge", 0);
    cursed = rollD6() <= 2; // ~1/3
  }

  const gained = cursed ? 0 : c.knowledge;
  const knowledge = after.knowledge + gained;
  return {
    ...after,
    meters: { ...after.meters, time: after.meters.time - c.time, money: after.meters.money - c.money },
    knowledge,
    workload: clamp(after.workload + c.workload, 0, 100),
    log: log(after, cursed
      ? `Experiments failed mysteriously (the centrifuge…). +0 Knowledge, −£${c.money.toLocaleString()}.`
      : `Ran experiments: +${gained} Knowledge (now ${knowledge}), −£${c.money.toLocaleString()}.`),
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
    // Sir Geoffrey's donor lock (#12): safe, low-Rep work for a few terms.
    const locked = getFlag(s, "donorLock") > 0;
    const repGain = locked ? 1 : a.reputation;
    return {
      ...base,
      knowledge: s.knowledge - a.knowledge,
      publications: s.publications + a.publications,
      meters: {
        ...base.meters,
        reputation: s.meters.reputation + repGain,
        morale: clamp(s.meters.morale + a.morale, 0, 100),
      },
      log: log(s, `Paper ACCEPTED (rolled ${total}+${bonus}≥${PAPER.threshold}): +${repGain} Reputation${locked ? " (donor-locked)" : ""}, publication #${s.publications + 1}.`),
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
  // Reputation + event modifiers: Pemberton backing (#4), a resubmit (#8),
  // minus a funder you swore off (#8).
  const backing = getFlag(s, "grantBacking") > 0 ? 3 : 0;
  const better = getFlag(s, "grantBetterOdds") > 0 ? 2 : 0;
  const closed = getFlag(s, "funderClosed") > 0 ? 1 : 0;
  const bonus = Math.floor(s.meters.reputation / GRANT.repDivisor) + backing + better - closed;
  const won = total + bonus >= GRANT.threshold;

  let base: GameState = {
    ...s,
    meters: { ...s.meters, time: s.meters.time - c.time, money: s.meters.money - c.money },
    workload: clamp(s.workload + c.workload, 0, 100),
  };
  // Consume single-use modifiers.
  if (backing) base = setFlag(base, "grantBacking", 0);
  if (better) base = setFlag(base, "grantBetterOdds", 0);

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
  const bonusKnowledge = getFlag(s, "mentorshipBonus") > 0 ? 1 : 0; // supervisor's halo (#4)
  // Mentoring raises your student's loyalty — the karma investment (§8).
  const withLoyalty = s.students.length
    ? adjustStudent(s, s.students[0].name, EVENTS.mentorLoyalty)
    : s;
  return {
    ...withLoyalty,
    meters: {
      ...withLoyalty.meters,
      time: withLoyalty.meters.time - c.time,
      morale: clamp(withLoyalty.meters.morale + c.morale, 0, 100),
    },
    knowledge: withLoyalty.knowledge + c.knowledge + bonusKnowledge,
    workload: clamp(withLoyalty.workload + c.workload, 0, 100),
    log: log(s, `Mentored ${s.students[0]?.name ?? "a student"}: +${c.knowledge + bonusKnowledge} Knowledge, +${c.morale} Morale, loyalty up.`),
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
      time: s.meters.time + c.time,
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

// --- event choice (re-export so the store has one surface) ----------------

export function choose(s: GameState, choiceId: string): GameState {
  return chooseEvent(s, choiceId);
}

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

export function endTurn(s: GameState): GameState {
  if (s.phase !== "playing" || eventPending(s)) return s;
  const e = END_OF_TERM;
  const notes: string[] = [];

  let money = s.meters.money + e.salary;
  notes.push(`+£${e.salary.toLocaleString()} salary`);

  let morale = s.meters.morale;
  let workload = s.workload;
  if (money < e.lowMoneyThreshold) {
    morale -= e.lowMoneyMorale;
    notes.push(`−${e.lowMoneyMorale} Morale (broke)`);
  }
  if (workload > e.overloadThreshold) {
    morale -= e.overloadMorale;
    notes.push(`−${e.overloadMorale} Morale (overloaded)`);
  } else if (workload < e.underloadThreshold) {
    morale += e.underloadMorale;
    notes.push(`+${e.underloadMorale} Morale (rested)`);
  }

  // Long-distance commuting (#5): a steady drain for its 4 terms.
  let flags = s.flags;
  if (getFlag(s, "longDistanceTerms") > 0) {
    morale -= 4;
    workload += 8;
    flags = { ...flags, longDistanceTerms: getFlag(s, "longDistanceTerms") - 1 };
    notes.push("−4 Morale (long-distance)");
  }

  morale = clamp(morale, 0, 100);
  workload = clamp(workload, 0, 100);

  let settled: GameState = {
    ...s,
    flags,
    meters: { ...s.meters, money, morale },
    workload,
    log: log(s, `End of term ${s.term}: ${notes.join(", ")}.`),
  };

  const isFinalTerm = s.term >= s.maxTerms;
  const isBurnout = morale <= BURNOUT.morale || workload >= BURNOUT.workload;

  // Final-term burnout is fatal even at the finish line (§6 loss condition).
  if (isFinalTerm) {
    if (isBurnout)
      return gameOver(settled, "loss", "BURNOUT at the finish line. The lab carries on without you.");
    const won = POSTDOC_GAMBLE.hasWon(settled);
    return won
      ? gameOver(settled, "win", "You landed the job offer. Tenure track, here you come.")
      : gameOver(settled, "loss", "No offer this cycle. The postdoc treadmill turns again.");
  }

  // Resolve fuses (chaining) — may itself end the run (#9 retraction, #15 fuse).
  settled = resolveFuses(settled);
  if (settled.phase === "gameover") return { ...settled, score: score(settled) };

  // Advance the term: refresh Time (half if pushing through burnout), decay
  // Workload, reset Coffee, tick down the donor lock.
  const halfTime = getFlag(settled, "halfTime") > 0;
  let advanced: GameState = {
    ...settled,
    term: s.term + 1,
    meters: { ...settled.meters, time: halfTime ? Math.floor(WEEKS_PER_TERM / 2) : WEEKS_PER_TERM },
    workload: clamp(settled.workload - e.workloadDecay, 0, 100),
    coffeeCups: 0,
  };
  if (halfTime) advanced = setFlag(advanced, "halfTime", 0);
  if (getFlag(advanced, "donorLock") > 0)
    advanced = setFlag(advanced, "donorLock", getFlag(advanced, "donorLock") - 1);

  // Engine-fired specials take the event slot first (spec §10, events #15/#16).
  if (isBurnout) return enqueue(advanced, "burnout");
  if (s.coffeeCups >= EVENTS.caffeineCrashCups) return enqueue(advanced, "caffeine-crash");

  // Otherwise draw from the deck (conditional, weighted).
  return drawEvent(advanced);
}
