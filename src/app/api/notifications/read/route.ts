import { NextRequest, NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { currentUser } from '@/lib/auth';

// Marks one notification (by id) or all of the caller's notifications as read.
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });

  const { id, all } = await req.json().catch(() => ({}));
  if (all) {
    await run(`UPDATE Notification SET readAt = datetime('now') WHERE userId = ? AND readAt IS NULL`, [user.id]);
    return NextResponse.json({ ok: true });
  }
  if (!id) return NextResponse.json({ error: 'Missing notification id.' }, { status: 400 });
  await run(`UPDATE Notification SET readAt = datetime('now') WHERE id = ? AND userId = ?`, [id, user.id]);
  return NextResponse.json({ ok: true });
}
