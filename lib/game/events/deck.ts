// The event deck (spec §10 + the v2 events file §7). All 16 seed events, wired
// with conditional triggers, state-dependent choices, fuses (chaining), karma
// (student loyalty), the role-aware "Whose Name Goes First", and the two
// engine-fired specials (#15 Burnout, #16 Caffeine Crash).
//
// Costs use the realistic UK numbers from the spec; a few legendary sums are
// scaled to the quick-mode economy (noted inline) so one card can't break it.

import { EVENTS } from "../constants";
import { rollD6 } from "../dice";
import type { GameState } from "../types";
import {
  addStudent,
  adjustStudent,
  apply,
  lightFuse,
  maxLoyalty,
  pushLog,
  setFlag,
} from "./effects";
import type { EventChoice, GameEvent } from "./types";

const half = (n: number) => Math.ceil(n / 2);

export const DECK: GameEvent[] = [
  // ---------------------------------------------------------------- #1
  {
    id: "reviewer-2",
    title: "Reviewer 2",
    body: "Back from review. Reviewer 2 has concerns. All of them. Reviewer 1 said accept. Reviewer 3 reviewed a different paper.",
    rarity: "common",
    weight: 3,
    trigger: (s) => s.knowledge >= 6,
    choices: (s) => [
      {
        id: "rebuttal",
        label: "Rebuttal (2 weeks, +Workload)",
        detail: s.meters.reputation >= 5 ? "Rep ≥ 5 → accepted" : "Rep < 5 → rejected anyway",
        available: (st) => st.meters.time >= 2,
        apply: (st) =>
          st.meters.reputation >= 5
            ? apply(st, { time: -2, workload: 10, knowledge: -10, publications: 1, reputation: 2, log: "Rebuttal worked — accepted. +2 Rep." })
            : apply(st, { time: -2, workload: 10, morale: -4, log: "Rebuttal rejected anyway. −4 Morale." }),
      },
      {
        id: "experiments",
        label: "Run the three demanded experiments (6 weeks, £8k)",
        detail: "Accepted · fuse: the new data reveals something bigger",
        available: (st) => st.meters.time >= 6 && st.meters.money >= 8000,
        apply: (st) => {
          let n = apply(st, { time: -6, money: -8000, workload: 12, knowledge: -10, publications: 1, reputation: 2, log: "Did the experiments — accepted. Something looks bigger here…" });
          return lightFuse(n, { kind: "reviewer2-bigger", termsLeft: 2 });
        },
      },
      {
        id: "dump",
        label: "Dump it in a lesser journal (3 days)",
        detail: "+small Rep only",
        apply: (st) => apply(st, { time: -0.5, reputation: 1, knowledge: -10, log: "Dumped it in a lesser journal. +1 Rep." }),
      },
    ],
  },

  // ---------------------------------------------------------------- #2
  {
    id: "freezer",
    title: "The −80 Freezer Dies",
    body: "02:47. The freezer hit −11°C. Your samples are sweating.",
    rarity: "common",
    weight: 2,
    trigger: (s) => s.knowledge >= 6,
    choices: (s) => {
      const list: EventChoice[] = [
        {
          id: "callout",
          label: "Emergency callout (£4,000) + salvage",
          detail: "Keep your Knowledge",
          available: (st) => st.meters.money >= 4000,
          apply: (st) => apply(st, { money: -4000, log: "Emergency callout — samples saved. −£4,000." }),
        },
        {
          id: "letgo",
          label: "Let it go",
          detail: "Lose half your unpublished Knowledge",
          apply: (st) => apply(st, { knowledge: -half(st.knowledge), morale: -3, log: `Let it go. Lost ${half(st.knowledge)} Knowledge.` }),
        },
      ];
      // Karma payoff (§8): a loyal student saves the samples at 3am.
      if (maxLoyalty(s) >= EVENTS.loyaltyRescueThreshold) {
        list.push({
          id: "ben-3am",
          label: "Ben drives in at 3am and saves most of it",
          detail: "Lose nothing; his loyalty rises",
          apply: (st) => apply(adjustStudent(st, st.students[0]?.name ?? "", 6), { morale: 2, log: "A loyal student drove in at 3am. Samples saved, loyalty up." }),
        });
      }
      return list;
    },
  },

  // ---------------------------------------------------------------- #3
  {
    id: "esteemed-professor",
    title: '"Esteemed Professor"',
    body: "The International Journal of Frontier Science Advances admires your seminal work. Publication fee: £600.",
    rarity: "common",
    weight: 2,
    trigger: () => true,
    choices: () => [
      { id: "delete", label: "Delete", detail: "Correct.", apply: (st) => pushLog(st, "Deleted the predatory spam. Correct.") },
      {
        id: "pay",
        label: "Pay and pad the CV (£600)",
        detail: 'A "paper" worth nothing · fuse: spotted at your next review',
        available: (st) => st.meters.money >= 600,
        apply: (st) => lightFuse(apply(st, { money: -600, log: "Paid the predatory journal. A paper worth nothing." }), { kind: "predatory-exposed", termsLeft: 2 }),
      },
    ],
  },

  // ---------------------------------------------------------------- #4 (role-aware)
  {
    id: "whose-name-first",
    title: "Whose Name Goes First?",
    body: "Authorship. Always authorship.",
    rarity: "common",
    weight: 2,
    trigger: (s) => s.knowledge >= 8,
    choices: (s) =>
      s.role === "pi"
        ? [
            {
              id: "student-first",
              label: "Chloe first (friendly)",
              detail: "Her loyalty + Morale rise; your Rep gain is smaller. Karma+",
              apply: (st) => apply(adjustStudent(st, "Chloe Adeyemi", 12), { reputation: 1, morale: 3, log: "Chloe goes first. Loyalty up, smaller Rep. Karma+." }),
            },
            {
              id: "you-first",
              label: "You first (evil)",
              detail: "Big Rep now; her loyalty drops · fuse: she won't cover you",
              apply: (st) => lightFuse(apply(adjustStudent(st, "Chloe Adeyemi", -25), { reputation: 4, log: "You took first author. Big Rep — but Chloe noticed." }), { kind: "name-order-betrayal", termsLeft: 3 }),
            },
            { id: "co-first", label: '"Co-first authors"', detail: "The diplomatic dodge", apply: (st) => apply(st, { reputation: 2, log: "Co-first authors. Everyone stays okay." }) },
          ]
        : [
            {
              id: "swallow",
              label: "Swallow it",
              detail: "−Morale, but he backs your next grant → +funding later",
              apply: (st) => setFlag(apply(st, { morale: -3, log: "Pemberton's name goes first. You swallow it; he owes you one." }), "grantBacking", 1),
            },
            {
              id: "confront",
              label: "Confront him",
              detail: "+Morale, lose his mentorship bonus",
              apply: (st) => setFlag(apply(st, { morale: 4, log: "You confronted Pemberton. +Morale, but the mentorship dries up." }), "mentorshipBonus", 0),
            },
            {
              id: "tell-collaborator",
              label: "Tell the collaborator whose idea it was",
              detail: "fuse: authorship dispute later",
              apply: (st) => lightFuse(pushLog(st, "You told the collaborator. This will come back around."), { kind: "authorship-dispute", termsLeft: 2 }),
            },
          ],
  },

  // ---------------------------------------------------------------- #5
  {
    id: "ellie-offer",
    title: "Ellie's Offer",
    body: "Your partner Ellie just got the offer of their career. In Edinburgh. You're in London.",
    rarity: "rare",
    weight: 2,
    oncePerRun: true,
    trigger: (s) => s.hasPartner && s.term >= 2,
    choices: () => [
      {
        id: "relocate",
        label: "Relocate with them",
        detail: "Lose a stage of lab progress, restart with +Morale",
        apply: (st) => apply({ ...st, knowledge: 0 }, { reputation: -2, morale: 20, log: "You relocated to Edinburgh. Lab progress reset; Morale restored." }),
      },
      {
        id: "long-distance",
        label: "Long-distance",
        detail: "Keep the lab; −Morale every term for 4 terms; +Workload",
        apply: (st) => setFlag(pushLog(st, "Long-distance it is. The commuting begins."), "longDistanceTerms", 4),
      },
      {
        id: "they-decline",
        label: "They turn it down for you",
        detail: "Keep everything · fuse: resentment in 3 terms unless you invest",
        apply: (st) => lightFuse(pushLog(st, "Ellie turned it down for you. The clock is now ticking."), { kind: "ellie-resentment", termsLeft: 3 }),
      },
    ],
  },

  // ---------------------------------------------------------------- #6
  {
    id: "aisha",
    title: "Aisha, the Brilliant Undergrad",
    body: "The summer student you'd been ignoring just cracked the thing you've been stuck on for a year.",
    rarity: "rare",
    weight: 2,
    oncePerRun: true,
    trigger: (s) => s.term >= 2,
    choices: () => [
      {
        id: "mentor-properly",
        label: "Mentor her properly (½ day/term)",
        detail: "She becomes a high-output, cheap team member",
        apply: (st) => apply(addStudent(st, "Aisha Khan", 60), { knowledge: 6, log: "You mentored Aisha. She's brilliant — and now she's yours." }),
      },
      {
        id: "too-busy",
        label: "Too busy",
        detail: "She joins Holloway's lab · you'll meet her thriving in 4 terms",
        apply: (st) => lightFuse(pushLog(st, "You were too busy. Aisha joined Holloway's lab."), { kind: "aisha-rival", termsLeft: 4 }),
      },
    ],
  },

  // ---------------------------------------------------------------- #7
  {
    id: "conference",
    title: "The Conference",
    body: "The big meeting in your field is in Lisbon. The talks start at 8am. The city does not.",
    rarity: "common",
    weight: 2,
    trigger: (s) => s.meters.reputation >= 1 && s.meters.time >= 1,
    choices: (s) => {
      const tier = s.meters.reputation >= 8 ? 3 : s.meters.reputation >= 4 ? 2 : 1;
      const slot = ["poster", "short talk", "full talk"][tier - 1];
      const canAfford = s.meters.money >= 1750;
      const list: EventChoice[] = [];
      if (canAfford) {
        list.push(
          { id: "work-talks", label: `Work the talks (${slot})`, detail: `Lab funds it (£1,750) → +${tier} Rep, a lead`, apply: (st) => apply(st, { money: -1750, time: -1, reputation: tier, knowledge: 2, log: `Worked the talks (${slot}). +${tier} Rep.` }) },
          { id: "network", label: '"Network" on the waterfront', detail: "Lab funds it (£1,750) → +Morale, no Rep", apply: (st) => apply(st, { money: -1750, time: -1, morale: 8, log: "You 'networked' on the waterfront. We know why people go." }) },
          { id: "bring-priya", label: "Bring Priya", detail: "Lab funds it (£1,750) → +Morale and her loyalty rises", apply: (st) => apply(adjustStudent(st, "Priya Nair", 10), { money: -1750, time: -1, morale: 5, loyalty: 4, log: "You brought a student to Lisbon. The good-boss move." }) },
        );
      }
      list.push({ id: "skip", label: "Skip — watch the livestream", detail: "Save the money, mild FOMO", apply: (st) => apply(st, { morale: -1, log: "Skipped Lisbon. Watched the keynote on a laggy stream." }) });
      return list;
    },
  },

  // ---------------------------------------------------------------- #8
  {
    id: "grant-declined",
    title: '"We Regret to Inform You"',
    body: "Grant declined. Three reviewers, mutually contradictory, one clearly stopped at the abstract.",
    rarity: "common",
    weight: 2,
    trigger: (s) => s.term >= 2,
    choices: () => [
      { id: "resubmit", label: "Resubmit now (4 weeks, +Workload)", detail: "Slightly better odds next round", available: (st) => st.meters.time >= 4, apply: (st) => setFlag(apply(st, { time: -4, workload: 10, log: "Resubmitting. Better odds next round." }), "grantBetterOdds", 1) },
      { id: "pivot", label: "Pivot the project", detail: "Lose current Knowledge, open a fresh topic", apply: (st) => apply({ ...st, knowledge: 0 }, { morale: 3, log: "Pivoted the whole project. Fresh start." }) },
      { id: "swear-off", label: "Swear off this funder", detail: "+Morale; that funder is closed for the run", apply: (st) => setFlag(apply(st, { morale: 5, log: "Swore off that funder for good. +Morale." }), "funderClosed", 1) },
    ],
  },

  // ---------------------------------------------------------------- #9
  {
    id: "p-hack",
    title: "The p-Hack",
    body: "p = 0.06. So close. A nudge and it's a Nature paper.",
    rarity: "rare",
    weight: 2,
    trigger: (s) => s.knowledge >= 10,
    choices: () => [
      { id: "honest", label: "Report it honestly", detail: "Publish one tier lower. Clean.", apply: (st) => apply(st, { knowledge: -10, publications: 1, reputation: 1, morale: 2, log: "Reported it honestly. One tier lower, clean conscience." }) },
      {
        id: "massage",
        label: "Massage it",
        detail: "Top-tier paper, big Rep spike · fuse: retraction risk rises each term",
        apply: (st) => lightFuse(apply(st, { knowledge: -10, publications: 1, reputation: 5, log: "You massaged the data. Nature paper, +5 Rep. The spiciest button in the game." }), { kind: "phack-retraction", termsLeft: 99, prob: 0.1, risePerTerm: 0.1 }),
      },
    ],
  },

  // ---------------------------------------------------------------- #10
  {
    id: "imposter",
    title: "Imposter Syndrome",
    body: "You landed the big one. You're now certain they'll find out you're a fraud.",
    rarity: "common",
    weight: 2,
    trigger: (s) => s.meters.reputation >= 6,
    choices: (s) => {
      const list: EventChoice[] = [
        { id: "therapy", label: "See someone (£80/session, ½ day)", detail: "Restore Morale + a buffer", available: (st) => st.meters.money >= 80, apply: (st) => setFlag(apply(st, { money: -80, time: -0.5, morale: 10, log: "You saw someone. Morale restored, and a buffer for next time." }), "moraleBuffer", 1) },
        { id: "bury", label: "Bury it in work", detail: "+Knowledge now · fuse: it resurfaces worse", apply: (st) => lightFuse(apply(st, { knowledge: 4, log: "Buried it in work. +Knowledge now…" }), { kind: "imposter-relapse", termsLeft: 2 }) },
      ];
      if (maxLoyalty(s) >= EVENTS.loyaltyRescueThreshold || s.meters.morale >= 60) {
        list.push({ id: "sarah", label: "Talk to Sarah Whitfield", detail: "Free Morale restore. Relationships pay off.", apply: (st) => apply(st, { morale: 8, log: "You talked to Sarah Whitfield. Free Morale restore." }) });
      }
      return list;
    },
  },

  // ---------------------------------------------------------------- #11
  {
    id: "marsh-ghosted",
    title: "Dr. Marsh Has Ghosted You",
    body: "Stephen Marsh promised the key dataset eight months ago. His out-of-office is from last year.",
    rarity: "common",
    weight: 2,
    trigger: (s) => s.knowledge >= 4,
    choices: () => [
      { id: "wait", label: "Keep waiting (lose 2 weeks)", detail: "Then 50/50 he delivers", available: (st) => st.meters.time >= 2, apply: (st) => (rollD6() >= 4 ? apply(st, { time: -2, knowledge: 6, log: "Marsh finally delivered. +6 Knowledge." }) : apply(st, { time: -2, morale: -3, log: "Still nothing from Marsh. Two weeks gone." })) },
      { id: "redo", label: "Redo it yourself (4 weeks, £4k)", detail: "Guaranteed, exhausting, +Workload", available: (st) => st.meters.time >= 4 && st.meters.money >= 4000, apply: (st) => apply(st, { time: -4, money: -4000, knowledge: 6, workload: 12, log: "Redid it yourself. Guaranteed, exhausting." }) },
      { id: "escalate", label: "Escalate to his head of department", detail: "Fast, but you've made an enemy · fuse risk", apply: (st) => lightFuse(apply(st, { knowledge: 6, log: "Escalated to his HoD. You got the data — and an enemy." }), { kind: "marsh-enemy", termsLeft: 2 }) },
    ],
  },

  // ---------------------------------------------------------------- #12 (legendary)
  {
    id: "sir-geoffrey",
    title: "Sir Geoffrey's Gift",
    body: "A wealthy alumnus loves your field and will fund you generously. He has one small condition about what you study.",
    rarity: "legendary",
    weight: 2,
    oncePerRun: true,
    trigger: (s) => s.term >= 2,
    choices: (s) => {
      // Real sum is £300k; scaled to ~£40k for the quick-mode economy.
      const list: EventChoice[] = [
        { id: "take", label: "Take it (+£40k research funding)", detail: "Locked to safe, low-Rep work for 3 terms", apply: (st) => setFlag(apply(st, { money: 40000, log: "Took Sir Geoffrey's £40k. Now locked to safe, citable, dull work." }), "donorLock", 3) },
        { id: "decline", label: "Decline on principle", detail: "+Morale, integrity intact and useless", apply: (st) => apply(st, { morale: 8, log: "Declined the gift on principle. Integrity intact and useless." }) },
      ];
      if (s.meters.reputation >= 8) {
        list.push({ id: "negotiate", label: "Negotiate", detail: "The money AND your freedom. Reputation has privileges.", apply: (st) => apply(st, { money: 40000, log: "You negotiated. £40k and no strings. Reputation has privileges." }) });
      }
      return list;
    },
  },

  // ---------------------------------------------------------------- #13 (comic relief)
  {
    id: "haunted-centrifuge",
    title: "The Haunted Centrifuge",
    body: "Sample 7 is always warm. Always. There is a small shrine now.",
    rarity: "common",
    weight: 1,
    trigger: (s) => s.knowledge >= 2,
    choices: () => [
      { id: "buy-new", label: "Buy a new one (£3k)", detail: "Solved. No fun.", available: (st) => st.meters.money >= 3000, apply: (st) => apply(st, { money: -3000, log: "Bought a new centrifuge. Solved. No fun." }) },
      { id: "ritual", label: "Perform the ritual (free)", detail: "+Morale, 50/50 running gag", apply: (st) => apply(st, { morale: 4, log: rollD6() >= 4 ? "Performed the ritual. Sample 7 ran cold. Coincidence?" : "Performed the ritual. Sample 7 is still warm. The shrine grows." }) },
      { id: "ignore", label: "Ignore it", detail: "Next experiment may fail mysteriously", apply: (st) => setFlag(pushLog(st, "Ignored the haunted centrifuge. Tempting fate."), "hauntedCentrifuge", 1) },
    ],
  },

  // ---------------------------------------------------------------- #14
  {
    id: "tenure-whisper",
    title: "The Tenure Whisper",
    body: 'Margaret Critchley pulls you aside. The committee would like "more service, less self-indulgent research."',
    rarity: "common",
    weight: 2,
    trigger: (s) => s.term >= 3,
    choices: () => [
      { id: "play", label: "Play the game (service)", detail: "+2 weeks, +Workload, gain committee standing", available: (st) => st.meters.time >= 2, apply: (st) => apply(st, { time: -2, workload: 8, reputation: 1, log: "Did the service. The committee notices. +1 standing." }) },
      { id: "out-publish", label: "Out-publish the politics", detail: "Ignore it, gamble raw Rep carries you", apply: (st) => apply(st, { morale: 3, log: "Ignored the politics. Betting the science speaks for itself." }) },
      { id: "schmooze", label: "Schmooze", detail: "Spend Morale charming the right people; standing without the time cost", apply: (st) => apply(st, { morale: -5, reputation: 1, log: "Schmoozed the committee. Standing up, Morale down." }) },
    ],
  },

  // ---------------------------------------------------------------- #15 (engine-fired)
  {
    id: "burnout",
    title: "Burnout",
    body: "You did not choose this; it chose you. Morale at zero, or Workload maxed. The system biting back.",
    rarity: "common",
    weight: 0,
    trigger: () => false, // never drawn; fired by the engine at Morale 0 / Workload 100
    choices: (s) => {
      const list: EventChoice[] = [
        { id: "medical-leave", label: "Medical leave", detail: "Lose a full term, Morale fully restores", apply: (st) => ({ ...apply(st, { time: -st.meters.time, workload: -100, log: "Took medical leave. A full term gone, but you're whole again." }), meters: { ...st.meters, time: 0, morale: 80 } }) },
        { id: "push-through", label: "Push through", detail: "Half Time next term, Morale critical · fuse: Leaving Academia", apply: (st) => lightFuse(setFlag({ ...st, meters: { ...st.meters, morale: 12 }, workload: 80 }, "halfTime", 1), { kind: "leaving-academia", termsLeft: 2 }) },
      ];
      if (maxLoyalty(s) >= EVENTS.loyaltyRescueThreshold) {
        list.push({ id: "lab-carries-you", label: "Chloe and Ben keep the lab running while you recover", detail: "The payoff for choosing the team over the output", apply: (st) => ({ ...apply(adjustStudent(st, st.students[0]?.name ?? "", -5), { workload: -60, log: "Your loyal lab carried you. This is what kindness buys." }), meters: { ...st.meters, morale: 60 } }) });
      }
      return list;
    },
  },

  // ---------------------------------------------------------------- #16 (engine-fired)
  {
    id: "caffeine-crash",
    title: "Caffeine Crash",
    body: "Sixth espresso. Your hands are doing a thing. You read the same sentence four times.",
    rarity: "common",
    weight: 0,
    trigger: () => false, // fired by the engine after heavy Coffee use
    choices: () => [
      { id: "sleep", label: "Sleep (lose a day)", detail: "Workload drops, Morale steadies", apply: (st) => apply(st, { workload: -15, morale: 3, log: "You slept. Workload down, Morale steady. The loan, partly repaid." }) },
      { id: "push-on", label: "Push on", detail: "One productive day now, a bigger Morale hit later", apply: (st) => apply(st, { knowledge: 3, morale: -8, workload: 5, log: "Pushed on. One more day now — the loan compounds." }) },
    ],
  },
];

export const DECK_BY_ID: Record<string, GameEvent> = Object.fromEntries(
  DECK.map((e) => [e.id, e]),
);
