# Adoption Plan

> **Generated**: 2026-06-21
> **Project phase**: Pre-Production / Early Production (brownfield)
> **Engine**: Next.js 14 / TypeScript — NOT CONFIGURED in template yet
> **Template version**: CCGS v1.0 (installed 2026-06-21)

Work through these steps in order. Check off each item as you complete it.
Re-run `/adopt` anytime to check remaining gaps.

---

## Step 1: Fix Blocking Gaps

### 1a. Create design/gdd/ and migrate design docs

**Problem**: Every template skill (`/gate-check`, `/create-stories`, `/design-review`,
`/architecture-review`, `/consistency-check`) scans `design/gdd/` for GDDs. This
directory does not exist. Those skills will silently treat the project as having no
design at all.

Your existing `doc/tenure-track-v4-master-spec.md` is a comprehensive master spec
covering ~10 systems. It needs to be split into individual system GDDs in the
template's 8-section format.

**Recommended approach — use `/reverse-document` to bootstrap from existing docs:**
```
/reverse-document design doc/tenure-track-v4-master-spec.md
```
This reads the spec and generates GDD skeletons in `design/gdd/` for each system.
Then fill each section using `/design-system retrofit design/gdd/[filename].md`.

**Systems to extract** (identified from master spec):
- [ ] `resource-system.md` — 8 resources, Workload/Coffee/Morale loop
- [ ] `event-system.md` — event architecture, 40-event pool, conditional triggers, chaining
- [ ] `turn-loop.md` — term structure, action allocation, end-of-term checks
- [ ] `career-progression.md` — PhD → tenure arc, mid-game review, win conditions
- [ ] `conference-system.md` — tier × who-pays matrix
- [ ] `phd-offer-generator.md` — procedural generation, 4 profiles, university pool
- [ ] `quick-mode.md` — 4 entry points, reduced visibility, win conditions
- [ ] `partner-system.md` — partner thread, Relationship resource, karma
- [ ] `student-loyalty.md` — karma layer, crisis resilience, PI choices
- [ ] `game-concept.md` — overall concept + tone (required for `/gate-check`)

**Time**: 1–3 sessions (use `/reverse-document` to draft, review each one)

---

### 1b. Create technical-preferences.md

**Problem**: `.claude/docs/technical-preferences.md` is absent. Engine specialist
agents, ADR engine-compatibility checks, and the engine-code rule in
`rules/engine-code.md` all read this file. Without it they operate blind.

**Fix**: Create the file using the template at `.claude/docs/settings-local-template.md`
and fill in your actual stack:

```
Engine: Next.js 14 (App Router, browser-based game)
Language: TypeScript 5.x (strict mode)
State management: XState v5 (lib/game/machine.ts)
Database: PostgreSQL via Neon (lib/db.ts, lib/pool.ts)
UI framework: React 18, Framer Motion
Testing: Vitest
Build: npm / Next.js
```

- [ ] `.claude/docs/technical-preferences.md` created and filled in

**Time**: 15 min

---

## Step 2: Fix High-Priority Gaps

### 2a. Create systems-index.md

**Problem**: `/create-epics`, `/gate-check`, `/consistency-check`, and
`/architecture-review` all read `design/gdd/systems-index.md` to enumerate systems.
Without it they can't operate on your systems.

**Fix**: After creating GDDs in Step 1, run:
```
/map-systems
```
This reads all GDDs and generates the systems index with dependency ordering.

- [ ] `design/gdd/systems-index.md` created by `/map-systems`

**Time**: 30 min (after Step 1a GDDs exist)

---

### 2b. Create Architecture Decision Records (ADRs)

**Problem**: 0 ADRs exist. `/story-readiness`, `/create-stories`, and
`/architecture-review` all require ADRs to validate technical decisions.
Stories generated without ADRs have no governing technical constraints.

Your codebase has already made ~6–8 major architectural decisions that need
to be captured:

| Decision | File to create |
|---|---|
| Next.js as game engine (browser PWA, not traditional game engine) | `docs/architecture/adr-0001-nextjs-as-game-engine.md` |
| XState v5 state machine for game logic (`lib/game/machine.ts`) | `docs/architecture/adr-0002-xstate-game-state-machine.md` |
| PostgreSQL/Neon for shared game pool persistence | `docs/architecture/adr-0003-postgres-neon-persistence.md` |
| Event system architecture (deck, engine, conditional triggers) | `docs/architecture/adr-0004-event-system-architecture.md` |
| TypeScript strict mode across all game logic | `docs/architecture/adr-0005-typescript-strict-mode.md` |
| Framer Motion for game animations and transitions | `docs/architecture/adr-0006-framer-motion-animations.md` |

**Fix**: Run `/architecture-decision` for each:
```
/architecture-decision
```
Provide the context from the codebase; the skill handles the format.

- [ ] ADR-0001: Next.js as game engine
- [ ] ADR-0002: XState state machine
- [ ] ADR-0003: PostgreSQL/Neon persistence
- [ ] ADR-0004: Event system architecture
- [ ] ADR-0005: TypeScript strict mode
- [ ] ADR-0006: Framer Motion animations

**Time**: ~30 min per ADR, 6 ADRs = ~3 hours

---

### 2c. Create a Next.js engine reference stub

**Problem**: The framework's engine-code rule (`rules/engine-code.md`) says
"consult `docs/engine-reference/` for the current engine version". The framework
ships Godot/Unity/Unreal references — none exist for Next.js/TypeScript.
Without this file, the engine-code rule's version-check clause is blind.

**Fix**: Create a minimal stub:
```
docs/engine-reference/nextjs/VERSION.md
```
Contents: Next.js version, React version, TypeScript version, key dependency versions.
Cross-reference with `package.json`.

- [ ] `docs/engine-reference/nextjs/VERSION.md` created

**Time**: 15 min (copy from package.json)

---

## Step 3: Bootstrap Infrastructure

Run these in sequence after Steps 1 and 2 are complete.

### 3a. Register existing requirements (creates tr-registry.yaml)
```
/architecture-review
```
Even if ADRs are freshly written, this run bootstraps `tr-registry.yaml` by
extracting TR-IDs from your GDDs and ADRs.

**Time**: 1 session (review can be thorough for 10 systems)
- [ ] `docs/architecture/tr-registry.yaml` created

### 3b. Create control manifest
```
/create-control-manifest
```
Reads all accepted ADRs and produces a flat rules sheet: what to do, what to
never do, per system and layer. Stories reference this to stay within bounds.

**Time**: 30 min
- [ ] `docs/architecture/control-manifest.md` created

### 3c. Create sprint tracking file
```
/sprint-plan
```
Creates `production/sprint-status.yaml` from your first sprint plan.

**Time**: 30 min
- [ ] `production/sprint-status.yaml` created

### 3d. Set authoritative project stage
```
/gate-check pre-production
```
Validates you're actually at pre-production stage and writes `production/stage.txt`
authoritatively. If any gate criteria fail, the checklist will tell you what's missing.

**Time**: 15 min
- [ ] `production/stage.txt` written

---

## Step 4: Medium-Priority Gaps

### 4a. Align existing docs path with skills

**Problem**: Skill command scripts (`detect-gaps.sh`, `validate-commit.sh`, others)
still contain hardcoded references to `design/gdd/`, `src/gameplay/`, and `src/`.
The rules `paths:` frontmatter has been remapped (completed in session), but the
shell hooks themselves have not yet been patched.

Until patched, `SessionStart` will report false positives and `PreToolUse` commit
validation will miss your actual source paths.

**Fix**: Patch these hooks (in progress from this session):
- [ ] `detect-gaps.sh`: `design/gdd/` → `doc/` or `design/gdd/`, `src/` → `app/ lib/`
- [ ] `session-start.sh`: `src/` TODO/FIXME scan → `app/ lib/`
- [ ] `validate-assets.sh`: `assets/` → `public/`
- [ ] `validate-commit.sh`: `design/gdd/` → `doc/` + `design/gdd/`, `src/` → `app/ lib/`

**Time**: 30 min (surgical sed edits)

### 4b. Legacy design docs format migration

**Problem**: `doc/tenure-track-v4-master-spec.md` is a single monolithic master spec —
invaluable as a reference but not readable by the template's per-GDD skills.

**Note**: Do NOT delete or move these files. Keep `doc/` as the primary human reference.
The GDDs in `design/gdd/` created in Step 1 should be generated FROM this spec,
not instead of it.

- [ ] `doc/` docs preserved as source reference
- [ ] `design/gdd/` GDDs created from them (handled in Step 1a)

**Time**: Covered by Step 1a

---

## Step 5: Optional Improvements (Low Priority)

### 5a. Architecture traceability matrix

**Problem**: `docs/architecture/architecture-traceability.md` absent — no persistent
ADR-to-requirement mapping.

**Fix**: Generated automatically as a side effect of running `/architecture-review`
in Step 3a. No manual work needed.

- [ ] `docs/architecture/architecture-traceability.md` (created by Step 3a)

### 5b. Shader rule cleanup

**Note**: `rules/shader-code.md` (targeting `assets/shaders/**`) is irrelevant to a
Next.js game. It was flagged for deletion earlier in this session but requires
manual confirmation.

- [ ] Delete `.claude/rules/shader-code.md` (not applicable to this stack)

---

## What to Expect from Existing Stories

There are currently 0 stories in `production/epics/`. Nothing to migrate.

When you run `/create-stories` after completing Steps 1–3, new stories will be
generated with full TR-ID references, ADR guidance, and manifest version stamps
from the start. No retrofitting needed.

---

## Re-run

Run `/adopt` again after completing Step 3 to verify all blocking and high gaps
are resolved. The new run will reflect the current state of the project.

---

## Quick Reference: Recommended Order

```
Day 1:  1b (15 min) → 2c (15 min) → begin 1a (reverse-document + first 3 GDDs)
Day 2:  Complete 1a (remaining GDDs) → 2a (map-systems)
Day 3:  2b (write 6 ADRs, ~30 min each)
Day 4:  Step 3 (infrastructure bootstrap, ~2 hours total)
        → /architecture-review → /create-control-manifest → /sprint-plan → /gate-check
```
