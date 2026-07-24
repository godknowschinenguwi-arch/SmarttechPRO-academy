'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? 'Something went wrong.');
    setDone(true);
  }

  return (
    <div className="container-x flex justify-center py-16">
      <div className="card w-full max-w-md space-y-4 p-8">
        <div className="text-center">
          <h1 className="h-display text-2xl">Forgot your password?</h1>
          <p className="mt-1 text-sm text-ink-faint">Enter your email and we'll send you a reset link.</p>
        </div>
        {done ? (
          <p className="rounded-xl bg-emerald-50 p-4 text-center text-sm font-semibold text-emerald-700">
            If an account exists for {email}, a reset link is on its way. Check your inbox.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input type="email" required placeholder="Email address" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
            <button disabled={busy} className="btn-primary w-full">{busy ? 'Sending…' : 'Send Reset Link'}</button>
          </form>
        )}
        <p className="text-center text-sm text-ink-faint">
          <Link href="/login" className="font-bold text-brand-600">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
