// Apply db/schema.sql to the Neon database. Run with:
//   DATABASE_URL='postgres://...' node scripts/migrate.mjs
// Idempotent — safe to re-run.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, "..", "db", "schema.sql"), "utf8");

const pool = new Pool({ connectionString: url });
try {
  await pool.query(sql);
  const { rows } = await pool.query(
    "SELECT to_regclass('public.careers') AS table, count(*)::int AS rows FROM careers",
  );
  console.log("Migration OK:", rows[0]);
} catch (e) {
  console.error("Migration failed:", e.message);
  process.exit(1);
} finally {
  await pool.end();
}
