import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { get, run } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const limited = rateLimit(`reset-password:${clientIp(req)}`, 10, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many attempts. Please try again shortly.' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } });
  }

  const { token, password } = await req.json().catch(() => ({}));
  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: 'A valid token and a password of at least 8 characters are required.' }, { status: 400 });
  }

  const tokenHash = createHash('sha256').update(String(token)).digest('hex');
  const record = await get<any>(
    "SELECT * FROM PasswordResetToken WHERE tokenHash = ? AND usedAt IS NULL AND expiresAt > datetime('now')",
    [tokenHash]);
  if (!record) return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  await run('UPDATE User SET passwordHash = ? WHERE id = ?', [passwordHash, record.userId]);
  await run("UPDATE PasswordResetToken SET usedAt = datetime('now') WHERE userId = ? AND usedAt IS NULL", [record.userId]);

  setSessionCookie(record.userId);
  return NextResponse.json({ ok: true });
}
