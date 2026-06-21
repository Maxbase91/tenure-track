---
name: home-screen-design
description: Visual concept and structural decisions for the Home screen — the game's entry point
metadata:
  type: project
---

**Concept:** "Opening a serious scientific journal that happens to be about you."

**Structure:**
1. Kicker line — IBM Plex Mono, "Vol. I · Your Career Issue" — metadata voice
2. Game title — Fraunces 600, large (clamp 40–58px), full-width masthead weight
3. Horizontal rule — 2px solid var(--text), the journal header separator
4. Tagline — Hanken Grotesk, text2 color — subtitle, not marketing

Mode buttons are parchment cards (.modeCard) matching the .doc card visual language from GameBoard — same border color (--border #d6cbb0), same radius family (14px), IBM Plex Mono description text. Arrow anchored bottom-right, animates on hover.

Footer: "Peer-reviewed by nobody. Published regardless." — IBM Plex Mono 10px, text3, centered.

**Why:** The dry academic satire tone means the UI should look like it belongs in a grant application or academic journal, not a mobile game lobby. Fraunces + mono text reads as institutional; the horizontal rule is a masthead convention from print journals.

**Files:**
- `app/components/Home.tsx` — component
- `app/components/Home.module.css` — styles (imports tokens.module.css)
