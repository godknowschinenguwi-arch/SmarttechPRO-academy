import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { get, run } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { sendEmail } from '@/lib/email';
import { waitlistConfirmationEmail } from '@/lib/emailTemplates';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const limited = rateLimit(`waitlist:${clientIp(req)}`, 10, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } });
  }

  const { courseSlug, email } = await req.json().catch(() => ({}));
  if (!email || !EMAIL_RE.test(String(email))) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
  }

  const course = await get<any>('SELECT id, title, comingSoon FROM Course WHERE slug = ?', [courseSlug]);
  if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
  if (!course.comingSoon) return NextResponse.json({ error: 'This course is already open for enrollment.' }, { status: 400 });

  const normalizedEmail = String(email).toLowerCase();
  await run(
    'INSERT OR IGNORE INTO Waitlist (id, email, courseId) VALUES (?, ?, ?)',
    [randomUUID(), normalizedEmail, course.id]);

  const { subject, html } = waitlistConfirmationEmail(course.title);
  await sendEmail({ to: normalizedEmail, subject, html });

  return NextResponse.json({ ok: true });
}
