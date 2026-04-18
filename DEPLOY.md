# Deploy to Cloudflare

This guide takes a clean laptop and a Cloudflare account to a live, QR-ready system in about **15 minutes**.

## Prerequisites

- Node.js 18+ (`node --version`)
- A Cloudflare account (free tier is enough)
- Git (optional, only if you want to deploy via Pages + GitHub)

---

## Recommended: one Worker = UI + API (`*.workers.dev`)

The Worker bundles the Vite build (`frontend/dist`) and serves `/api/*` from the same origin. No `_redirects` proxy is used.

```bash
cd worker
npm install
npx wrangler secret put JWT_SECRET   # once per Worker name
npm run deploy                       # builds frontend + uploads Worker + assets
```

Open `https://<worker-name>.<subdomain>.workers.dev/` — guest page, `/login`, and `/api/*` all work on **one hostname**. Set `worker/wrangler.toml` → `name` and `[vars] CORS_ORIGIN` to that exact `https://…` URL (no trailing slash).

---

## Alternative: GitHub + Cloudflare Pages (frontend only)

Use this if you want `*.pages.dev` for the UI and a **separate** Worker URL for the API.

1. Push this repo to GitHub (`main` branch).
2. Cloudflare → **Pages** → **Connect to Git** → your repo.
3. Build: `cd frontend && npm install && npm run build`; output `frontend/dist`; root **empty**.
4. Copy `frontend/_redirects.pages.example` to `frontend/public/_redirects`, set your Worker `/api/*` URL, commit, rebuild.

The **Worker** is still deployed with `cd worker && npm run deploy` (see Part 1). Match `CORS_ORIGIN` to your **Pages** URL.

---

## Part 1 — Deploy the Worker (backend)

### 1.1 Install deps

```bash
cd worker
npm install
```

### 1.2 Log in to Cloudflare

```bash
npx wrangler login
```

A browser opens — sign in and authorise.

### 1.3 Create the D1 database

```bash
npx wrangler d1 create cliff_inn
```

Wrangler prints something like:
```
✅ Successfully created DB 'cliff_inn'
[[d1_databases]]
binding = "DB"
database_name = "cliff_inn"
database_id = "abc12345-6789-..."
```

**Copy the `database_id`** and paste it into `worker/wrangler.toml`, replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`.

### 1.4 Initialise the schema (on the remote D1)

```bash
npm run db:init-remote
```

### 1.5 Set the JWT secret

Generate a random 48-byte secret:

```bash
# macOS / Linux
openssl rand -base64 48

# Or with Node
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Then:

```bash
npx wrangler secret put JWT_SECRET
# Paste the secret when prompted. Hit Enter.
```

### 1.6 Deploy

```bash
npm run deploy
```

Wrangler prints your Worker URL (see `name` in `worker/wrangler.toml`). **Keep this URL**.

Test it:
```bash
curl https://<your-worker-name>.<subdomain>.workers.dev/api/health
# → {"ok":true,"time":...}
```

---

## Part 2 — Deploy the frontend (Pages only)

Skip this section if you use **one Worker for UI + API** (see the **Recommended** block at the top).

### 2.1 Point the frontend at your Worker

Copy `frontend/_redirects.pages.example` to `frontend/public/_redirects` and set the Worker URL:

```
/api/*  https://<your-worker>.<subdomain>.workers.dev/api/:splat  200
/*      /index.html                                                     200
```

This proxies `/api/*` on your Pages domain to the Worker.

### 2.2 Build

```bash
cd ../frontend
npm install
npm run build
```

Build output lands in `frontend/dist/`.

### 2.3 Deploy to Pages

**Option A — Direct upload (fastest)**

```bash
npx wrangler pages deploy dist --project-name=cliff-inn
```

First run, wrangler will ask which account + create the project. Subsequent deploys just push new builds. You'll get a URL like `https://cliff-inn.pages.dev`.

**Option B — GitHub integration (auto-deploy on push)**

1. Push the repo to GitHub.
2. Cloudflare dashboard → Pages → Create project → Connect to Git.
3. Build settings:
   - **Framework preset**: None
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: (leave empty)

### 2.4 Update Worker CORS_ORIGIN

Now that you have your Pages URL (e.g. `https://cliff-inn.pages.dev`), edit `worker/wrangler.toml`:

```toml
[vars]
CORS_ORIGIN = "https://cliff-inn.pages.dev"
```

And redeploy:

```bash
cd ../worker && npm run deploy
```

---

## Part 3 — First-time setup

1. Open `https://cliff-inn.pages.dev/login`
2. Sign in with `cliffinnadmin` / `cliffinnadmin123`
3. Go to **Settings** → **Change admin password** → set something strong
4. **Settings** → **Default safe code** → confirm it's `5288` (or change as you prefer)
5. **Guests** tab → add a test guest: name `Test Guest`, room `A01`
6. Open the guest URL (`https://cliff-inn.pages.dev/`) on your phone, type `test guest`, verify the welcome message shows up
7. Delete the test guest

---

## Part 4 — Generate and print the QR code

The QR code should point to the **root guest URL**, no path:

```
https://cliff-inn.pages.dev/
```

Free QR generators (all fine — no account needed):

- <https://qrcode-monkey.com/>
- <https://www.qr-code-generator.com/>

**Tips for the printed QR**:
- Use **high error-correction level (H)** so it still scans after coffee stains / creases
- Minimum print size: **3 × 3 cm** (scannable from ~30 cm)
- Recommended print size: **5 × 5 cm** on the poster at the door
- Test it with your phone BEFORE laminating
- Add readable text below: "Late Check-in · Scan me" so guests know what it does

When a guest points their phone camera at the QR code, iOS/Android shows a tappable link → opens in Safari/Chrome → lands directly on the guest page. That's it.

---

## Part 5 — Custom domain (optional)

If you own a domain (e.g. `cliffhousemotel.com.au`):

1. Cloudflare dashboard → Pages → your project → **Custom domains** → Add
2. Enter `checkin.cliffhousemotel.com.au` (or whatever subdomain you want)
3. Cloudflare auto-creates the DNS record if the domain is already on Cloudflare

Then regenerate your QR code to point at the new URL and update `CORS_ORIGIN` in `wrangler.toml`.

---

## Troubleshooting

**"unauthorized" when accessing /admin**
Cookie didn't set. Check:
- `CORS_ORIGIN` in `wrangler.toml` exactly matches your Pages URL (no trailing slash)
- You're on HTTPS (the cookie is `Secure`)
- The `_redirects` file is pointing at the right Worker URL

**Guest lookup returns "too_many_requests"**
Rate limit is 20 lookups/minute per IP. Wait 60s.

**Admin login returns "locked"**
5 failed attempts → locked 15 min per IP. Wait, or clear manually:
```bash
cd worker
npx wrangler d1 execute cliff_inn --remote --command "DELETE FROM login_attempts"
```

**Cron didn't run**
Cron only runs on deployed Workers, not `wrangler dev`. Check Cloudflare dashboard → Workers → your worker → Triggers → Cron Events.

**Forgot admin password**
Reset via D1:
```bash
cd worker
npx wrangler d1 execute cliff_inn --remote --command "DELETE FROM admin_users"
```
Next login will re-seed the default `cliffinnadmin` / `cliffinnadmin123`.

---

## Costs

On Cloudflare free tier, expected usage is **$0/month** indefinitely:

- Workers: 100,000 requests/day free (you'll use maybe 10-20/day)
- D1: 5 GB storage + 5M reads/day free (you're using KB and a handful of queries)
- Pages: unlimited static requests, 500 builds/month free
- Cron: included
