'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MockGatewayActions({ reference }: { reference: string }) {
  const [busy, setBusy] = useState<'paid' | 'cancelled' | null>(null);
  const router = useRouter();

  async function simulate(status: 'Paid' | 'Cancelled') {
    setBusy(status === 'Paid' ? 'paid' : 'cancelled');
    await fetch('/api/webhooks/paynow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, status }),
    });
    router.push(`/pay/return?ref=${reference}`);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button onClick={() => simulate('Paid')} disabled={!!busy} className="btn bg-emerald-600 text-white hover:bg-emerald-700">
        {busy === 'paid' ? 'Confirming…' : '✓ Approve payment'}
      </button>
      <button onClick={() => simulate('Cancelled')} disabled={!!busy} className="btn bg-rose-50 text-rose-600 hover:bg-rose-100">
        {busy === 'cancelled' ? 'Cancelling…' : '✕ Decline'}
      </button>
    </div>
  );
}
