import { NextRequest, NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { requireAdmin } from '@/lib/solar/adminCatalog';

const STATUSES = ['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (typeof status !== 'string' || !STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  await run('UPDATE SolarLead SET status = ? WHERE id = ?', [status, params.id]);
  return NextResponse.json({ ok: true });
}
