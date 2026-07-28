import { NextRequest, NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const design = await get<{ id: string }>('SELECT id FROM CctvDesign WHERE id = ? AND userId = ?', [params.id, user.id]);
  if (!design) return NextResponse.json({ error: 'Design not found' }, { status: 404 });

  await run('DELETE FROM CctvDesign WHERE id = ? AND userId = ?', [params.id, user.id]);
  return NextResponse.json({ ok: true });
}
