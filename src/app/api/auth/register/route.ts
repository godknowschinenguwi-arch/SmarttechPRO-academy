import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { get, insert } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { name, email, password, city } = await req.json().catch(() => ({}));
  if (!name || !email || !password || password.length < 8) {
    return NextResponse.json({ error: 'Name, email and a password of at least 8 characters are required.' }, { status: 400 });
  }
  const existing = await get('SELECT id FROM User WHERE email = ?', [String(email).toLowerCase()]);
  if (existing) return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const id = await insert('User', {
    name, email: String(email).toLowerCase(), passwordHash, role: 'STUDENT', city: city || null,
  });
  await insert('AuditLog', { userId: id, action: 'REGISTER', detail: email });
  await insert('Notification', {
    userId: id, kind: 'COURSE_UPDATE', title: 'Welcome to SmartTech Academy 🎉',
    body: 'Browse the catalogue and start your first course today.', href: '/courses',
  });
  setSessionCookie(id);
  return NextResponse.json({ ok: true });
}
