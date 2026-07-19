// Session auth: HMAC-signed cookie (swap for NextAuth/Clerk in production if preferred).
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { get } from './db';

const SECRET = process.env.AUTH_SECRET || 'dev-secret';
const COOKIE = 'sta_session';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  xp: number;
  level: number;
  streakDays: number;
  city: string | null;
};

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function createToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + 30 * 86400000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp < Date.now()) return null;
    return data.uid as string;
  } catch {
    return null;
  }
}

export async function currentUser(): Promise<SessionUser | null> {
  const uid = verifyToken(cookies().get(COOKIE)?.value);
  if (!uid) return null;
  return get<SessionUser>('SELECT id, email, name, role, xp, level, streakDays, city FROM User WHERE id = ?', [uid]);
}

export function setSessionCookie(userId: string) {
  cookies().set(COOKIE, createToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 86400,
    path: '/',
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE);
}
