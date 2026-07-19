# SmartTech Academy

**Building Africa's Next Generation of Skilled Technicians** — a professional vocational LMS for technical trades: learn online, practise hands-on, get certified.

A working Next.js 14 application with a complete data model, role-based auth, seeded demo content (full 13-module CCTV Installation Technician course + 6 more courses across 8 categories), quizzes with auto-grading, practical session booking, certificates with public QR-style verification, gamification (XP, badges, streaks), and multi-currency pricing (USD / ZAR / ZWG).

## Quick start

```bash
npm install
npm run seed     # creates + seeds prisma/dev.db (idempotent)
npm run dev      # http://localhost:3000
```

Production build: `npm run build && npm start`

## Demo accounts (password: `Password123!`)

| Role | Email |
|---|---|
| Student | student@smarttech.academy |
| Instructor | tapiwa@smarttech.academy |
| Admin | admin@smarttech.academy |

Try: enroll in a course with coupon `LAUNCH25`, take the *Quiz: Fundamentals* in the CCTV course, book a practical session in Bulawayo, verify certificate `STA-2026-000117` at `/verify`.

## What's implemented

- **Public:** premium homepage (hero, categories, featured courses, success stories, partners), course catalogue with filters, rich course detail pages (curriculum accordion, instructor, reviews, practical sessions), certificate verification.
- **Student:** dashboard (progress ring, streak, XP/level, KPIs, certificates, bookings + slip codes, badges, announcements, recommendations), lesson player (video shell with speed/quality/CC/PiP/watermark, notes, downloads, discussion), auto-graded quizzes, enrollment with 6 payment providers + coupons, practical booking.
- **Instructor:** studio with course table (students, ratings, completions, revenue), grading queue, course-builder overview.
- **Admin:** console with platform KPIs, revenue, payments feed, practical schedule capacity.
- **APIs:** register/login/logout, enroll, lesson progress (auto-issues certificates at 100%), quiz submission (auto-grade + badges), practical booking (capacity + payment + slip).

## Architecture

Read **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — information architecture, user flows, database schema, API design, payments (Stripe/PayPal/Paynow/EcoCash/Mukuru), file storage, certificate workflow, deployment, scalability and security.

- `prisma/schema.prisma` — canonical data model (27 models; switch provider to Postgres for production)
- `prisma/schema.sql` + `prisma/seed.mjs` — SQLite runtime schema + demo seed
- `src/lib` — db layer, auth (HMAC session cookies), currency, typed queries
- `src/components` — design system components (blue/orange/white brand, Inter + Sora)
- `src/app` — pages and API route handlers

## Tech stack

Next.js 14 (App Router, server components) · TypeScript · Tailwind CSS · libsql/SQLite (dev) → Postgres + Prisma (prod) · bcryptjs
