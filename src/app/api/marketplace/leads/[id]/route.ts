import { NextRequest, NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { currentUser } from '@/lib/auth';

const STATUSES = ['CLAIMED', 'CONTACTED', 'CONVERTED', 'CLOSED'];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (typeof status !== 'string' || !STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const lead = await get<{ claimedByUserId: string | null }>('SELECT claimedByUserId FROM Lead WHERE id = ?', [params.id]);
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  if (lead.claimedByUserId !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await run('UPDATE Lead SET status = ? WHERE id = ?', [status, params.id]);
  return NextResponse.json({ ok: true });
}
