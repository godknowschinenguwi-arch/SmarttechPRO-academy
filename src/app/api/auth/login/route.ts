import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { get, insert, run } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });

  const user = await get<any>('SELECT id, passwordHash, role FROM User WHERE email = ?', [String(email).toLowerCase()]);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }
  await run("UPDATE User SET lastActiveAt = datetime('now') WHERE id = ?", [user.id]);
  await insert('AuditLog', { userId: user.id, action: 'LOGIN' });
  setSessionCookie(user.id);
  return NextResponse.json({ ok: true, role: user.role });
}
