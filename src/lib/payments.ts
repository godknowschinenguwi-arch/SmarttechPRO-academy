// Entitlement activation — the ONLY place a payment unlocks product access.
// Called by the payment webhook (and poll fallback). Idempotent.
import { get, insert, run } from './db';
import { randomUUID } from 'crypto';

export type ActivationResult =
  | { ok: true; already?: boolean; kind: 'COURSE' | 'PRACTICAL' | 'NONE' }
  | { ok: false; error: string };

export async function activatePayment(reference: string): Promise<ActivationResult> {
  const payment = await get<any>('SELECT * FROM Payment WHERE reference = ?', [reference]);
  if (!payment) return { ok: false, error: 'Payment not found' };
  if (payment.status === 'PAID') return { ok: true, already: true, kind: 'NONE' };

  await run("UPDATE Payment SET status = 'PAID' WHERE id = ?", [payment.id]);
  const meta = payment.meta ? JSON.parse(payment.meta) : {};

  if (payment.purpose === 'COURSE' && meta.courseId) {
    const existing = await get('SELECT id FROM Enrollment WHERE userId = ? AND courseId = ?', [payment.userId, meta.courseId]);
    if (!existing) {
      await insert('Enrollment', { userId: payment.userId, courseId: meta.courseId });
      const course = await get<any>('SELECT title, slug FROM Course WHERE id = ?', [meta.courseId]);
      await insert('Notification', {
        userId: payment.userId, kind: 'PAYMENT', title: 'Enrollment confirmed ✅',
        body: `Payment received — you now have full access to “${course?.title}”.`,
        href: course ? `/courses/${course.slug}` : '/dashboard',
      });
      await insert('AuditLog', { userId: payment.userId, action: 'ENROLL_PAID', detail: reference });
    }
    return { ok: true, kind: 'COURSE' };
  }

  if (payment.purpose === 'PRACTICAL' && meta.sessionId) {
    const session = await get<any>(
      `SELECT p.*, c.title AS courseTitle,
         (SELECT COUNT(*) FROM PracticalBooking b WHERE b.sessionId = p.id AND b.status != 'CANCELLED') AS booked
       FROM PracticalSession p JOIN Course c ON c.id = p.courseId WHERE p.id = ?`, [meta.sessionId]);
    if (!session) return { ok: false, error: 'Session not found' };

    const existing = await get('SELECT id FROM PracticalBooking WHERE sessionId = ? AND userId = ?', [meta.sessionId, payment.userId]);
    if (!existing) {
      if (session.booked >= session.capacity) {
        // Paid but the last seat went — flag for support/refund rather than overbooking.
        await run("UPDATE Payment SET status = 'REFUND_DUE' WHERE id = ?", [payment.id]);
        await insert('Notification', {
          userId: payment.userId, kind: 'PRACTICAL_REMINDER', title: 'Session filled up — refund on the way',
          body: `${session.courseTitle} in ${session.city} filled before your payment confirmed. Support will refund or move you to the next date.`,
        });
        return { ok: false, error: 'Session full — refund flagged' };
      }
      await insert('PracticalBooking', { sessionId: meta.sessionId, userId: payment.userId, status: 'CONFIRMED', slipCode: randomUUID() });
      await insert('Notification', {
        userId: payment.userId, kind: 'PRACTICAL_REMINDER', title: 'Practical session booked ✅',
        body: `${session.courseTitle} — ${session.city}, ${new Date(session.startsAt).toDateString()}. Your attendance slip is in your dashboard.`,
        href: '/dashboard',
      });
      await insert('AuditLog', { userId: payment.userId, action: 'PRACTICAL_PAID', detail: reference });
    }
    return { ok: true, kind: 'PRACTICAL' };
  }

  return { ok: true, kind: 'NONE' };
}
