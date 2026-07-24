import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { get, insert } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { sendEmail } from '@/lib/email';
import { passwordResetEmail } from '@/lib/emailTemplates';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Matches SQLite's own `datetime('now')` format (space-separated, no ms/timezone
// suffix) — a JS Date's .toISOString() ('T' separator) would sort incorrectly
// against datetime('now') within the same calendar day.
function sqliteDatetime(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// Always responds ok:true, whether or not the email exists — avoids leaking
// which addresses have accounts.
export async function POST(req: NextRequest) {
  const limited = rateLimit(`forgot-password:${clientIp(req)}`, 5, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } });
  }

  const { email } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

  const user = await get<any>('SELECT id FROM User WHERE email = ?', [String(email).toLowerCase()]);
  if (user) {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = sqliteDatetime(new Date(Date.now() + 60 * 60_000));
    await insert('PasswordResetToken', { userId: user.id, tokenHash, expiresAt });

    const resetUrl = `${APP_URL}/reset-password/${rawToken}`;
    const { subject, html } = passwordResetEmail(resetUrl);
    await sendEmail({ to: email, subject, html });
  }

  return NextResponse.json({ ok: true });
}
