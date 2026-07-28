import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { get, insert } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const name = String(form.get('name') ?? '').trim();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const country = String(form.get('country') ?? '').trim() || null;
  const password = String(form.get('password') ?? '');

  if (!name || !email || password.length < 8) {
    return NextResponse.redirect(
      new URL(`/register?error=${encodeURIComponent('Please fill in all fields; password needs at least 8 characters.')}`, req.url),
      303,
    );
  }

  const existing = await get('SELECT id FROM User WHERE email = ?', [email]);
  if (existing) {
    return NextResponse.redirect(
      new URL(`/register?error=${encodeURIComponent('An account with that email already exists.')}`, req.url),
      303,
    );
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const userId = await insert('User', { email, name, passwordHash, role: 'MEMBER', country });

  setSessionCookie(userId);
  return NextResponse.redirect(new URL('/', req.url), 303);
}
