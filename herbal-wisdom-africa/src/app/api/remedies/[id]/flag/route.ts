import { NextRequest, NextResponse } from 'next/server';
import { get, insert } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url), 303);
  }

  const remedy = await get('SELECT id FROM Remedy WHERE id = ?', [params.id]);
  if (!remedy) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const form = await req.formData();
  const reason = String(form.get('reason') ?? '').trim() || 'No reason given';

  await insert('Flag', {
    targetType: 'REMEDY',
    targetId: params.id,
    reporterId: user.id,
    reason,
    status: 'OPEN',
  });

  return NextResponse.redirect(
    new URL(`/remedies/${params.id}?reported=1`, req.url),
    303,
  );
}
