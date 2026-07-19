import { notFound, redirect } from 'next/navigation';
import { get } from '@/lib/db';
import { paynowLive } from '@/lib/paynow';
import { currentUser } from '@/lib/auth';
import MockGatewayActions from './MockGatewayActions';

// Built-in SANDBOX payment gateway — only mounted when Paynow keys are NOT configured.
// Simulates the hosted Paynow/EcoCash checkout so the full payment lifecycle can be
// exercised in development: approve → webhook → activation, or decline → FAILED.
export default async function MockGatewayPage({ params }: { params: { reference: string } }) {
  if (paynowLive) redirect('/'); // live mode: real customers never see this page

  const user = await currentUser();
  if (!user) redirect('/login');

  const payment = await get<any>(
    'SELECT * FROM Payment WHERE reference = ? AND userId = ?', [params.reference, user.id]);
  if (!payment) notFound();

  const amount = (payment.amountCents / 100).toFixed(2);

  return (
    <div className="container-x flex justify-center py-16">
      <div className="w-full max-w-md">
        <div className="rounded-t-3xl bg-[#16a34a] px-8 py-6 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">Sandbox gateway · Paynow simulation</p>
          <p className="mt-2 font-display text-2xl font-bold">Pay ${amount} USD</p>
          <p className="mt-1 text-sm text-white/80">to SmartTech Academy</p>
        </div>
        <div className="card space-y-5 rounded-t-none p-8">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink-faint">Reference</span><span className="font-mono font-bold">{payment.reference}</span></div>
            <div className="flex justify-between"><span className="text-ink-faint">Method</span><span className="font-bold">{payment.provider}</span></div>
            <div className="flex justify-between"><span className="text-ink-faint">Purpose</span><span className="font-bold">{payment.purpose === 'COURSE' ? 'Course enrollment' : 'Practical session'}</span></div>
            <div className="flex justify-between"><span className="text-ink-faint">Status</span><span className="chip bg-amber-50 text-amber-700">{payment.status}</span></div>
          </div>

          {payment.status === 'PENDING' ? (
            <>
              <div className="rounded-xl bg-surface-soft p-4 text-xs leading-6 text-ink-faint">
                📱 In production this is Paynow’s hosted page — the customer confirms on their phone
                (EcoCash USSD push) or pays by card. Paynow then calls our webhook. Use the buttons below to
                simulate that callback.
              </div>
              <MockGatewayActions reference={payment.reference} />
            </>
          ) : (
            <a href={`/pay/return?ref=${payment.reference}`} className="btn-primary w-full">View payment result →</a>
          )}
        </div>
      </div>
    </div>
  );
}
