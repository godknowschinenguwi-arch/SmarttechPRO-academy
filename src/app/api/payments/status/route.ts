import { NextRequest, NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { pollPaynow } from '@/lib/paynow';
import { activatePayment } from '@/lib/payments';

// Status check used by the return page. If still PENDING and a Paynow poll URL exists,
// polls Paynow server-side (fallback in case the webhook was delayed).
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const reference = req.nextUrl.searchParams.get('ref');
  if (!reference) return NextResponse.json({ error: 'Missing ref' }, { status: 400 });

  const payment = await get<any>(
    'SELECT reference, status, purpose, amountCents, provider, pollUrl, userId FROM Payment WHERE reference = ?', [reference]);
  if (!payment || payment.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (payment.status === 'PENDING' && payment.pollUrl) {
    try {
      const polled = await pollPaynow(payment.pollUrl);
      if (polled.paid) {
        await activatePayment(reference);
        payment.status = 'PAID';
      } else if (['cancelled', 'failed'].includes(polled.status.toLowerCase())) {
        await run("UPDATE Payment SET status = 'FAILED' WHERE reference = ?", [reference]);
        payment.status = 'FAILED';
      }
    } catch {
      // keep PENDING; client will re-poll
    }
  }

  return NextResponse.json({
    reference: payment.reference, status: payment.status,
    purpose: payment.purpose, amountCents: payment.amountCents, provider: payment.provider,
  });
}
