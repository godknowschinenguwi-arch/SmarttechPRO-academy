# Deploying SmartTech Academy — staging first, then production

Two free paths to a live test link. **Path A (Vercel + Turso)** is recommended: no credit card, ~10 minutes, and it scales straight into production later.

---

## Path A — Vercel + Turso (recommended, free)

You'll create: a GitHub repo (code), a Turso database (free SQLite in the cloud — the app already speaks its protocol), and a Vercel project (free hosting).

### 1. Push the code to GitHub

```bash
cd smarttech-academy
git init && git add -A && git commit -m "SmartTech Academy v1"
```

Create an empty repo at github.com (e.g. `smarttech-academy`), then:

```bash
git remote add origin https://github.com/<your-username>/smarttech-academy.git
git branch -M main && git push -u origin main
```

### 2. Create the free cloud database (Turso)

Sign up at **turso.tech** (free tier is generous), then in their dashboard or CLI:

```bash
# CLI (optional): curl -sSfL https://get.tur.so/install.sh | bash
turso db create smarttech-staging
turso db show smarttech-staging --url        # → libsql://smarttech-staging-xxx.turso.io
turso db tokens create smarttech-staging     # → your auth token
```

(Dashboard equivalent: Create Database → copy the URL and create a token.)

### 3. Deploy on Vercel

1. Go to **vercel.com** → Add New → Project → import your GitHub repo.
2. Framework is auto-detected (Next.js). Before clicking Deploy, add **Environment Variables**:

| Name | Value |
|---|---|
| `DATABASE_URL` | `libsql://smarttech-staging-xxx.turso.io` |
| `DATABASE_AUTH_TOKEN` | *(your Turso token)* |
| `AUTH_SECRET` | *(any long random string — `openssl rand -hex 32`)* |
| `NEXT_PUBLIC_APP_URL` | your Vercel URL once known, e.g. `https://smarttech-academy.vercel.app` |

3. Click **Deploy**. The build runs `npm run seed && next build` — the seed populates Turso on the first deploy (and safely skips afterwards).
4. Done — your staging link is `https://<project>.vercel.app`. Log in with the demo accounts, run the sandbox payment flow, share the link.

> After the first deploy, set `NEXT_PUBLIC_APP_URL` to the real Vercel URL (Settings → Environment Variables) and redeploy, so payment return URLs are correct.

### 4. Going to production later

- Add your domain in Vercel (Settings → Domains) — e.g. `smarttechacademy.co.zw`.
- Create a second Turso DB (`smarttech-prod`) and a Production env-var set.
- Add `PAYNOW_INTEGRATION_ID` + `PAYNOW_INTEGRATION_KEY` — checkout switches from the sandbox gateway to real Paynow automatically.
- In your Paynow merchant dashboard, the result URL is `https://<your-domain>/api/webhooks/paynow`.

---

## Path B — Railway / Fly.io / Render (Docker, one service)

The included `Dockerfile` runs the whole app with SQLite on a mounted volume — simplest possible ops.

**Railway:** New Project → Deploy from GitHub repo → it detects the Dockerfile. Add a **Volume** mounted at `/app/prisma` (so the DB file persists). Set env vars `AUTH_SECRET` and `NEXT_PUBLIC_APP_URL` (your `*.up.railway.app` URL). Deploy — seeding runs automatically at first boot.

**Fly.io:** `fly launch` (uses the Dockerfile), `fly volumes create data`, mount at `/app/prisma`, `fly deploy`.

No volume? Point `DATABASE_URL`/`DATABASE_AUTH_TOKEN` at Turso instead — then the container is stateless and you can scale replicas.

---

## Checks after any deploy

1. `/` loads, courses render (seed worked).
2. Register a fresh account; log in as `admin@smarttech.academy` / `Password123!`.
3. Enroll in a course → sandbox gateway → Approve → dashboard shows the course.
4. `/verify/STA-2026-000117` shows a valid certificate.

## Production hardening checklist (before real students)

- [ ] Strong unique `AUTH_SECRET`; rotate any secrets that were ever committed.
- [ ] Change/remove the seeded demo accounts and demo student data.
- [ ] Real Paynow keys set; webhook URL registered; do one $0.50 live test payment.
- [ ] Backups: Turso has point-in-time restore on paid tier, or nightly `turso db shell ... .dump` export.
- [ ] Add an uptime monitor (UptimeRobot free) on `/` and `/api/payments/status`.
