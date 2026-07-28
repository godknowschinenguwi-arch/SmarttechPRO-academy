import { NextRequest, NextResponse } from 'next/server';
import { get, insert } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url), 303);
  }

  const comment = await get<{ id: string; remedyId: string }>(
    'SELECT id, remedyId FROM Comment WHERE id = ?',
    [params.id],
  );
  if (!comment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const form = await req.formData();
  const reason = String(form.get('reason') ?? '').trim() || 'No reason given';

  await insert('Flag', {
    targetType: 'COMMENT',
    targetId: params.id,
    reporterId: user.id,
    reason,
    status: 'OPEN',
  });

  return NextResponse.redirect(new URL(`/remedies/${comment.remedyId}?reported=1`, req.url), 303);
}
