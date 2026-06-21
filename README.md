# Tenure Track

A satirical academic-life strategy game. Run an academic career under a ticking
tenure clock: publish, win grants, mentor (or exploit) students, and survive the
events that surprise every run. Cynical play wins sprints; humane play wins
careers. Phone-first PWA built with Next.js.

Built milestone by milestone from `doc/tenure-track-v4-master-spec.md`.

## Stack

- **Next.js 14** (App Router) PWA, TypeScript strict
- **Zustand** client state machine — all game rules are pure functions in
  `lib/game/` (turn loop, event engine, scenarios), serialised to JSON
- **Neon** serverless Postgres for the communal save pool (`@neondatabase/serverless`)

## What's built (M0–M5)

- **Turn loop & economy** — five actions (experiments, paper, grant, mentor,
  coffee), the Knowledge→paper pipeline, the funding economy, and the
  Workload/Morale/Coffee burnout loop.
- **Event engine** — a weighted deck with conditional triggers, a chaining/fuse
  mechanic, rarity tiers, all 16 seed events, the role-aware authorship branch,
  and student-loyalty karma.
- **Modes & setup** — career arc + four quick entry points, the full setup flow,
  the procedural PhD offer generator over real university pools, and the partner
  thread.
- **Communal pool** — browse/open/continue any run; version-guarded saves; Neon
  backend with public-write guardrails.
- **AI + hotseat** — competitive matches of 2–4 players (rule-based utility-AI
  opponents + pass-the-phone humans), round-robin by term, with standings.

## Local development

```bash
npm install
cp .env.example .env        # then fill in DATABASE_URL (Neon)
node --env-file=.env scripts/migrate.mjs   # create the careers table
npm run dev                 # http://localhost:3000
```

## Environment variables

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string for the communal save pool (§14). |

The app runs without `DATABASE_URL` — only the communal pool features need it.

## Deployment

Deployed on Vercel. Set `DATABASE_URL` as a Vercel environment variable and run
the migration once against the production database.

## Roadmap

- **M6** — isometric growing-lab visuals, sprites, sound
