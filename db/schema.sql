-- Communal save pool (spec §14). Single canonical schema; run with:
--   DATABASE_URL=... node scripts/migrate.mjs
-- Idempotent.

CREATE TABLE IF NOT EXISTS careers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  scientist_name text NOT NULL,
  field          text NOT NULL,
  mode           text NOT NULL,
  scenario       text NOT NULL,
  stage          text NOT NULL,
  term           int  NOT NULL,
  score          int  NOT NULL DEFAULT 0,
  state          jsonb NOT NULL,
  status         text NOT NULL DEFAULT 'active',
  version        int  NOT NULL DEFAULT 1,
  last_player    text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Browse-pool query path: active runs, newest first.
CREATE INDEX IF NOT EXISTS careers_active_idx ON careers (status, updated_at DESC);
