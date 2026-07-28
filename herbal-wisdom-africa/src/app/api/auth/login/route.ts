import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { get } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');

  const user = await get<{ id: string; passwordHash: string }>(
    'SELECT id, passwordHash FROM User WHERE email = ?',
    [email],
  );

  const invalid = () =>
    NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Invalid email or password.')}`, req.url),
      303,
    );

  if (!user) return invalid();
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return invalid();

  setSessionCookie(user.id);
  return NextResponse.redirect(new URL('/', req.url), 303);
}
