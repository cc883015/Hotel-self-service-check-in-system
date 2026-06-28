-- Customer Service AI module (incremental; does not alter check-in tables).

CREATE TABLE IF NOT EXISTS faq_entries (
  id          TEXT PRIMARY KEY,
  intent      TEXT NOT NULL,
  locale      TEXT NOT NULL,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  keywords    TEXT,
  is_quick    INTEGER NOT NULL DEFAULT 1,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL,
  UNIQUE(intent, locale)
);

CREATE TABLE IF NOT EXISTS hotel_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  locale      TEXT NOT NULL DEFAULT 'en',
  tags        TEXT,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nearby_places (
  id         TEXT PRIMARY KEY,
  category   TEXT NOT NULL,
  name       TEXT NOT NULL,
  address    TEXT NOT NULL,
  place_id   TEXT NOT NULL,
  note       TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chat_logs (
  id             TEXT PRIMARY KEY,
  session_id     TEXT NOT NULL,
  role           TEXT NOT NULL,
  content        TEXT NOT NULL,
  matched_intent TEXT,
  provider       TEXT,
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chat_logs_session ON chat_logs(session_id);

CREATE TABLE IF NOT EXISTS support_rate_limits (
  key          TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL DEFAULT 0
);
