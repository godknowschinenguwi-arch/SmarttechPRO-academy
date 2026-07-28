import { NextRequest, NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const org = await get<{ id: string }>('SELECT id FROM Organization WHERE ownerId = ?', [user.id]);
  if (!org) return NextResponse.json({ error: 'You do not manage an organization.' }, { status: 403 });

  const member = await get<{ role: string }>('SELECT role FROM OrganizationMember WHERE id = ? AND organizationId = ?', [params.id, org.id]);
  if (!member) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
  if (member.role === 'OWNER') return NextResponse.json({ error: 'You cannot remove the organization owner.' }, { status: 400 });

  await run('DELETE FROM OrganizationMember WHERE id = ?', [params.id]);
  return NextResponse.json({ ok: true });
}
