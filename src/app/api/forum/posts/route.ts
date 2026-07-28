import { NextRequest, NextResponse } from 'next/server';
import { get, insert, run } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });

  const limited = rateLimit(`forum-post:${user.id}`, 20, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many posts, please slow down.' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } });
  }

  const body = await req.json().catch(() => ({}));
  const courseId = typeof body.courseId === 'string' ? body.courseId : '';
  const text = typeof body.body === 'string' ? body.body.trim().slice(0, 2000) : '';
  if (!courseId || !text) return NextResponse.json({ error: 'A message is required.' }, { status: 400 });

  const course = await get<{ id: string }>('SELECT id FROM Course WHERE id = ?', [courseId]);
  if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });

  let thread = await get<{ id: string }>('SELECT id FROM ForumThread WHERE courseId = ? ORDER BY createdAt ASC LIMIT 1', [courseId]);
  if (!thread) {
    const threadId = await insert('ForumThread', { courseId, title: 'Course Discussion' });
    thread = { id: threadId };
  }

  const postId = await insert('ForumPost', { threadId: thread.id, userId: user.id, body: text });
  await run('UPDATE User SET xp = xp + 5 WHERE id = ?', [user.id]);

  return NextResponse.json({
    ok: true,
    post: { id: postId, body: text, likes: 0, isAnswer: false, userName: user.name, role: user.role, createdAt: new Date().toISOString() },
  });
}
