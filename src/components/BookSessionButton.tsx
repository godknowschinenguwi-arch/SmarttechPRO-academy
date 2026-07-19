'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BookSessionButton({ sessionId, loggedIn, full, booked }: {
  sessionId: string; loggedIn: boolean; full: boolean; booked: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  if (booked) return <span className="chip bg-emerald-50 text-emerald-700">✓ Booked</span>;
  if (full) return <span className="chip bg-rose-50 text-rose-600">Fully booked</span>;
  if (!loggedIn) return <a href="/login?next=/practicals" className="btn-accent !px-4 !py-2">Log in to book</a>;

  async function book() {
    setBusy(true);
    setError('');
    const res = await fetch('/api/practicals/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBusy(false);
      return setError(data.error ?? 'Booking failed.');
    }
    if (data.redirectUrl) {
      window.location.href = data.redirectUrl; // pay remaining balance at the gateway
      return;
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={book} disabled={busy} className="btn-accent !px-4 !py-2">{busy ? 'Redirecting…' : 'Book a Seat'}</button>
      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
