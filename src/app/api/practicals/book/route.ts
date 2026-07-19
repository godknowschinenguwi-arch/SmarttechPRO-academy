import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { get, insert, run } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { initiatePaynow } from '@/lib/paynow';
import { activatePayment } from '@/lib/payments';

// Booking checkout: PENDING payment → gateway → webhook confirms → seat booked + slip issued.
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });

  const { sessionId, provider = 'PAYNOW' } = await req.json().catch(() => ({}));
  const session = await get<any>(
    `SELECT p.*, c.title AS courseTitle,
       (SELECT COUNT(*) FROM PracticalBooking b WHERE b.sessionId = p.id AND b.status != 'CANCELLED') AS booked
     FROM PracticalSession p JOIN Course c ON c.id = p.courseId WHERE p.id = ?`, [sessionId]);
  if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  if (session.booked >= session.capacity) return NextResponse.json({ error: 'This session is fully booked.' }, { status: 409 });

  const existing = await get('SELECT id FROM PracticalBooking WHERE sessionId = ? AND userId = ?', [sessionId, user.id]);
  if (existing) return NextResponse.json({ ok: true, already: true });

  const reference = `STA-PAY-${randomUUID().slice(0, 12).toUpperCase()}`;
  await insert('Payment', {
    userId: user.id, amountCents: session.priceCents, provider, purpose: 'PRACTICAL',
    reference, status: 'PENDING', meta: JSON.stringify({ sessionId }),
  });

  if (session.priceCents === 0) {
    await activatePayment(reference);
    return NextResponse.json({ ok: true, free: true });
  }

  try {
    const gw = await initiatePaynow({
      reference, amountUsdCents: session.priceCents, email: user.email,
      description: `Practical session — ${session.courseTitle} (${session.city})`,
    });
    if (gw.pollUrl) await run('UPDATE Payment SET pollUrl = ? WHERE reference = ?', [gw.pollUrl, reference]);
    return NextResponse.json({ ok: true, redirectUrl: gw.redirectUrl, reference, mode: gw.mode });
  } catch (e: any) {
    await run("UPDATE Payment SET status = 'FAILED' WHERE reference = ?", [reference]);
    return NextResponse.json({ error: `Payment gateway error: ${e.message}` }, { status: 502 });
  }
}
