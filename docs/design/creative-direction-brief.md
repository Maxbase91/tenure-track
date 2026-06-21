# Creative Direction Brief — UI Overhaul

**Status:** BINDING. This document is the authority for the secondary-screen UI overhaul.
The Art Director and UI Programmer implement against it. Deviations require Creative Director sign-off.

**Author:** Creative Director
**Date:** 2026-06-21
**Scope:** Home, SetupFlow, MatchLobby, MatchApp (pass-the-phone + standings), PoolBrowser, Meter.
**Out of scope:** GameBoard and its event-document card — see [Section 6: What Must NOT Change].

---

## 0. The Core Problem (Context)

The game has a split personality. The GameBoard is a polished **scientific instrument panel** —
dark `--ink` cards sitting on warm `--paper`, data set in mono, headings in Fraunces, event cards
that drop like physical lab memos. It has a point of view.

Every other screen is a **wireframe**. `#ccc` borders, `#666` grey, white `#fff` buttons, raw
`<select>` dropdowns, inline styles literally commented "Kept ugly (M3)". These screens were never
designed — they were stubbed. The fonts load globally and the parchment background is global, but
the secondary screens use neither the type system nor the color language.

The player's journey is currently: **brandless lobby → brandless setup → polished game → brandless
match screens.** The game introduces itself with its worst foot forward. By the time the player
reaches the one screen with identity, the tone is already set as "unfinished prototype."

**One technical fact that shapes everything below:** the design tokens (`--ink`, `--paper`, `--hl`,
etc.) are currently declared *inside* `.board` in `GameBoard.module.css`. They are not global. The
first implementation act is to **promote these tokens to `:root` in `globals.css`** so every screen
can speak the same language. Nothing else in this brief is buildable until that happens.

---

## 1. Voice & Tone

**The register: a Nature paper about your own burnout.** Dry, precise, knowing. The UI is written
by someone who has been in the institution long enough to find the absurdity funny rather than
enraging. It never winks too hard. It never uses an exclamation mark where a period would land
drier.

Concrete rules for all secondary-screen copy:

- **Deadpan over jokey.** "Choose your game" is fine. "Pick your poison! 😅" is banned. The humor
  lives in *accurate* framing of academic absurdity, not in UI chrome being zany. The match tagline
  "highest score wins" is funnier said flatly than dressed up.
- **Bureaucratic precision as a comedy device.** Lean into the language of forms, drafts, and
  memos. "New game — 2 / 5" already does this; keep that energy. A setup step is an intake form. The
  pool browser is a departmental archive. The match handoff is a chain-of-custody.
- **The kicker voice.** The mono-set, uppercase, letter-spaced kicker on the GameBoard event card
  (`event · uncommon`) is the house label voice. Secondary screens get the same device: a small
  mono kicker above section headings ("INTAKE", "THE DRAFT", "STANDINGS", "ARCHIVE"). This is the
  single strongest cohesion lever available — it instantly reads as the same game.
- **Two-tier emotional truth.** The aesthetic brief is "cynical play wins sprints; humane play wins
  careers." The *tone* must hold both: never so cynical it's nihilistic, never so warm it's
  sentimental. The UI is the dry narrator who has watched both kinds of scientist and is rooting,
  quietly, for the humane one.

**What the voice is NOT:** not corporate-cheerful, not gamer-hype ("LET'S GO!"), not meme-ironic,
not grimdark. If a line would feel at home in a LinkedIn post or a Discord raid callout, cut it.

---

## 2. Visual Hierarchy Mandate

**The mandate: every screen must read as the same instrument that the GameBoard is.** The GameBoard's
identity is not "a dark panel" — it is **dark `--ink` cards floating on warm `--paper`, with mono
data, Fraunces drama, and yellow `--hl` reserved as the single accent of consequence.** Secondary
screens adopt that exact grammar.

### 2.1 The surface model

The body background is already the correct warm parchment radial gradient. Do not change it. The job
is to stop floating naked white buttons on it and instead build **dark `--ink2` cards** the way the
GameBoard does.

Codified surface rules:

- **Content lives in dark cards, not on bare parchment.** Buttons, list rows, player slots, and
  setup options become `--ink2` (`#243a44`) cards with `1px solid var(--line)` borders and
  `border-radius: 12–14px` — matching `.meter` and `.act`. White `#fff` is **banned** as a surface
  color on secondary screens.
- **Parchment is the table, not the paper.** `--paper` (`#f1ead9`) is reserved for two things only:
  (a) the body background, and (b) **document surfaces** — the event card already uses it, and the
  setup "draft offer" cards may use it (see Section 3). Everywhere else, parchment is the negative
  space the dark cards sit on, never a button fill.
- **The accent yellow `--hl` is the color of consequence.** On the GameBoard it marks the role
  label, action icons, the hover border, and the primary "End term" button. Secondary screens
  inherit this discipline: `--hl` is the **primary CTA fill** (Start, Start match, ready), the
  **selected-state border**, and the **hover border**. It is never decoration. If everything is
  highlighted, nothing is.
- **Greys come from the token muted scale, never from `#666`/`#ccc`/`#888`.** Replace every ad-hoc
  grey with `--muted` (`#9fb2b9`) for secondary text on dark, and `--line` for borders. `#ccc` and
  `#666` are banned strings.

### 2.2 Hierarchy within a screen

Each secondary screen follows the GameBoard's three-tier rhythm:

1. **Title** — Fraunces, the screen's name ("Tenure Track", "Match", "Archive").
2. **Mono kicker / status line** — IBM Plex Mono, uppercase, the bureaucratic context line
   (step counter, scenario name, "STANDINGS").
3. **Dark cards** — the interactive content, in the `--ink2` card grammar.

The selected/active state is always the same gesture: **border goes `--hl` yellow, background
deepens to `--ink3`** — identical to `.act:hover`. This one consistent gesture makes every screen
feel mechanically related to the board.

---

## 3. Screen-by-Screen Direction

### Home (`Home.tsx`) — The cold open
This is the game's handshake; it must carry the most identity per pixel. It should feel like the
**title plate of a lab instrument** powering on. Fraunces "Tenure Track" as a real wordmark (large,
confident), a single mono tagline beneath it ("A SATIRICAL ACADEMIC-LIFE STRATEGY GAME" — uppercase,
letter-spaced, `--muted`). The two mode buttons become large dark `--ink2` cards with a Fraunces
label and a mono sub-line, hover lifting the border to `--hl` exactly like board actions. **Key
moment:** the first thing the player ever sees should be Fraunces + a mono kicker on parchment — the
exact trinity that defines the board. **Do NOT:** center everything into a generic splash, add a hero
illustration, or use `#fff` buttons. Restraint is the brand here.

### SetupFlow (`SetupFlow.tsx`) — The intake form
This should feel like **filling out institutional paperwork that quietly judges you.** Keep the
step-counter mono line ("INTAKE — 2 / 5") — it is already the right instinct, just unstyled. Each
choice (scenario, partner, field) is a dark `--ink2` selectable card; selected state is the `--hl`
border + `--ink3` fill gesture, not the current `2px solid #333` / `#f0f0f0`. **The one place to
spend real craft: the PhD offer draft step.** This is a genuine decision that frames the whole run —
treat the offer cards as **document surfaces** (`--paper` background, subtle rotation, the
perforated-edge or at least the parchment-card feel) so picking your PhD offer literally feels like
choosing between physical letters on a desk. Inputs (`name`, partner name) get dark-field styling
with `--line` borders; "Randomise" is a quiet secondary button, never competing with the primary
Next/Start CTA. **Do NOT:** keep raw `<select>` for partner field — replace with the same card-list
pattern used for the main field step, or a styled select at minimum. **Do NOT** let "Kept ugly (M3)"
survive this pass; that comment is the work order being closed.

### MatchLobby (`MatchLobby.tsx`) — The roster
This should feel like **assembling a competitive heat — a draft board.** Scenario tiles and the
human/AI toggles use the same selected-state gesture. The biggest offender here is the raw `<select>`
for AI profile and field; AI profiles especially deserve to read as *characters* ("The Careerist",
"The Plodder") not dropdown rows — give each AI a one-line mono descriptor so the player feels the
satire of choosing their rivals. Player slots become dark cards with clear visual separation between
"you" (human) and the AIs. The dice/randomise affordance stays small and quiet. **Key moment:** the
"Start match" CTA is the `--hl` yellow button, the only yellow on screen. **Do NOT:** leave the
emoji 🎲 as the only styling effort in a slot; **do NOT** let the field `<select>` sit naked next to
a styled tile row — visual consistency within the screen matters as much as across screens.

### MatchApp — pass-the-phone handoff (`MatchApp.tsx`) — The chain of custody
Currently this is the weakest screen relative to its dramatic importance: it is *just centered text*.
The handoff is a **ritual moment** — the phone physically changes hands, the prior player's board
must be hidden, and the next player must feel summoned. Make it feel like a **sealed envelope being
passed.** Full-bleed dark `--ink` surface (this is the one screen that earns going fully dark — it is
a privacy curtain), large Fraunces "Pass the phone", the recipient's name in `--hl` yellow as the
hero element, and the "I'm [name] — ready" button as the dominant yellow CTA. The scoreboard sits
below as a quiet mono standings table. **Key moment:** the recipient's name in yellow Fraunces is the
emotional anchor — it makes the handoff personal. **Do NOT:** show any live game state above the
fold (it would leak the previous player's position — the dark curtain is functional, not just
aesthetic); **do NOT** make it cheerful.

The **final standings** ("Match over") screen is the climax: Fraunces "Match over", the winner in
`--hl`, and a mono-set ranked table styled like the board's "Recent" log. The 🏆/🎓/💀 emoji should be
replaced or paired with the game's own monoline-icon language (the board already established crisp
monoline SVGs — standings should match that vocabulary, not fall back to system emoji).

### PoolBrowser (`PoolBrowser.tsx`) — The departmental archive
This should feel like **browsing a shared lab notebook / the department's filing cabinet of careers.**
Each run is an index card. Dark `--ink2` row-cards with clear three-tier hierarchy: Fraunces or bold
run title, a mono metadata line (the `mode · scenario · stage · term · score` line is *perfect* for
mono and should be set that way), and a quiet `--muted` provenance line ("last played by … · v… ·
date"). The communal-pool framing is a quiet emotional beat — these are other people's careers you
can pick up — so the empty state ("The pool is empty…") should be written with the dry house voice,
not a flat system message. **Key moment:** the metadata line in mono makes each run read like a real
record. **Do NOT:** use `#ccc` row borders; **do NOT** let loading/error states fall back to
unstyled `<p>` — they get the mono treatment too.

### Meter (`Meter.tsx`) — Retire or align
The standalone `Meter.tsx` ("keep it ugly (M1)") is a legacy plain-row component. The GameBoard
already replaced its function with the instrument `MeterCard`. **Direction:** either retire
`Meter.tsx` if nothing renders it, or — if it still backs the "under the hood" panel — restyle it to
the `--muted`/`--line` token language so no `#ddd`/`#888` survives. It must never be the thing a
player sees with `#ddd` borders.

---

## 4. Typography Rules

The GameBoard already uses the three faces correctly. These rules **codify** that usage and bind it
to every screen. The faces are loaded globally; the discipline is in *which face means what*.

| Face | Means | Use for | Never use for |
|------|-------|---------|---------------|
| **Fraunces** (serif) | Drama, identity, the human voice | Screen titles, wordmark, event/document titles, the winner's name, the recipient's name on handoff | Body copy, data, buttons, metadata |
| **Hanken Grotesk** (sans) | The interface speaking plainly | Button labels, choice labels, option-card labels, body sentences, CTAs | Numeric data, kickers, costs |
| **IBM Plex Mono** | Instrument readout, bureaucratic record | Kickers, step counters, costs, all numeric data, metadata lines, standings tables, status lines, the "Recent" log | Headings, primary CTA labels |

Operating principles:

- **Mono is the sound of the institution measuring you.** Anything that is a number, a record, a
  status, or a label-of-a-category goes mono. When in doubt and it's data, it's mono.
- **Fraunces is rationed.** One, occasionally two, Fraunces elements per screen — the title and at
  most one hero word (a name, an outcome). Over-using Fraunces cheapens it; it is the dramatic voice
  and drama doesn't repeat.
- **Hanken is the default for anything the player clicks or reads as a sentence.**
- **The kicker pattern is mandatory on every secondary screen:** mono, ~10px, uppercase,
  `letter-spacing: 0.1–0.12em`, `--muted`. It is the cheapest, strongest cohesion signal we have.
  Copy the exact `.kicker` spec from GameBoard.module.css.

---

## 5. Interaction Personality

The board's personality is **quietly mechanical** — precise, low-latency, no bounce. Secondary
screens match this exactly. No new motion vocabulary is invented; we reuse what the board established.

- **Hover** is a `0.12s` transition that lifts the **border to `--hl`** and deepens the fill to
  `--ink3` — copy `.act:hover` verbatim. The document-style choices use the alternative board
  gesture (border darkens, `translateX(2px)`) — that subtle slide is reserved for document/paper
  surfaces (offer cards, event choices), keeping a meaningful distinction between "instrument
  control" and "paper you're signing."
- **The primary CTA** on every secondary screen is the board's `.endTurn` button: full-width-ish,
  `--hl` yellow fill, `--ink` text, Hanken `800`, `border-radius: 14px`, hover `filter:
  brightness(1.05)`. There is exactly **one** yellow CTA per screen. This solves the brief's open
  question ("how do we use `--hl` outside dark surfaces?") — the yellow button is itself the bright
  surface; it sits on parchment as the single point of consequence, the same way "End term" sits as
  the single advance.
- **Tap** uses framer-motion `whileTap={{ scale: 0.97 }}`, respecting `useReducedMotion` — identical
  to the board. Every interactive element on secondary screens should adopt this.
- **Selected state** is the universal gesture from Section 2.2: `--hl` border + `--ink3` fill. Same
  on scenario tiles, field cards, partner toggle, human/AI toggle.
- **Transitions between screens** stay calm. If any screen-to-screen motion is added, it is a quick
  cross-fade or the board's `drop` easing — never slides, never bounces, never page-flip theatrics.
  The institution does not bounce.
- **Accessibility is non-negotiable** (per `ui-code.md`): all motion respects
  `prefers-reduced-motion`; `:focus-visible` already has a global outline — keep it; color is never
  the *only* signal for selected state (pair the yellow border with the `--ink3` fill so it survives
  colorblind modes).

---

## 6. What Must NOT Change (Sacred)

The GameBoard is the proof that this game has a soul. It is **frozen**. The overhaul brings the rest
of the game *up to* it; it does not touch it.

Specifically protected — do not modify without Creative Director sign-off:

1. **`GameBoard.tsx` and `GameBoard.module.css`** in their entirety — the instrument-panel layout,
   the 4-column meter grid, the gauge bars, the count-up animation.
2. **The event document card** — parchment surface, `rotate(-0.5deg)`, the `drop` keyframe, the
   perforated `::before` top edge, Fraunces title, mono body, the paper-choice buttons. This is the
   single best-realized expression of the "event cards drop like lab memos" pillar. It is the
   template the rest of the game imitates, never the thing that changes.
3. **The token *values*** — `--ink #1b2a32`, `--paper #f1ead9`, `--hl #f4d43c`, `--reagent #54b089`,
   `--alarm #d85850`, and the muted/line scale. We are *promoting these to `:root`*, not editing
   them. The palette is correct.
4. **The three-font system and its meaning** — Fraunces/Hanken/Plex Mono and the roles defined in
   Section 4. The board's usage is the reference implementation.
5. **The body parchment background** in `globals.css` — the warm radial gradient is the table the
   whole game sits on. Untouched.
6. **The monoline-SVG icon language** — crisp `currentColor` strokes at `stroke-width 1.8`. New icons
   on secondary screens (replacing emoji) must match this exactly.

The *only* sanctioned change adjacent to the board is **lifting the design tokens out of `.board`
into `:root`** so the rest of the game can reach them. The board keeps working identically because it
still reads the same variable names — they just resolve from a higher scope.

---

## First Implementation Targets

The five highest-impact changes, in order. Each one moves the most cohesion per unit of effort.

1. **Promote the design tokens to `:root` in `globals.css`.** Nothing else is buildable until
   `--ink`, `--paper`, `--hl`, `--reagent`, `--alarm`, `--muted`, `--line` exist globally. This is
   the keystone — one small edit that unlocks the entire overhaul. (Verify the board still renders
   identically afterward.)

2. **Redesign Home into the cold-open title plate.** It is the first impression and currently the
   most brandless screen. Fraunces wordmark + mono tagline + two dark `--ink2` mode cards with the
   `--hl` hover gesture. Highest emotional ROI: it sets the tone before the player reaches the board.

3. **Kill every banned color string across all secondary screens.** Global find-and-replace of
   `#ccc`, `#666`, `#888`, `#fff`, `#ddd`, `#eee`, `#f0f0f0` with the token equivalents (`--line`,
   `--muted`, `--ink2`, `--ink3`). This single sweep makes everything stop looking like a wireframe,
   even before bespoke layout work.

4. **Style the pass-the-phone handoff as the dark-curtain ritual.** It is the most dramatically
   important screen rendering as plain centered text. Full dark surface, recipient's name in `--hl`
   Fraunces, yellow ready-CTA. Big perceived-quality jump for a self-contained screen.

5. **Apply the mono-kicker + dark-card grammar to SetupFlow, including paper-treatment offer cards.**
   Setup is the longest pre-game screen the player sees; converting its inline-styled cards to the
   token card grammar — and elevating the PhD offer step to document surfaces — closes the
   "Kept ugly (M3)" debt and makes the on-ramp feel like the game it leads into.
