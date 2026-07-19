'use client';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Info = { status: string; purpose: string; amountCents: number; provider: string; reference: string };

function ReturnInner() {
  const params = useSearchParams();
  const ref = params.get('ref');
  const [info, setInfo] = useState<Info | null>(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!ref) return;
    let stop = false;
    async function poll() {
      const res = await fetch(`/api/payments/status?ref=${encodeURIComponent(ref!)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (stop) return;
      setInfo(data);
      if (data.status === 'PENDING') setTimeout(() => setTries((t) => t + 1), 2500);
    }
    poll();
    return () => { stop = true; };
  }, [ref, tries]);

  if (!ref) return <p className="text-ink-faint">Missing payment reference.</p>;
  if (!info) return <Spinner text="Checking payment status…" />;

  if (info.status === 'PENDING') {
    return <Spinner text="Waiting for payment confirmation… If you approved on your phone, this updates automatically." />;
  }

  const paid = info.status === 'PAID';
  return (
    <div className={`card w-full max-w-lg p-10 text-center ${paid ? 'border-t-4 border-t-emerald-500' : 'border-t-4 border-t-rose-500'}`}>
      <span className="text-5xl">{paid ? '🎉' : '😕'}</span>
      <h1 className="h-display mt-4 text-2xl">{paid ? 'Payment successful' : 'Payment not completed'}</h1>
      <p className="mt-2 text-sm text-ink-faint">
        {paid
          ? info.purpose === 'COURSE'
            ? 'Your enrollment is active — your course is ready in your dashboard.'
            : 'Your seat is booked. Your attendance slip is in your dashboard.'
          : 'The payment was cancelled or failed. No money moved — you can try again anytime.'}
      </p>
      <p className="mt-3 font-mono text-xs text-ink-faint">{info.reference} · {info.provider} · ${(info.amountCents / 100).toFixed(2)}</p>
      <div className="mt-6 flex justify-center gap-3">
        {paid ? (
          <Link href="/dashboard" className="btn-primary">Go to my dashboard →</Link>
        ) : (
          <>
            <Link href="/courses" className="btn-ghost">Back to courses</Link>
            <Link href="/dashboard" className="btn-primary">My dashboard</Link>
          </>
        )}
      </div>
    </div>
  );
}

function Spinner({ text }: { text: string }) {
  return (
    <div className="card w-full max-w-lg p-10 text-center">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      <p className="mt-4 text-sm text-ink-faint">{text}</p>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <div className="container-x flex justify-center py-20">
      <Suspense><ReturnInner /></Suspense>
    </div>
  );
}
