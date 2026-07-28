import { NextRequest, NextResponse } from 'next/server';
import { get, insert } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await get('SELECT id FROM Organization WHERE ownerId = ?', [user.id]);
  if (existing) return NextResponse.json({ error: 'You already manage an organization.' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
  if (!name) return NextResponse.json({ error: 'Organization name is required.' }, { status: 400 });

  const id = await insert('Organization', { name, ownerId: user.id });
  await insert('OrganizationMember', { organizationId: id, userId: user.id, role: 'OWNER' });

  return NextResponse.json({ ok: true, id });
}
