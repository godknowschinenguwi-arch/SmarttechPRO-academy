import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { get, insert, run } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { initiatePaynow } from '@/lib/paynow';
import { activatePayment } from '@/lib/payments';

// Checkout: creates a PENDING payment and returns the gateway redirect URL.
// The webhook (/api/webhooks/paynow) confirms payment and activates the enrollment.
// Free (fully-discounted) orders activate immediately.
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });

  const { courseSlug, provider = 'PAYNOW', coupon } = await req.json().catch(() => ({}));
  const course = await get<any>('SELECT id, title, priceCents, comingSoon FROM Course WHERE slug = ? AND isPublished = 1', [courseSlug]);
  if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
  if (course.comingSoon) return NextResponse.json({ error: 'This course is coming soon and not yet open for enrollment.' }, { status: 400 });

  const existing = await get('SELECT id FROM Enrollment WHERE userId = ? AND courseId = ?', [user.id, course.id]);
  if (existing) return NextResponse.json({ ok: true, already: true });

  let amount = course.priceCents;
  let appliedCoupon: string | null = null;
  if (coupon) {
    const c = await get<any>(
      "SELECT * FROM Coupon WHERE code = ? AND active = 1 AND usedCount < maxUses AND (expiresAt IS NULL OR expiresAt > datetime('now'))",
      [String(coupon).toUpperCase()]);
    if (!c) return NextResponse.json({ error: 'That coupon code is invalid or expired.' }, { status: 400 });
    amount = Math.round(amount * (1 - c.percentOff / 100));
    appliedCoupon = c.code;
    await run('UPDATE Coupon SET usedCount = usedCount + 1 WHERE id = ?', [c.id]);
  }

  const reference = `STA-PAY-${randomUUID().slice(0, 12).toUpperCase()}`;
  await insert('Payment', {
    userId: user.id, amountCents: amount, provider, purpose: 'COURSE',
    reference, status: 'PENDING', couponCode: appliedCoupon,
    meta: JSON.stringify({ courseId: course.id }),
  });

  if (amount === 0) {
    await activatePayment(reference);
    return NextResponse.json({ ok: true, free: true });
  }

  try {
    const gw = await initiatePaynow({
      reference, amountUsdCents: amount, email: user.email,
      description: `SmartTech Academy — ${course.title}`,
    });
    if (gw.pollUrl) await run('UPDATE Payment SET pollUrl = ? WHERE reference = ?', [gw.pollUrl, reference]);
    return NextResponse.json({ ok: true, redirectUrl: gw.redirectUrl, reference, mode: gw.mode });
  } catch (e: any) {
    await run("UPDATE Payment SET status = 'FAILED' WHERE reference = ?", [reference]);
    return NextResponse.json({ error: `Payment gateway error: ${e.message}` }, { status: 502 });
  }
}
