import { NextRequest, NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const flag = await get<{ id: string; targetType: 'REMEDY' | 'COMMENT'; targetId: string }>(
    'SELECT id, targetType, targetId FROM Flag WHERE id = ?',
    [params.id],
  );
  if (!flag) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const form = await req.formData();
  const action = String(form.get('action') ?? '');

  if (action === 'hide') {
    const table = flag.targetType === 'REMEDY' ? 'Remedy' : 'Comment';
    await run(`UPDATE ${table} SET status = 'HIDDEN' WHERE id = ?`, [flag.targetId]);
    await run(`UPDATE Flag SET status = 'RESOLVED' WHERE id = ?`, [flag.id]);
  } else if (action === 'dismiss') {
    await run(`UPDATE Flag SET status = 'DISMISSED' WHERE id = ?`, [flag.id]);
  }

  return NextResponse.redirect(new URL('/admin/moderation', req.url), 303);
}
