'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PROVIDERS = [
  ['PAYNOW', 'Paynow / EcoCash'],
  ['ECOCASH', 'EcoCash direct'],
  ['STRIPE', 'Card (Stripe)'],
  ['PAYPAL', 'PayPal'],
  ['MUKURU', 'Mukuru'],
  ['BANK_TRANSFER', 'Bank Transfer'],
] as const;

export default function EnrollButton({ courseSlug, loggedIn, enrolled, comingSoon, firstLessonHref }: {
  courseSlug: string; loggedIn: boolean; enrolled: boolean; comingSoon?: boolean; firstLessonHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState('PAYNOW');
  const [coupon, setCoupon] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  if (enrolled) {
    return <a href={firstLessonHref} className="btn-primary w-full">Continue Learning →</a>;
  }
  if (comingSoon) {
    return (
      <button disabled className="btn-primary w-full cursor-not-allowed opacity-60">
        🚧 Coming Soon — Not Yet Open for Enrollment
      </button>
    );
  }
  if (!loggedIn) {
    return <a href={`/login?next=/courses/${courseSlug}`} className="btn-accent w-full">Enroll Now</a>;
  }

  async function enroll() {
    setBusy(true);
    setError('');
    const res = await fetch('/api/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseSlug, provider, coupon: coupon || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBusy(false);
      return setError(data.error ?? 'Something went wrong.');
    }
    if (data.redirectUrl) {
      window.location.href = data.redirectUrl; // off to the payment gateway
      return;
    }
    setBusy(false);
    router.refresh(); // free order or already enrolled
  }

  return (
    <div className="space-y-3">
      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-accent w-full">Enroll Now</button>
      ) : (
        <div className="space-y-3 rounded-2xl border border-surface-line bg-surface-soft p-4">
          <label className="block text-xs font-bold uppercase tracking-wide text-ink-faint">Pay with</label>
          <div className="grid grid-cols-2 gap-2">
            {PROVIDERS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setProvider(key)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  provider === key ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-line bg-white text-ink-soft hover:border-brand-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code (try LAUNCH25)" className="input !py-2 text-xs" />
          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
          <button onClick={enroll} disabled={busy} className="btn-primary w-full">
            {busy ? 'Redirecting to gateway…' : 'Proceed to Payment'}
          </button>
          <p className="text-center text-[11px] text-ink-faint">🔒 Secure checkout. You’ll be redirected to the payment gateway and returned here once confirmed.</p>
        </div>
      )}
    </div>
  );
}
