# Cliff Inn — Late Check-in Self-Service

A QR-code-driven self-service late check-in system for Cliff House Motel.
Guests scan a static QR code at the door → type their booking name →
get the safe box code, room key location, and welcome message instantly.

## Quick start (local)

```bash
# 1. Worker (backend)
cd worker
npm install
npx wrangler login                  # one-time; opens browser
npx wrangler d1 create cliff_inn    # copy the database_id into wrangler.toml
npm run db:init                     # apply schema to LOCAL dev DB
npm run dev                         # creates .dev.vars with JWT_SECRET if needed; runs on http://127.0.0.1:8787

# In another terminal:
# 2. Frontend
cd frontend
npm install
npm run dev                         # runs on http://127.0.0.1:5173
```

Open <http://127.0.0.1:5173/>. Vite proxies `/api/*` to the Worker on :8787,
so cookies and CORS work as if it were one origin.

Local dev secrets live in `worker/.dev.vars` (created automatically; do not commit).
For **production**, set `JWT_SECRET` with `npx wrangler secret put JWT_SECRET` (see [DEPLOY.md](./DEPLOY.md)).  
If you **rename** the Worker in `wrangler.toml`, run `secret put` again for that name — secrets do not copy automatically.

**Production (single URL):** from `worker/`, run `npm run deploy` — it builds the frontend and deploys one Worker that serves both the React app and `/api/*` on your `*.workers.dev` hostname.

## Default credentials

| Field               | Value            |
| ------------------- | ---------------- |
| Admin username      | `cliffinnadmin`  |
| Admin password      | `cliffinnadmin123`  |
| Default safe code   | `5288`           |

Change the password immediately after first login via Settings.

## Architecture

```
Guest phone (QR)  ─┐
Admin browser     ─┤──► Cloudflare Pages (React)
                   │         │ fetch /api/*
                   │         ▼
                   │    Cloudflare Worker (Hono)
                   │         │
                   │         ▼
                   │    Cloudflare D1 (SQLite)
                   │
                   └──► daily cron: delete records > 2 days old
```

## Features

**Guest side** (public, mobile-first)
- QR scan → instantly opens name entry page
- Fuzzy name match: spaces stripped, ≤2 letter typos OK, ≥80% similarity
- On match: step-by-step welcome message with safe code + room key
- On miss: friendly "check spelling and try again"

**Admin side** (login required, top-right "Staff" link on guest page)
- Add guest: name + room number + optional custom safe code
- View last 2 days of guests with scan status ("Not scanned" / "Scanned 2× · last 21:04")
- Delete individual guests
- Export last 7 days as CSV
- Settings: change default safe code, change admin password

**Automatic cleanup**: Daily cron deletes records older than 2 days (privacy).

## Deploy

See [DEPLOY.md](./DEPLOY.md).

## Tech

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router
- **Backend**: Cloudflare Workers + Hono
- **DB**: Cloudflare D1 (SQLite)
- **Auth**: HS256 JWT in HttpOnly cookies, PBKDF2-SHA256 (100k iter; Workers Web Crypto limit) password hashing
- **Zero npm runtime deps beyond Hono** — no bcrypt, no jsonwebtoken.
