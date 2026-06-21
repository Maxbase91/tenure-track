// Neon serverless data access for the communal save pool (spec §14).
// Server-only: imported exclusively by API route handlers.

import { neon } from "@neondatabase/serverless";

// Lazy client so the app builds/runs without DATABASE_URL until the pool is used.
let _sql: ReturnType<typeof neon> | null = null;
export function db() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql;
}

// The `careers` table schema lives in db/schema.sql (run by scripts/migrate.mjs).

// --- guardrails (spec §14, all mandatory for a public write surface) --------

export const LIMITS = {
  nameMax: 80, // length-cap names
  titleMax: 120,
  termMax: 100, // sanity bound on term
  activeCap: 300, // soft cap on active rows; oldest archived past this
  listPageMax: 50, // max page size when browsing
  writePerMinute: 30, // per-IP write rate limit
} as const;

export function clampStr(v: unknown, max: number, fallback = ""): string {
  if (typeof v !== "string") return fallback;
  return v.trim().slice(0, max) || fallback;
}

export function clampInt(v: unknown, min: number, max: number, fallback = 0): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.max(min, Math.min(max, n));
}

// Fixed-window per-IP rate limiter. In-memory (per serverless instance) — fine
// for a v1 hobby pool; swap for a shared store if it ever gets real traffic.
const hits = new Map<string, { count: number; resetAt: number }>();
export function rateLimited(ip: string): boolean {
  const now = Date.now();
  const slot = hits.get(ip);
  if (!slot || now > slot.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  slot.count += 1;
  return slot.count > LIMITS.writePerMinute;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

// The summary columns derived from a posted run. Validated, never trusted raw.
export interface CareerSummary {
  title: string;
  scientistName: string;
  field: string;
  mode: string;
  scenario: string;
  stage: string;
  term: number;
  score: number;
  status: "active" | "finished" | "archived";
}

// Build (and sanitise) the summary from a posted game state.
export function summarise(state: Record<string, unknown>, title: string): CareerSummary {
  return {
    title: clampStr(title, LIMITS.titleMax, "Untitled run"),
    scientistName: clampStr(state.scientistName, LIMITS.nameMax, "Anonymous"),
    field: clampStr(state.field, 40, "unknown"),
    mode: state.mode === "career" ? "career" : "quick",
    scenario: clampStr(state.scenario, 40, "unknown"),
    stage: state.role === "pi" ? "PI" : "junior",
    term: clampInt(state.term, 1, LIMITS.termMax, 1),
    score: clampInt(state.score, -9999, 999999, 0),
    status: state.phase === "gameover" ? "finished" : "active",
  };
}
