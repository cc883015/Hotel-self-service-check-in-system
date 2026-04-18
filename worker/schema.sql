-- Cliff Inn D1 schema

-- Guests: one row per booked guest entered by admin.
-- name_normalized = lowercase, spaces/punctuation stripped (used for fuzzy match).
CREATE TABLE IF NOT EXISTS guests (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,
  name_normalized TEXT    NOT NULL,
  room_number     TEXT    NOT NULL,
  safe_code       TEXT,                       -- NULL => use default from settings
  created_at      INTEGER NOT NULL,           -- unix seconds
  scan_count      INTEGER NOT NULL DEFAULT 0,
  first_scan_at   INTEGER,
  last_scan_at    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_guests_created ON guests(created_at);
CREATE INDEX IF NOT EXISTS idx_guests_norm    ON guests(name_normalized);

-- Scan log: every successful guest lookup leaves a trace.
CREATE TABLE IF NOT EXISTS scans (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  guest_id   INTEGER NOT NULL,
  scanned_at INTEGER NOT NULL,
  ip         TEXT,
  FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_scans_guest ON scans(guest_id);

-- Simple KV settings table (default safe code, rate-limit counters).
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Single admin account.
CREATE TABLE IF NOT EXISTS admin_users (
  username      TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

-- Rate-limit tracking for login attempts (per IP).
CREATE TABLE IF NOT EXISTS login_attempts (
  ip           TEXT PRIMARY KEY,
  fail_count   INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER
);

-- Seed default settings.
INSERT OR IGNORE INTO settings (key, value) VALUES ('default_safe_code', '5288');

-- NOTE: default admin user is seeded at runtime on first login request
-- (password hashing must happen in the Worker). See src/index.js → ensureAdmin().
