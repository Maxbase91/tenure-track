# Technical Preferences

## Engine & Language

- **Engine**: Next.js 14.2.5 (App Router, browser-based PWA game — no game engine)
- **Language**: TypeScript 5.5.3 (strict mode)
- **Rendering**: React 18.3 + CSS Modules + Framer Motion 12.40 (no WebGL/canvas)
- **Physics**: N/A — browser event-driven game loop via Zustand state machine

## Input & Platform

- **Target Platforms**: Mobile-first PWA (phone primary), desktop secondary
- **Input Methods**: Touch (primary), keyboard/mouse (desktop)
- **Primary Input**: Touch tap
- **Gamepad Support**: None
- **Touch Support**: Full
- **Platform Notes**: Phone-first layout (max-width 480–760px), fixed-position controls must clear iOS safe areas

## State Management

- **Game state**: Zustand 4.5.4 (`lib/game/store.ts` for solo, `lib/game/matchStore.ts` for match)
- **Database**: Neon PostgreSQL via `@neondatabase/serverless` 0.10.4 (communal save pool)
- **Animation**: Framer Motion 12.40 (`AnimatePresence`, `motion`, `useReducedMotion`)

## Design System

- **Design tokens** (defined in `GameBoard.module.css`, should be globalised):
  - `--ink: #1b2a32` (dark teal — primary background for game device)
  - `--ink2: #243a44` (elevated surface)
  - `--ink3: #2e4953` (hover/active surface)
  - `--paper: #f1ead9` (warm parchment — text on dark, document backgrounds)
  - `--hl: #f4d43c` (yellow highlight — CTA, active states, data labels)
  - `--reagent: #54b089` (teal green — positive outcomes)
  - `--alarm: #d85850` (red — warnings, burnout, failure)
  - `--muted: #9fb2b9` (secondary text on dark)
  - `--line: rgba(255,255,255,0.1)` (border on dark surfaces)
- **Background**: `radial-gradient + linear-gradient` warm cream (`#efe9dc → #e6dece`) — set in `globals.css`
- **Typefaces** (Google Fonts, loaded in `globals.css`):
  - `Fraunces` — serif, 600 weight — game title, event headings, dramatic moments
  - `Hanken Grotesk` — sans, 400/600/700/800 — body, labels, buttons
  - `IBM Plex Mono` — monospace, 400/500 — data, costs, hints, kickers
- **UI style**: Academic document aesthetic — dark device card on warm paper, parchment event cards with rotate(-0.5deg), monospace data readouts

## Naming Conventions

- **Components**: PascalCase (`GameBoard.tsx`)
- **CSS modules**: camelCase classes (`meterLabel`, `actHint`)
- **Hooks/utils**: camelCase (`useCountUp`, `canDo`)
- **Types**: PascalCase (`GameState`, `ActionId`)
- **Files**: PascalCase for components, camelCase for utilities
- **Constants**: SCREAMING_SNAKE (`ACTIONS`, `SCENARIOS`, `AI_PROFILES`)

## Performance Budgets

- **Target**: 60 fps on mid-range Android (Pixel 4a class)
- **Frame Budget**: No game loop; event-driven — React re-render per action is acceptable
- **Bundle**: Keep JS under 150kB gzipped (Next.js code-splitting handles per-route)
- **Fonts**: Already loaded via Google Fonts — no additional web font requests

## Testing

- **Framework**: None configured yet — Vitest recommended
- **Minimum Coverage**: 0% currently — start with game logic (dice, machine, events)
- **Required Tests**: Zustand state transitions, dice rolls, event effects, score calculation

## Forbidden Patterns

- No `any` without explicit cast comment
- No hardcoded game values in component files — constants belong in `lib/game/constants.ts`
- No inline styles on screens that already have or should have a CSS module
- No Tailwind — project uses CSS modules
- No direct DOM manipulation — all state via Zustand

## Allowed Libraries / Addons

- `framer-motion` — approved for all animation
- `@neondatabase/serverless` — approved for DB access
- `zustand` — approved for game state
- No additional UI libraries without ADR

## Engine Specialists

- **Primary**: `gameplay-programmer` (TypeScript/React game logic)
- **Language/Code Specialist**: `gameplay-programmer`
- **Shader Specialist**: N/A
- **UI Specialist**: `ui-programmer` (React + CSS Modules + Framer Motion)
- **Additional Specialists**: `network-programmer` (Neon/DB API routes)
- **Routing Notes**: For `.tsx` components → `ui-programmer`. For `lib/game/*.ts` → `gameplay-programmer`. For `app/api/**` → `network-programmer`.

### File Extension Routing

| File Extension / Type | Specialist to Spawn |
|-----------------------|---------------------|
| `app/components/*.tsx` | ui-programmer |
| `app/components/*.module.css` | ui-programmer |
| `lib/game/*.ts` | gameplay-programmer |
| `lib/game/events/*.ts` | gameplay-programmer |
| `app/api/**` | network-programmer |
| `lib/db.ts`, `lib/pool.ts` | network-programmer |
| `globals.css` | ui-programmer |
| Architecture review | technical-director |

## Architecture Decisions Log

- [No ADRs yet — see docs/adoption-plan-2026-06-21.md for the bootstrap plan]
