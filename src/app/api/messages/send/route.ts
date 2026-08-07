import { NextRequest, NextResponse } from 'next/server';
import { get, insert } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { getMessageableUserIds } from '@/lib/queries';

// Sends a direct message. Recipient must be someone the sender shares a
// course with (student <-> their instructor), already has message history
// with, or is an admin — see getMessageableUserIds for the exact rule.
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });

  const { recipientId, body } = await req.json().catch(() => ({}));
  const text = String(body ?? '').trim();
  if (!recipientId || !text) return NextResponse.json({ error: 'Message needs a recipient and text.' }, { status: 400 });
  if (text.length > 4000) return NextResponse.json({ error: 'Message is too long.' }, { status: 400 });
  if (recipientId === user.id) return NextResponse.json({ error: "You can't message yourself." }, { status: 400 });

  const recipient = await get<any>('SELECT id, name FROM User WHERE id = ?', [recipientId]);
  if (!recipient) return NextResponse.json({ error: 'Recipient not found.' }, { status: 404 });

  const allowed = await getMessageableUserIds(user.id, user.role);
  if (!allowed.has(recipientId)) {
    return NextResponse.json({ error: "You can only message people you share a course with." }, { status: 403 });
  }

  await insert('Message', { senderId: user.id, recipientId, body: text });
  await insert('Notification', {
    userId: recipientId, kind: 'MESSAGE', title: `New message from ${user.name}`,
    body: text.length > 140 ? `${text.slice(0, 140)}…` : text, href: `/messages/${user.id}`,
  });

  return NextResponse.json({ ok: true });
}
