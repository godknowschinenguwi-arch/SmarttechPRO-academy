import { NextRequest, NextResponse } from 'next/server';
import { runAffecting } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const changed = await runAffecting(
    "UPDATE Lead SET status = 'CLAIMED', claimedByUserId = ?, claimedAt = datetime('now') WHERE id = ? AND status = 'NEW'",
    [user.id, params.id]
  );

  if (changed === 0) {
    return NextResponse.json({ error: 'This lead has already been claimed by someone else.' }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
