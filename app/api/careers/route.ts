// /api/careers — GET (browse the active pool) · POST (create a run).
// Spec §14: communal pool, no login, public write with mandatory guardrails.

import { NextResponse } from "next/server";
import {
  LIMITS,
  clampInt,
  clientIp,
  db,
  rateLimited,
  summarise,
} from "@/lib/db";

export const runtime = "nodejs";

const err = (code: string, message: string, status: number) =>
  NextResponse.json({ error: message, code }, { status });

// GET /api/careers?limit=&offset= — active runs, newest first (browse pool).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = clampInt(url.searchParams.get("limit"), 1, LIMITS.listPageMax, 20);
  const offset = clampInt(url.searchParams.get("offset"), 0, 100000, 0);
  try {
    const sql = db();
    const rows = await sql`
      SELECT id, title, scientist_name, field, mode, scenario, stage, term,
             score, status, version, last_player, updated_at
      FROM careers
      WHERE status = 'active'
      ORDER BY updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return NextResponse.json({ careers: rows, limit, offset });
  } catch (e) {
    console.error("GET /api/careers failed", e);
    return err("server_error", "Could not load the pool.", 500);
  }
}

// POST /api/careers — create a new run in the pool. Body: { state, lastPlayer }.
export async function POST(req: Request) {
  if (rateLimited(clientIp(req)))
    return err("rate_limited", "Slow down a moment.", 429);

  let body: { state?: Record<string, unknown>; title?: string; lastPlayer?: string };
  try {
    body = await req.json();
  } catch {
    return err("bad_request", "Invalid JSON.", 400);
  }
  const state = body.state;
  if (!state || typeof state !== "object" || !state.scenario || !state.meters)
    return err("bad_request", "Missing or malformed run state.", 400);

  const s = summarise(state, body.title ?? `${state.scientistName ?? "Anonymous"} — ${state.scenario}`);
  const lastPlayer = clientLastPlayer(body.lastPlayer, state);

  try {
    const sql = db();

    // Soft cap on active rows (spec §14): archive the oldest active runs to
    // make room rather than rejecting — keeps the pool feeling alive.
    const [{ count }] = (await sql`SELECT count(*)::int AS count FROM careers WHERE status = 'active'`) as { count: number }[];
    if (count >= LIMITS.activeCap) {
      await sql`
        UPDATE careers SET status = 'archived', updated_at = now()
        WHERE id IN (
          SELECT id FROM careers WHERE status = 'active'
          ORDER BY updated_at ASC LIMIT ${count - LIMITS.activeCap + 1}
        )
      `;
    }

    const [row] = (await sql`
      INSERT INTO careers (title, scientist_name, field, mode, scenario, stage, term, score, state, status, last_player)
      VALUES (${s.title}, ${s.scientistName}, ${s.field}, ${s.mode}, ${s.scenario}, ${s.stage}, ${s.term}, ${s.score}, ${JSON.stringify(state)}, ${s.status}, ${lastPlayer})
      RETURNING id, version
    `) as { id: string; version: number }[];

    return NextResponse.json({ id: row.id, version: row.version }, { status: 201 });
  } catch (e) {
    console.error("POST /api/careers failed", e);
    return err("server_error", "Could not save the run.", 500);
  }
}

function clientLastPlayer(raw: unknown, state: Record<string, unknown>): string {
  const fallback = typeof state.scientistName === "string" ? state.scientistName : "Anonymous";
  return (typeof raw === "string" && raw.trim() ? raw : fallback).slice(0, LIMITS.nameMax);
}
