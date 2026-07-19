# SmartTech Academy — Technical Blueprint

**Building Africa's Next Generation of Skilled Technicians**

This document is the production blueprint for SmartTech Academy: information architecture, user flows, data model, API design, payments, certificates, file storage, deployment, scalability and security. The repository contains a fully working reference implementation of the core product (Next.js + SQLite/libsql); this blueprint describes both what is built and how it scales to thousands of concurrent students in production.

---

## 1. Information Architecture

```
Public
├── / ......................... Homepage (hero, categories, featured, testimonials, partners)
├── /courses .................. Catalogue with category filters
├── /courses/[slug] ........... Course detail (overview, curriculum, instructor, reviews, practicals)
├── /practicals ............... Practical session listing + booking (filter by city)
├── /verify, /verify/[serial] . Public certificate verification (QR target)
├── /login, /register ......... Auth

Authenticated — Student
├── /dashboard ................ Progress, streak, XP, certificates, bookings, badges, announcements
├── /learn/[slug]/[lessonId] .. Lesson player (video, notes, downloads, quiz, assignment, discussion)

Authenticated — Instructor
├── /instructor ............... Studio: courses, enrollments, ratings, revenue, grading queue, course builder

Authenticated — Admin
└── /admin .................... Console: KPIs, payments, practical schedules, management modules
```

Roles: `GUEST → STUDENT → INSTRUCTOR → ADMIN` (role-based access enforced server-side on every page and API route).

## 2. Key User Flows

**Purchase & learn:** Browse → course detail → Enroll (choose EcoCash / PayNow / Stripe / PayPal / Mukuru / bank; optional coupon) → payment confirmed (webhook) → enrollment activated → lesson player → mark lessons complete (+25 XP) → quizzes auto-graded → 100% completion auto-issues certificate + notification.

**Practical training:** Student views sessions → filters by city → books seat → pays remaining balance → receives confirmation + attendance slip code → instructor marks attendance on the day → records assessment score → practical certificate issued.

**Certification & verification:** Certificate issued with unique serial `STA-YYYY-NNNNNN` → PDF render with QR pointing at `/verify/[serial]` → employer scans QR → public verification page confirms student, course, hours, instructor, date.

**Instructor authoring:** Create course → drag-and-drop modules/lessons → upload video/PPTX/PDF per lesson (lessons are content-agnostic; videos can be attached later without restructuring) → attach quiz/assignment → set price + prerequisites → preview as student → publish.

## 3. Database Schema

Canonical schema: [`prisma/schema.prisma`](../prisma/schema.prisma) (27 models). The dev runtime uses the mirrored SQLite DDL in [`prisma/schema.sql`](../prisma/schema.sql); production should run Postgres via Prisma (`provider = "postgresql"`, then `prisma db push`).

Core entity groups:

- **Identity:** `User` (role, XP, level, streak), `AuditLog`
- **Catalog:** `Category → Course → Module → Lesson → LessonAttachment` — the modular hierarchy that lets new academies (Solar, Fiber, PLC, Jetson AI…) plug in without core changes
- **Learning:** `Enrollment`, `LessonProgress` (completion, resume position, bookmarks)
- **Assessment:** `Quiz → Question` (MCQ, true/false, fill-blank, image, drag-drop) → `QuizAttempt`; `Assignment → Submission` (file/photo/video, instructor grading)
- **Practical:** `PracticalSession` (city, venue, capacity, price) → `PracticalBooking` (status, attendance, assessment score, slip code)
- **Commerce:** `Payment` (provider, purpose, status, reference), `Coupon`
- **Certification:** `Certificate` (serial, kind COURSE|PRACTICAL, hours)
- **Community:** `ForumThread → ForumPost`, `Message`, `Notification`
- **Gamification:** `Badge → UserBadge`, `Favorite`

Design principles: every price stored in **USD cents** (display converts per currency); JSON columns for flexible lists (objectives, quiz options); soft state machines via status strings (`PENDING_PAYMENT → CONFIRMED → ATTENDED`); unique constraints on natural keys (`userId+courseId`, `sessionId+userId`, certificate serial).

## 4. API Structure

Implemented (Next.js route handlers, JSON):

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/register` | POST | Create account, hash password (bcrypt), set session cookie |
| `/api/auth/login` | POST | Verify credentials, audit log, session cookie |
| `/api/auth/logout` | POST | Clear session |
| `/api/enroll` | POST | Enroll in course (coupon support, payment record, notification) |
| `/api/progress` | POST | Mark lesson complete, award XP, recompute %, auto-issue certificate at 100% |
| `/api/quiz/submit` | POST | Auto-grade attempt, XP, Quiz Ace badge at 100%, result notification |
| `/api/practicals/book` | POST | Capacity check, balance payment, booking + slip code |

Production expansion (same pattern): `/api/courses` CRUD (instructor), `/api/submissions` + grading, `/api/messages`, `/api/forum`, `/api/admin/*` (users, coupons, reports), `/api/webhooks/{stripe,paypal,paynow}`. For scale, keep read-heavy pages as server components hitting read replicas, and mutations behind rate-limited route handlers. Versioning via `/api/v1/*` when the mobile app lands.

## 5. Frontend Component Hierarchy

```
RootLayout (CurrencyProvider, Navbar[user], Footer)
├── Design system (globals.css): btn-primary/accent/ghost, card, chip, input, h-display
│   Tokens: brand (blue 50–950), accent (orange), ink, surface · Inter + Sora · shadow-card/lift
├── Shared: CourseCard, Stars, ProgressRing, Price/CurrencySwitcher (client ctx)
├── Learning: VideoPlayer (speed/quality/CC/PiP/watermark), QuizPlayer (auto-grade UI),
│   CompleteLessonButton, EnrollButton (provider picker + coupon), BookSessionButton
└── Pages compose these (server components fetch, client islands mutate)
```

Mobile-first: all layouts collapse to single column; the nav has a full mobile menu; touch-sized controls; system fonts fall back if Google Fonts unavailable.

## 6. Backend Architecture

Reference implementation: **Next.js App Router monolith** — server components read the DB directly (no API hop), client islands call route handlers for mutations. This is the right shape until ~50–100k MAU.

Production evolution path:

1. **Now:** Next.js on Vercel/Fly/Render + managed Postgres (Neon/Supabase/RDS) + Prisma.
2. **Growth:** extract async workers (BullMQ/SQS) for video transcoding hooks, certificate PDF generation, email/push fan-out; Redis for sessions, rate limits, leaderboards.
3. **Scale:** read replicas; move video entirely to a streaming provider (Mux/Cloudflare Stream); CDN-cache public catalogue pages (ISR); optionally split `payments` and `notifications` services.

## 7. Authentication & Authorization

- Sessions: HMAC-signed httpOnly cookie (30-day, `SameSite=Lax`, `Secure` in prod). Swap-in ready for NextAuth/Clerk if OAuth (Google/Facebook) is wanted.
- Passwords: bcrypt (cost 10+). Add rate limiting (Redis) + optional TOTP 2FA for instructors/admins.
- Authorization: role checked server-side in every protected page (`currentUser()` + redirect) and route handler; enrollment checked before serving lesson content; free-preview lessons exempt.
- Audit: `AuditLog` rows on register/login/enroll — extend to grading, refunds, admin actions.

## 8. File Storage Strategy

| Asset | Store | Delivery |
|---|---|---|
| Lesson videos | S3-compatible (R2/S3) → transcode via Mux/Cloudflare Stream | HLS adaptive streaming, **signed URLs**, per-user watermark overlay |
| PPTX / PDF / templates | R2/S3 private bucket | Short-lived signed download URLs, permission-checked per enrollment |
| Student submissions (photos/videos) | R2/S3 private | Direct-to-bucket presigned uploads (never through the app server) |
| Certificates | Generated PDFs cached in R2/S3 | Public via serial-keyed URL + verification page |
| Course images / avatars | R2/S3 public + CDN | Next/Image optimization |

Offline mobile downloads: encrypted local storage with license check on app open (Expo/React Native module).

## 9. Payment Integration Plan

All providers follow one pattern: **create `Payment` (PENDING) → redirect/prompt → webhook/IPN confirms → mark PAID → activate entitlement (enrollment/booking) → notify**. Never trust the client redirect; only webhooks flip status.

- **Stripe** — cards, Payment Intents + webhook `payment_intent.succeeded`. Also powers **installments** via subscription schedules.
- **PayPal** — Orders API + capture webhook.
- **Paynow (Zimbabwe)** — hosted checkout; poll/IPN for EcoCash & card rails locally.
- **EcoCash direct** — USSD push via EcoCash Open API where available; otherwise via Paynow.
- **Mukuru / Bank transfer** — reference-number flow: system issues reference, admin (or bank feed) reconciles, entitlement activates on match. Corporate invoicing shares this flow with net-30 terms.
- **Coupons** — percent-off validated server-side (active, max uses, expiry) — implemented.
- Store provider + external reference on every `Payment` for reconciliation; nightly job flags PENDING > 24h.

## 10. Certificate Generation Workflow

1. Trigger: course progress hits 100% (implemented) or instructor records passed practical assessment.
2. Serial allocated: `STA-{year}-{sequence}`, unique-constrained.
3. Worker renders PDF (react-pdf/Playwright print) from the certificate template: student, course, instructor, hours, date, serial, **QR code → `/verify/[serial]`**.
4. PDF stored; `CERT_READY` notification + email sent.
5. Public verification page (implemented) shows validity, holder, course, hours, type (course vs practical endorsement).

## 11. Deployment Architecture

```
Users ─ CDN (Cloudflare) ─ Next.js app (Vercel / Fly.io, 2+ regions)
                     │            │
        Cloudflare Stream/Mux   Postgres (Neon/RDS, primary + read replica)
        R2/S3 (files)           Redis (sessions, queues, rate limits)
                                Workers (certs, emails, transcode hooks)
                                Webhooks: Stripe / PayPal / Paynow
```

Environments: dev (SQLite, this repo, zero-config) → staging → prod (Postgres). CI: lint + typecheck + build + seed smoke tests on every PR. Migrations via Prisma Migrate. Infra as code (Terraform) once the team grows.

## 12. Scalability Considerations

- Catalogue and course pages are cacheable (ISR/CDN) — the highest-traffic surface costs ~0 DB reads.
- Lesson progress writes are tiny row upserts; at 10k concurrent learners this is trivial for Postgres. Batch XP/leaderboard updates through Redis.
- Video bandwidth is the real cost: offload 100% to a streaming CDN from day one.
- Multi-academy expansion (Alarm, Fence, Fiber, PLC, Jetson AI, IoT…) is pure data: new `Category` + `Course` rows — no schema or code changes (demonstrated by the 8 seeded categories).
- Localization-ready: currency layer is already multi-currency (USD/ZAR/ZWG); add i18n dictionaries when needed.

## 13. Security Recommendations

- HTTPS everywhere; HSTS; `Secure`/`HttpOnly`/`SameSite` cookies (implemented pattern).
- Parameterized SQL only (implemented); Prisma in prod adds typed queries.
- Rate-limit auth + payment endpoints; lockout after failed logins; CAPTCHA on register.
- Signed, expiring URLs for all paid content; watermarked video (user email overlay — implemented in player).
- Role checks server-side on every route (implemented); never trust client role claims.
- Webhook signature verification for every payment provider.
- PII: encrypt at rest (Postgres TDE / column-level for phone numbers), data-retention policy, POPIA (ZA) / Zimbabwe Data Protection Act compliance review.
- Audit logs for all admin/grading/financial actions (foundation implemented).
- Backups: nightly DB snapshots + point-in-time recovery; quarterly restore drills.

## 14. What's in this repo vs. production swap-list

| Area | Reference implementation (works today) | Production swap |
|---|---|---|
| DB | SQLite via libsql | Postgres + Prisma (schema ready) |
| Payments | Instant demo checkout | Provider redirects + webhooks (§9) |
| Video | Player shell with watermark | Mux/Cloudflare Stream HLS |
| Files | Static placeholders | R2/S3 signed URLs |
| Email/push | In-app notifications only | Resend/SES + FCM |
| Certs | DB + verification page | + PDF worker + QR image |
