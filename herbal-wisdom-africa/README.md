# Herbal Wisdom Africa

A community platform where people across Africa share their real, personal experiences using
herbs for various conditions — which herb, how it was prepared, how much was used, and what
happened. It's built as a space for oral/traditional plant knowledge that is already widely used
but rarely written down, with moderation to keep dangerous misinformation in check.

This is a standalone app, independent of the SmartTech Academy LMS in the parent repo.

## Quick start

```bash
npm install
npm run seed     # creates + seeds prisma/dev.db (idempotent)
npm run dev      # http://localhost:3100
```

Production build: `AUTH_SECRET=<random-value> npm run build && npm start`

## Demo accounts (password: `Password123!`)

| Role | Email |
|---|---|
| Member | thandiwe@herbalwisdom.africa |
| Member | kwame@herbalwisdom.africa |
| Member | amara@herbalwisdom.africa |
| Member | zola@herbalwisdom.africa |
| Admin | admin@herbalwisdom.africa |

The seed also includes one deliberately dangerous demo post ("Miracle Cure Root" claiming to cure
cancer instead of chemotherapy) that has already been flagged by a member — log in as the admin
and visit `/admin/moderation` to see the moderation queue and hide it.

## What's implemented

- **Public:** home feed of shared herb experiences, search/filter by herb name or condition.
- **Members:** register/login, post a remedy (herb, local name, condition, preparation, dosage,
  personal outcome), comment on posts, report (flag) posts or comments that look unsafe or
  misleading.
- **Admin:** moderation queue of open reports, with one-click hide (removes the content from public
  view while keeping it visible to the author and admins) or dismiss.
- **Safety:** a persistent site-wide disclaimer ("community testimony, not medical advice") plus a
  reminder on the post-creation form to write from personal experience rather than claim a cure.

## Architecture

- `prisma/schema.sql` — SQLite schema: `User`, `Remedy`, `Comment`, `Flag`
- `prisma/seed.mjs` — idempotent demo data
- `src/lib/db.ts` — libsql/SQLite query helpers (swap `DATABASE_URL` for Turso/libsql in production)
- `src/lib/auth.ts` — bcrypt password hashing + HMAC-signed session cookie
- `src/app` — pages and API route handlers (plain HTML forms posting to route handlers, no client
  JS required for the core flows)

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · libsql/SQLite (dev) · bcryptjs

## Ideas for next steps

- Photo uploads for remedy posts
- Per-herb pages aggregating all posts about that herb
- Multi-language support (many contributors will think in their home language first)
- Verified-practitioner badges, separate from personal testimony
- Rate limiting on posting/flagging (see the sibling app's `src/lib/rateLimit.ts` for a pattern)
