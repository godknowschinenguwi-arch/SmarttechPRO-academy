import { NextRequest, NextResponse } from 'next/server';
import { get, insert } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const org = await get<{ id: string }>('SELECT id FROM Organization WHERE ownerId = ?', [user.id]);
  if (!org) return NextResponse.json({ error: 'You do not manage an organization.' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

  const member = await get<{ id: string; name: string }>('SELECT id, name FROM User WHERE email = ?', [email]);
  if (!member) {
    return NextResponse.json({ error: 'No SmartTech Academy account found for that email — ask them to register first.' }, { status: 404 });
  }

  const alreadyMember = await get('SELECT id FROM OrganizationMember WHERE organizationId = ? AND userId = ?', [org.id, member.id]);
  if (alreadyMember) return NextResponse.json({ error: `${member.name} is already on your team.` }, { status: 400 });

  const id = await insert('OrganizationMember', { organizationId: org.id, userId: member.id, role: 'MEMBER' });
  return NextResponse.json({ ok: true, id, name: member.name });
}
