// /api/careers/:id — GET (open/load) · PUT (save after a turn, version-guarded).
// Spec §14: any visitor advances any run; last-write-wins guarded by an
// optimistic-concurrency version check.

import { NextResponse } from "next/server";
import {
  LIMITS,
  clampInt,
  clampStr,
  clientIp,
  db,
  rateLimited,
  summarise,
} from "@/lib/db";

export const runtime = "nodejs";

const err = (code: string, message: string, status: number) =>
  NextResponse.json({ error: message, code }, { status });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/careers/:id — load a run (full state) to open/continue it.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return err("bad_request", "Bad id.", 400);
  try {
    const sql = db();
    const [row] = (await sql`SELECT * FROM careers WHERE id = ${params.id}`) as Record<string, unknown>[];
    if (!row) return err("not_found", "No such run.", 404);
    return NextResponse.json({ career: row });
  } catch (e) {
    console.error("GET /api/careers/:id failed", e);
    return err("server_error", "Could not load the run.", 500);
  }
}

// PUT /api/careers/:id — save after advancing. Body: { version, state, lastPlayer }.
// Rejects with 409 if the stored version moved on (client must reload).
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return err("bad_request", "Bad id.", 400);
  if (rateLimited(clientIp(req)))
    return err("rate_limited", "Slow down a moment.", 429);

  let body: { version?: unknown; state?: Record<string, unknown>; lastPlayer?: unknown; title?: string };
  try {
    body = await req.json();
  } catch {
    return err("bad_request", "Invalid JSON.", 400);
  }
  const state = body.state;
  const version = clampInt(body.version, 1, 1_000_000, 0);
  if (!state || typeof state !== "object" || !state.scenario || !state.meters || !version)
    return err("bad_request", "Missing version or malformed state.", 400);

  const s = summarise(state, body.title ?? `${state.scientistName ?? "Anonymous"} — ${state.scenario}`);
  const lastPlayer = clampStr(body.lastPlayer, LIMITS.nameMax, s.scientistName);

  try {
    const sql = db();
    // Version guard: update only if the stored version still matches (§14).
    const rows = (await sql`
      UPDATE careers SET
        title = ${s.title}, scientist_name = ${s.scientistName}, field = ${s.field},
        mode = ${s.mode}, scenario = ${s.scenario}, stage = ${s.stage}, term = ${s.term},
        score = ${s.score}, state = ${JSON.stringify(state)}, status = ${s.status},
        last_player = ${lastPlayer}, version = version + 1, updated_at = now()
      WHERE id = ${params.id} AND version = ${version}
      RETURNING version
    `) as { version: number }[];

    if (rows.length === 0) {
      // Either gone, or someone else advanced it first — tell the client to reload.
      const [exists] = (await sql`SELECT version FROM careers WHERE id = ${params.id}`) as { version: number }[];
      if (!exists) return err("not_found", "No such run.", 404);
      return NextResponse.json(
        { error: "This run was advanced by someone else. Reloading.", code: "stale_version", currentVersion: exists.version },
        { status: 409 },
      );
    }
    return NextResponse.json({ version: rows[0].version });
  } catch (e) {
    console.error("PUT /api/careers/:id failed", e);
    return err("server_error", "Could not save the run.", 500);
  }
}
