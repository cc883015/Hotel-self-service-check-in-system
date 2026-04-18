# Run it locally in VS Code

Verify everything works on your laptop before deploying to Cloudflare.

## Prerequisites

- **Node.js 18+** — check with `node -v`. If missing, install from <https://nodejs.org/>
- **VS Code** with the project folder opened
- Two terminals inside VS Code (press `` Ctrl+` `` to open one, click the `+` icon for a second)

## Step 1 — Install dependencies

**Terminal 1 (worker):**
```bash
cd worker
npm install
```

**Terminal 2 (frontend):**
```bash
cd frontend
npm install
```

## Step 2 — Set up the local D1 database

In Terminal 1:
```bash
npm run db:init
```

This creates a local SQLite DB under `.wrangler/state/` and applies the schema.

## Step 3 — Set the JWT secret for local dev

Create a file `worker/.dev.vars` (already in .gitignore):

```
JWT_SECRET=any-random-string-for-local-dev-only-change-me
```

Anything works for local dev — it doesn't need to be cryptographically strong here.

## Step 4 — Start the Worker

Terminal 1:
```bash
npm run dev
```

You should see:
```
⎔ Starting local server...
[wrangler:info] Ready on http://127.0.0.1:8787
```

Test it:
```bash
# New terminal, or just open http://127.0.0.1:8787/api/health in a browser
curl http://127.0.0.1:8787/api/health
# → {"ok":true,"time":1729...}
```

## Step 5 — Start the frontend

Terminal 2:
```bash
npm run dev
```

You should see:
```
  VITE v5.x ready in Xms
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Open <http://localhost:5173/> — you'll see the guest page.

## Step 6 — Test the full flow

1. **Guest page**: <http://localhost:5173/> — type anything, it should say "couldn't find your booking" (no guests yet)
2. **Staff login** (top-right): <http://localhost:5173/login>
   - Username: `cliffinnadmin`
   - Password: `cliffinnadmin123`
3. **Admin**: adds yourself a test guest, name `John Smith`, room `A01`, leave safe code empty
4. Open <http://localhost:5173/> in a private/incognito window, type `jhon smith` (typo intentional) → should match and show the welcome message with safe code `5288`
5. Back in admin — refresh the list, you should see "Scanned 1× · just now"
6. Try **Settings** → change the default safe code to `1234`, add another guest without a custom code, verify the guest-side message shows `1234`
7. **Change password** works too (min 8 chars)

## Step 7 — Test on your actual phone (same WiFi)

Vite prints a "Network" URL like `http://192.168.x.x:5173/` when you run `npm run dev`. Open that URL on your phone browser (same WiFi as your laptop) to see exactly how it'll look after scanning the QR.

**Known limitation for phone testing**: the Vite proxy in dev mode forwards `/api/*` to `localhost:8787` which *only listens on the laptop*. To test API calls from the phone in dev:

Option A — use your laptop's LAN IP in both places:
1. Find your laptop IP: `ipconfig` (Windows) or `ifconfig | grep inet` (mac/Linux)
2. Run wrangler bound to all interfaces:
   ```bash
   cd worker
   npx wrangler dev --ip 0.0.0.0
   ```
3. Edit `frontend/vite.config.js`, change the proxy target to your laptop IP:
   ```js
   target: "http://192.168.x.x:8787"
   ```

Option B (easier) — just deploy a dev version to Cloudflare and test against the real deployment.

## Step 8 — Verify the production build

```bash
cd frontend
npm run build
npm run preview
```

Preview runs at <http://localhost:4173/> with the production bundle. API calls go to the same origin only if you use a dev proxy; for local full-stack, use `npm run dev` in `frontend` + `worker` as in README.

This step is mostly to confirm the build succeeds — the real verification is after `wrangler pages deploy`.

## Troubleshooting

**`wrangler: command not found`**
You're not using `npx`. All wrangler commands in scripts use `npx wrangler`. If running manually, use `npx wrangler ...`.

**`Error: No such D1 database 'cliff_inn'`**
Wrangler couldn't find the local DB. Run `npm run db:init` in the worker folder again.

**Frontend shows "Something went wrong" on every action**
Worker isn't running or the Vite proxy can't reach it. Check Terminal 1 is still running `npm run dev`.

**Port 5173 or 8787 already in use**
Kill the process or change the port:
- Vite: edit `frontend/vite.config.js`, change `server.port`
- Wrangler: `npx wrangler dev --port 8788`

**Admin login works but then "unauthorized" on /admin**
Cookies not persisting. This should work out-of-the-box in dev; if broken, check your browser isn't blocking all cookies.

---

Once everything works locally, follow `DEPLOY.md` to get it live.
