import { NextRequest, NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { paynowLive, verifyPaynowHash } from '@/lib/paynow';
import { activatePayment } from '@/lib/payments';

// Paynow result URL (server-to-server). LIVE: urlencoded body + SHA512 hash verification.
// SANDBOX (no Paynow keys): accepts JSON { reference, status } from the built-in mock gateway ONLY.
export async function POST(req: NextRequest) {
  let reference: string | undefined;
  let statusRaw: string | undefined;

  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    if (paynowLive) return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    reference = body.reference;
    statusRaw = body.status;
  } else {
    const params = Object.fromEntries(new URLSearchParams(await req.text())) as Record<string, string>;
    if (!verifyPaynowHash(params)) {
      return NextResponse.json({ error: 'Hash verification failed' }, { status: 401 });
    }
    reference = params.reference;
    statusRaw = params.status;
  }

  if (!reference || !statusRaw) return NextResponse.json({ error: 'Missing reference/status' }, { status: 400 });

  const payment = await get<any>('SELECT * FROM Payment WHERE reference = ?', [reference]);
  if (!payment) return NextResponse.json({ error: 'Unknown reference' }, { status: 404 });

  const status = statusRaw.toLowerCase();
  if (status === 'paid' || status === 'awaiting delivery' || status === 'delivered') {
    const result = await activatePayment(reference);
    return NextResponse.json({ ok: result.ok });
  }
  if (status === 'cancelled' || status === 'failed') {
    if (payment.status === 'PENDING') {
      await run("UPDATE Payment SET status = 'FAILED' WHERE reference = ?", [reference]);
    }
    return NextResponse.json({ ok: true });
  }
  // Created / Sent / other intermediate statuses — acknowledge, no state change.
  return NextResponse.json({ ok: true });
}
