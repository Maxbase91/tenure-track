---
name: design-system-overview
description: Core token palette, font stack, and canonical source-of-truth files for the Tenure Track design system
metadata:
  type: project
---

The design system lives in two files:

- `app/components/tokens.module.css` — shared CSS module; declares all tokens on `:global(:root)` and exports utility classes (.card, .btn, .btnPrimary, .btnGhost, .label, .heading, .mono)
- `app/components/GameBoard.module.css` — original source of the dark-surface token values; tokens are re-declared there on `.board` for scoping (pre-tokens-file era)

**Dark surface palette** (for game board / ink-background screens):
- `--ink` #1b2a32, `--ink2` #243a44, `--ink3` #2e4953
- `--paper` #f1ead9 (warm parchment)
- `--hl` #f4d43c (yellow CTA)
- `--reagent` #54b089 (positive/green), `--alarm` #d85850 (warning/red)
- `--muted` #9fb2b9, `--line` rgba(255,255,255,0.1)

**Light surface palette** (for secondary screens on parchment background):
- `--surface` #fefcf7, `--border` #d6cbb0, `--text` #22312f, `--text2` #5a6b65, `--text3` #9a8f74

**Font stack** (loaded in globals.css via Google Fonts):
- Fraunces 600 — titles, event headings, dramatic moments
- Hanken Grotesk 400/600/700/800 — body, labels, buttons
- IBM Plex Mono 400/500 — data, costs, hints, kickers

**Why:** Secondary screens (Home, SetupFlow, MatchLobby, etc.) were all raw inline styles with no token usage. tokens.module.css was created to unify them.

**How to apply:** Any new screen or component should import tokens.module.css and reference `--token` variables. Never hardcode color hex values that duplicate a token.
