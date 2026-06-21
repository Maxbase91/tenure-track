# Tenure Track — Master Build Spec (v4)

Single source of truth. Supersedes the v3 spec and the opening/partner addendum. Companion file **tenure-track-v2-systems-events.md** holds the full text and voice of the 16 core career/life events; this doc references them rather than repeating them.

A satirical academic-life strategy game. Phone-first PWA. Solo vs AI + hotseat. Two modes, a communal Neon save pool, an event-driven core.

---

## 1. Concept & tone
Run an academic career under a ticking tenure clock. Satirical but accurate — a working scientist should laugh in recognition. The fun lives in events: random life and career dilemmas that surprise every run, where the right choice depends on the engine you've built. Cynical play wins sprints; humane play (Morale, student loyalty, your relationship) wins careers.

---

## 2. Modes
- **Career mode** — full arc, PhD → tenure decision (~9 terms). All resources visible. Events chain. Legacy scoring.
- **Quick mode** — four entry points, shorter (3–4 terms), **only four meters visible** (Time, Money, Morale, Reputation); Workload and Coffee run underneath. ~10–15 min. Entry points: The PhD Crunch · The Postdoc Gamble · New PI, Empty Lab · The Tenure Sprint.

---

## 3. Setup flow

**Career mode, in order:**
1. **"Play with a partner?" Yes / No.** (Drives the whole partner thread — §13.) If yes: enter/Randomise partner name + their field. If no: life-events route through the solo variant.
2. **Pick a field** (Molecular Biology, Neuroscience, Physics, Chemistry, Computer Science, Ecology) — flavours events/topics + minor starting tilt.
3. **The PhD offer draft** (§12) — choose one of 3–5 procedurally generated offers. This frames the run.
4. Scientist name (+Randomise). Auto-title the run for the pool.

**Quick mode:** entry-point tile (sets stage + win condition) · partner Yes/No · scientist name · field (optional). No PhD draft (you start mid-career).

Setup is one to three screens, every step skippable with Randomise. The communal pool rewards spinning up fast.

---

## 4. Resources

| Resource | Unit | Role | Quick mode |
|---|---|---|---|
| Time | weeks (small actions in days/hours) | per-term budget (~15 wks/term) | visible |
| Personal money | £ | stipend/salary; low → Morale pain | merged "Money" |
| Research funding | £ | grants; reagents/kit/travel | merged "Money" |
| Reputation | h-index-ish | unlocks grants, journals, talks | visible |
| Knowledge | results | → papers; scoopable | underneath |
| Morale | 0–100 | 0 → Burnout | visible |
| Workload | 0–100 | >70 bleeds Morale; 100 → Burnout | underneath |
| Coffee | cups | buy Time this term, +Workload | underneath |
| Student loyalty | per student | karma payoffs | underneath |
| Relationship | 0–100 hidden | partner thread; buffers/drains Morale | underneath |

Realistic UK money: PhD stipend ~£19k/yr · postdoc ~£40k · lecturer ~£50k · −80 freezer ~£9k · reagent campaign £3–10k · pump-priming grant £25k · project grant £600k · ERC/Wellcome £2M · conference ~£1,750 · open-access APC £3k (Nature-tier £9,500) · predatory journal £600.

Realistic time: experiment campaign 3 wks · paper 3 wks · grant 4–6 wks · conference 1 wk + prep · mentoring ½ day · teaching block 2 wks.

---

## 5. Turn loop (one term)
Allocate weeks across: run experiments (3 wks + £) · write paper (3 wks; 2d6 on mid/top tiers) · write grant (4–6 wks) · mentor student (½ day) · conference (§7) · teaching/admin (2 wks, often forced, +Workload) · networking (1 wk, cap 1/term) · coffee (+Time, +Workload). End of term: salaries deduct, Workload→Morale check, tenure clock advances, draw events.

## 6. Burnout loop
Actions add Workload; teaching/admin/coffee add more. Workload >70 → lose Morale/term. Coffee buys Time at Workload cost (overuse → Caffeine Crash event). Morale recovers from holidays, good events, a kind lab, a healthy relationship, an under-loaded term. **Burnout at Morale 0 or Workload 100;** a loyal lab can carry you through it.

## 7. Conferences (tier × who-pays)
Tier (Rep-gated): Poster (none) · Short talk (Rep ≥4) · Full talk (Rep ≥8) · Invited speaker (Rep ≥12, +recruiting boost). Who pays: travel grant (compete, free if won) · lab funds it (research budget) · own pocket (personal money + −Morale).

## 8. Role-aware events + karma
Events read career stage: junior = acted upon; PI = makes the call (take credit or share; protect a student from teaching or offload it; fund their trip or not). Each PI choice shifts student **loyalty** — loyal students cover Burnout, save samples, resist poaching; exploited students leave and underperform. Evil = faster output; kind = crisis resilience.

## 9. Win conditions
- **Career:** ends at tenure decision (~term 9). Score = `2·Reputation + Funding/scaled + 3·Legacy`. Instant wins: Nobel-tier breakthrough, or mega-grant + flagship combo. Mid-game tenure review (soft elimination).
- **Quick:** scenario-specific (submit thesis paper / land job offer / pass probation / get tenure). Score = `2·Reputation + Money/scaled`.

## 10. Event system architecture
Ship ~40 events (the 16 in the companion file are the seed) drawn from a pool bigger than any run. **Conditional triggers** (fire on matching state) · **chaining** (a choice lights a fuse) · **rare/legendary** events. Hard rule: every event offers a choice, and the good choice depends on player state.

---

## 11. University pools (real names, by prestige)

Anchored to QS World University Rankings 2026. The offer generator maps an offer's Institutional-Rep stars to a tier and picks a university at random. Expand freely.

- **★★★★★ (global elite):** MIT, Stanford, Harvard, Caltech, Princeton, Yale, University of Cambridge, University of Oxford, Imperial College London, ETH Zurich, UC Berkeley, University of Chicago.
- **★★★★ (top research):** UCL, Columbia, Cornell, University of Pennsylvania, EPFL Lausanne, University of Edinburgh, King's College London, Johns Hopkins, LMU Munich, Heidelberg, KU Leuven, Karolinska Institute, TU Munich, University of Manchester, University of Michigan.
- **★★★ (strong):** University of Bristol, University of Glasgow, University of Warwick, TU Delft, University of Amsterdam, Trinity College Dublin, University of Copenhagen, Uppsala, Sorbonne, University of Vienna, Boston University, UC Davis, Wisconsin–Madison, University of Zurich, Lund.
- **★★ (solid regional):** University of Leeds, University of Nottingham, Newcastle, Cardiff, University of Sussex, University of Bologna, Ghent, University of Gothenburg, University of Cologne, Autonomous University of Barcelona, Arizona State, University of East Anglia.

---

## 12. Procedural PhD offer generator

Each new career game generates **3–5 offers**, varied every time. No fixed four.

**Per offer:** pick a *generation profile* (weighted), roll attributes within the profile's ranges, select a university from the tier matching rolled Institutional-Rep, pick a supervisor from name banks, set archetype flags, roll hot-topic, generate a "run feel" line.

**Generation profiles (bias the attribute vector):**

| Profile | Inst Rep | Mentoring | Team | Funding | Hot topic |
|---|---|---|---|---|---|
| Cathedral | 5 | 1–2 | large | flush | 5% |
| Rising Star | 3–4 | 5 | small | comfortable | 10% |
| Quiet Life | 2 | 3 | small | modest | 0% (+Morale baseline) |
| Long Shot | 3 | 3 | tiny | tight | 100% |
| Wildcard | random | random | random | random | 25% |

**Constraints on the set of offers:** span at least 3 distinct prestige tiers; no duplicate universities; always include at least one well-funded and one high-mentoring option so the choice is real.

**Supervisor name banks (mix UK/Europe/US, expand):**
First: Alan, Nadia, Brian, Marcus, Sarah, Margaret, James, Priya, Stephen, Elena, Klaus, Sofia, Henrik, Daniel, Anya, Raj, Claire, Lukas, Maria, David, Ingrid, Pierre, Mei, Tomas.
Surname: Pemberton, Rahman, Oakes, Reid, Whitfield, Critchley, Holloway, Nair, Marsh, Vogel, Bianchi, Lindqvist, Moreau, Schneider, Novak, Andersson, Müller, Rossi, Fischer, Laurent, Petrova, Okafor.

**Attribute meanings (what each drives):** Inst Rep = Reputation halo on papers + grant/journal gate-easer. Mentoring = per-term Knowledge bonus + grant sponsorship + fewer credit-taking events. Team = collaboration/passive Knowledge vs first-author competition + attention dilution. Funding = starting research funding + experiment ease. Hot topic = start on a frontier topic with an active scoop race (Dr. Holloway).

**Offer card shows:** real university name · supervisor name · 4 attribute bars · hot-topic flag · one-line generated "run feel" · attribute tooltips. Quick mode skips this.

---

## 13. Partner thread (full)

**Gated by the setup question "Play with a partner?"** If no, skip the thread; route work-life pressure through solo life events (aging parents, friendships, a neglected hobby).

If yes: a hidden **Relationship value (0–100, starts ~70)**. Healthy → buffers Morale, cushions Burnout, unlocks restorative holiday events. Neglected (never spend Time on them) → decays into resentment events, Morale penalties, eventually a breakup (one-off Morale crash, then +Time/term — the bleak "married to the lab"). **Milestones** (moving in, marriage, kids) deepen the buffer but raise the stakes of later life events. No new visible meter — the partner modifies Morale.

**Partner events (~6–10 across a career):**
- **P1 Date Night vs Deadline** — go (½ day, +relationship/Morale) / cancel (+grant, −relationship) / bring laptop (half each, −Morale).
- **P2 The 3am Life** — promise to change (must under-load next term, *fuse*) / "it's temporary" (−relationship) / they help at 3am (+relationship, small Knowledge save).
- **P3 A Good Year** *(healthy only)* — go off-grid (lose Time, big Morale + relationship) / decline (−relationship).
- **P4 The Question** *(milestone)* — commit (Time + money, deeper buffer, higher future stakes) / not yet (plateau, *fuse*).
- **P5 Partner's Big Offer** *(the relocation)* — relocate (lose a career stage, +Morale) / long-distance (−Morale/term ×4, +Workload) / they decline for you (*fuse: resentment in 3 terms unless you invest*).
- **P-end Drifting Apart** *(if relationship bottoms out)* — breakup: large Morale crash, then +Time/term.

Private/partner events cost Time and Morale, not just flavour — that's the point.

---

## 14. Storage — Neon, communal pool
Serverless Postgres on Neon. No login. Anyone browses, opens, and advances any run.

**Table `careers`:** id (uuid) · title · scientist_name · field · mode · scenario · stage · term · score · state (jsonb) · status ('active'|'finished'|'archived') · version (int, optimistic concurrency) · last_player · created_at · updated_at.

**API (Next.js route handlers → Neon via `@neondatabase/serverless`):** `POST /api/careers` (create) · `GET /api/careers` (list active, newest first, paginated → browse pool) · `GET /api/careers/:id` (load) · `PUT /api/careers/:id` (save after a turn; send `version`; reject if stale → client reloads).

**Communal model:** a run is a shared object; any visitor advances it. Last-write-wins, guarded by version check. No real-time turn-locking in v1.

**Guardrails (mandatory, public write):** rate-limit the write route per IP; length-cap names; no hard deletes (archive); soft cap on active rows; validate input.

## 15. Tech stack
Next.js PWA on Vercel · Neon Postgres + thin Next.js API layer · client state machine (XState or Zustand) serialised to `state` jsonb · rule-based utility AI opponents (local, no LLM) · React + Tailwind + SVG for v1, PixiJS later for the isometric growing-lab · AI-generated static sprites.

## 16. Build milestones
- **M0 Skeleton** — PWA, state machine, turn loop, four quick-mode meters, end-turn. No art.
- **M1 Core loop (one quick scenario, solo)** — actions, Knowledge→paper, funding economy, Workload/Morale/Coffee loop, win/score. *Find out if it's fun. Tune numbers.*
- **M2 Events** — event engine (deck, triggers, chaining), wire the 16 seed events, role-aware + karma.
- **M3 Modes & setup** — career arc + four quick scenarios + the full setup flow (partner Yes/No, field, **procedural offer generator**, university pools) + **full partner thread**.
- **M4 Neon communal pool** — schema, API routes, browse/open/continue, version guard, guardrails.
- **M5 AI + hotseat** — utility AI; pass-the-phone.
- **M6 Visual upgrade** — isometric growing-lab, sprites, animation, sound.

Ship M1 to yourself fast and play it. If the loop isn't fun before art or multiplayer, fix the numbers, not the graphics.

## 17. Tunables
Term length/count · field tilts · all £ and week costs · Workload thresholds · Coffee yield vs cost · paper acceptance curves · grant odds vs Reputation · event frequency · offer-generation weights and constraints · relationship decay rate · scoring weights.
