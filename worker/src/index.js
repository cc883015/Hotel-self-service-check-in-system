// Cliff Inn Worker — public guest lookup + admin API + nightly cleanup.

import { Hono } from "hono";
import { cors } from "hono/cors";
import { normalize, findBestMatch } from "./match.js";
import {
  hashPassword, verifyPassword,
  signJWT, verifyJWT,
  parseCookies, buildAuthCookie, clearAuthCookie,
} from "./auth.js";
import { getJwtSecret } from "./config.js";

const app = new Hono();

app.onError((err, c) => {
  console.error("[worker]", err);
  return c.json({ error: "internal_error" }, 500);
});

function jwtNotConfigured(c) {
  return c.json({
    error: "server_misconfigured",
    message:
      "JWT_SECRET is missing or shorter than 16 characters. " +
      "Local: run `npm run dev` in the worker directory (it writes .dev.vars). " +
      "Production: `npx wrangler secret put JWT_SECRET`",
  }, 503);
}

// Data retention window: 2 days.
const RETENTION_SECONDS = 2 * 24 * 3600;

// ---------- CORS ----------
app.use("/api/*", (c, next) => {
  const origin = c.env.CORS_ORIGIN || "*";
  return cors({
    origin,
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })(c, next);
});

// ---------- helpers ----------
const now = () => Math.floor(Date.now() / 1000);

function getClientIP(c) {
  const cf = c.req.header("CF-Connecting-IP") || c.req.header("Cf-Connecting-Ip");
  if (cf) return cf.trim();
  const xff = c.req.header("X-Forwarded-For");
  if (xff) {
    const first = xff.split(",")[0];
    if (first) return first.trim();
  }
  return "unknown";
}

async function ensureAdmin(env) {
  const row = await env.DB.prepare(
    "SELECT username, password_hash FROM admin_users WHERE username = ?"
  ).bind("cliffinnadmin").first();
  // Cloudflare Web Crypto cannot verify pbkdf2 with >100k iterations (old default was 210k).
  if (row?.password_hash?.startsWith("pbkdf2$210000$")) {
    await env.DB.prepare("DELETE FROM admin_users WHERE username = ?").bind("cliffinnadmin").run();
  } else if (row) {
    return;
  }
  const hash = await hashPassword("cliffinnadmin123");
  const t = now();
  await env.DB.prepare(
    "INSERT INTO admin_users (username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)"
  ).bind("cliffinnadmin", hash, t, t).run();
}

async function getSetting(env, key, fallback = null) {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first();
  return row?.value ?? fallback;
}

async function setSetting(env, key, value) {
  await env.DB.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) " +
    "ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).bind(key, value).run();
}

// ---------- auth middleware ----------
async function requireAuth(c, next) {
  const secret = getJwtSecret(c.env);
  if (!secret) return jwtNotConfigured(c);
  const cookies = parseCookies(c.req.header("Cookie"));
  const payload = await verifyJWT(cookies.cliff_auth, secret);
  if (!payload || !payload.sub) {
    return c.json({ error: "unauthorized" }, 401);
  }
  c.set("user", payload.sub);
  return next();
}

// ==================================================================
// PUBLIC: guest lookup
// ==================================================================

async function checkGuestRateLimit(env, ip) {
  const key = `rl_guest_${ip}`;
  const raw = await getSetting(env, key);
  const state = raw ? JSON.parse(raw) : { count: 0, resetAt: 0 };
  const t = now();
  if (t > state.resetAt) {
    state.count = 0;
    state.resetAt = t + 60;
  }
  state.count++;
  await setSetting(env, key, JSON.stringify(state));
  return state.count <= 20; // 20/min per IP
}

app.post("/api/lookup", async (c) => {
  const ip = getClientIP(c);
  if (!await checkGuestRateLimit(c.env, ip)) {
    return c.json({ error: "too_many_requests" }, 429);
  }

  const { name } = await c.req.json().catch(() => ({}));
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return c.json({ error: "invalid_name" }, 400);
  }

  // Match against guests from the last 2 days only.
  const cutoff = now() - RETENTION_SECONDS;
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, name_normalized, room_number, safe_code FROM guests WHERE created_at >= ?"
  ).bind(cutoff).all();

  const match = findBestMatch(name, results || []);
  if (!match) return c.json({ matched: false });

  const t = now();
  await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT INTO scans (guest_id, scanned_at, ip) VALUES (?, ?, ?)"
    ).bind(match.guest.id, t, ip),
    c.env.DB.prepare(
      "UPDATE guests SET scan_count = scan_count + 1, " +
      "first_scan_at = COALESCE(first_scan_at, ?), last_scan_at = ? WHERE id = ?"
    ).bind(t, t, match.guest.id),
  ]);

  const safeCode = match.guest.safe_code || await getSetting(c.env, "default_safe_code", "5288");

  return c.json({
    matched: true,
    guest_name: match.guest.name,
    room_number: match.guest.room_number,
    safe_code: safeCode,
  });
});

// ==================================================================
// ADMIN: auth
// ==================================================================

app.post("/api/admin/login", async (c) => {
  await ensureAdmin(c.env);

  const secret = getJwtSecret(c.env);
  if (!secret) return jwtNotConfigured(c);

  const ip = getClientIP(c);
  const t = now();

  const attempt = await c.env.DB.prepare(
    "SELECT fail_count, locked_until FROM login_attempts WHERE ip = ?"
  ).bind(ip).first();
  if (attempt?.locked_until && attempt.locked_until > t) {
    return c.json({ error: "locked", retry_after: attempt.locked_until - t }, 429);
  }

  const { username, password } = await c.req.json().catch(() => ({}));
  if (!username || !password) return c.json({ error: "invalid_credentials" }, 400);

  const user = await c.env.DB.prepare(
    "SELECT username, password_hash FROM admin_users WHERE username = ?"
  ).bind(username).first();

  const ok = user ? await verifyPassword(password, user.password_hash) : false;
  if (!ok) {
    const newCount = (attempt?.fail_count || 0) + 1;
    const lockUntil = newCount >= 5 ? t + 15 * 60 : null;
    await c.env.DB.prepare(
      "INSERT INTO login_attempts (ip, fail_count, locked_until) VALUES (?, ?, ?) " +
      "ON CONFLICT(ip) DO UPDATE SET fail_count = ?, locked_until = ?"
    ).bind(ip, newCount, lockUntil, newCount, lockUntil).run();
    return c.json({ error: "invalid_credentials" }, 401);
  }

  await c.env.DB.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
  const token = await signJWT({ sub: user.username }, secret);
  c.header("Set-Cookie", buildAuthCookie(token));
  return c.json({ ok: true, username: user.username });
});

app.post("/api/admin/logout", (c) => {
  c.header("Set-Cookie", clearAuthCookie());
  return c.json({ ok: true });
});

app.get("/api/admin/me", async (c) => {
  const secret = getJwtSecret(c.env);
  if (!secret) return jwtNotConfigured(c);
  const cookies = parseCookies(c.req.header("Cookie"));
  const payload = await verifyJWT(cookies.cliff_auth, secret);
  if (!payload) return c.json({ authenticated: false });
  return c.json({ authenticated: true, username: payload.sub });
});

// ==================================================================
// ADMIN: guests
// ==================================================================

app.get("/api/admin/guests", requireAuth, async (c) => {
  const cutoff = now() - RETENTION_SECONDS;
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, room_number, safe_code, created_at, scan_count, first_scan_at, last_scan_at " +
    "FROM guests WHERE created_at >= ? ORDER BY created_at DESC"
  ).bind(cutoff).all();
  return c.json({ guests: results || [] });
});

app.post("/api/admin/guests", requireAuth, async (c) => {
  const { name, room_number, safe_code } = await c.req.json().catch(() => ({}));
  if (!name || !room_number) return c.json({ error: "missing_fields" }, 400);
  if (name.length > 100 || room_number.length > 20) return c.json({ error: "too_long" }, 400);
  if (safe_code && !/^\d{3,8}$/.test(safe_code)) {
    return c.json({ error: "invalid_safe_code" }, 400);
  }

  const normalized = normalize(name);
  if (!normalized) return c.json({ error: "invalid_name" }, 400);

  const t = now();
  const res = await c.env.DB.prepare(
    "INSERT INTO guests (name, name_normalized, room_number, safe_code, created_at) " +
    "VALUES (?, ?, ?, ?, ?)"
  ).bind(
    name.trim(),
    normalized,
    room_number.trim(),
    safe_code?.trim() || null,
    t
  ).run();

  return c.json({ ok: true, id: res.meta.last_row_id });
});

app.delete("/api/admin/guests/:id", requireAuth, async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (!id) return c.json({ error: "invalid_id" }, 400);
  await c.env.DB.prepare("DELETE FROM guests WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

// ==================================================================
// ADMIN: CSV export (last 7 days)
// ==================================================================

app.get("/api/admin/export", requireAuth, async (c) => {
  const sevenDaysAgo = now() - 7 * 24 * 3600;
  const { results } = await c.env.DB.prepare(
    "SELECT name, room_number, safe_code, created_at, scan_count, first_scan_at, last_scan_at " +
    "FROM guests WHERE created_at >= ? ORDER BY created_at DESC"
  ).bind(sevenDaysAgo).all();

  const fmt = (t) => t ? new Date(t * 1000).toISOString().replace("T", " ").slice(0, 19) : "";
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = "Name,Room,Safe Code,Created (UTC),Scan Count,First Scan (UTC),Last Scan (UTC)";
  const lines = (results || []).map(r => [
    esc(r.name),
    esc(r.room_number),
    esc(r.safe_code || "(default)"),
    fmt(r.created_at),
    r.scan_count,
    fmt(r.first_scan_at),
    fmt(r.last_scan_at),
  ].join(","));
  const csv = [header, ...lines].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cliff-inn-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
});

// ==================================================================
// ADMIN: settings
// ==================================================================

app.get("/api/admin/settings", requireAuth, async (c) => {
  const defaultSafeCode = await getSetting(c.env, "default_safe_code", "5288");
  return c.json({ default_safe_code: defaultSafeCode });
});

app.put("/api/admin/settings", requireAuth, async (c) => {
  const { default_safe_code } = await c.req.json().catch(() => ({}));
  if (default_safe_code !== undefined) {
    if (!/^\d{3,8}$/.test(default_safe_code)) {
      return c.json({ error: "invalid_safe_code" }, 400);
    }
    await setSetting(c.env, "default_safe_code", default_safe_code);
  }
  return c.json({ ok: true });
});

app.put("/api/admin/password", requireAuth, async (c) => {
  const { current_password, new_password } = await c.req.json().catch(() => ({}));
  if (!current_password || !new_password) return c.json({ error: "missing_fields" }, 400);
  if (new_password.length < 8) return c.json({ error: "password_too_short" }, 400);

  const username = c.get("user");
  const user = await c.env.DB.prepare(
    "SELECT password_hash FROM admin_users WHERE username = ?"
  ).bind(username).first();
  if (!user || !(await verifyPassword(current_password, user.password_hash))) {
    return c.json({ error: "wrong_current_password" }, 401);
  }

  const newHash = await hashPassword(new_password);
  await c.env.DB.prepare(
    "UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE username = ?"
  ).bind(newHash, now(), username).run();
  return c.json({ ok: true });
});

// Health check.
app.get("/api/health", (c) => c.json({ ok: true, time: now() }));

// ==================================================================
// Cron: delete anything older than 2 days (runs daily)
// ==================================================================
async function dailyCleanup(env) {
  const cutoff = now() - RETENTION_SECONDS;
  const res = await env.DB.prepare(
    "DELETE FROM guests WHERE created_at < ?"
  ).bind(cutoff).run();
  await env.DB.prepare(
    "DELETE FROM login_attempts WHERE locked_until IS NULL OR locked_until < ?"
  ).bind(now() - 24 * 3600).run();
  console.log(`[cleanup] removed ${res.meta.changes} expired guests`);
}

export default {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    ctx.waitUntil(dailyCleanup(env));
  },
};
