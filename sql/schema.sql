-- FixMessy schema. Applied idempotently at startup (see lib/db.ts).
-- Images stored as bytea so uploads survive deploys.

CREATE TABLE IF NOT EXISTS gallery_entry (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  before_img BYTEA NOT NULL,
  after_img BYTEA,
  mime_before TEXT NOT NULL DEFAULT 'image/jpeg',
  mime_after TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS gallery_entry_created_idx ON gallery_entry (created_at DESC);

CREATE TABLE IF NOT EXISTS product (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  popularity INTEGER NOT NULL DEFAULT 0,
  purchase_url TEXT
);

CREATE TABLE IF NOT EXISTS setting (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_credential (
  id TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL
);
