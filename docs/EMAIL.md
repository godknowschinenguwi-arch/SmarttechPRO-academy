# Transactional email — Resend

`src/lib/email.ts` sends welcome emails, password resets, certificate-ready
notices, and waitlist confirmations via [Resend](https://resend.com). Without
an API key it logs to the console instead of sending, so the app (including
password reset) keeps working before a real account exists.

## Setup

1. Sign up at resend.com (free tier: 3,000 emails/month).
2. Either verify your own sending domain (Domains → Add Domain, add the DNS
   records they give you), or start with their shared `onboarding@resend.dev`
   sender for testing — no domain verification needed.
3. Create an API key (API Keys → Create API Key).
4. Set:

```bash
RESEND_API_KEY="re_..."
EMAIL_FROM="SmartTech Academy <hello@smarttech.academy>"   # must match a verified domain, or use onboarding@resend.dev
```

Add these locally in `.env.local` and on your deploy host the same way
`AUTH_SECRET` is set.

## What sends today

- **Welcome email** — on registration (`/api/auth/register`).
- **Password reset link** — on `/forgot-password` (`/api/auth/forgot-password`), 1-hour expiry.
- **Certificate ready** — when a course reaches 100% completion and a certificate is auto-issued.
- **Waitlist confirmation** — when someone joins a "Coming Soon" course's waitlist.

All templates live in `src/lib/emailTemplates.ts` — plain inline-styled HTML,
since email clients don't support external stylesheets.
