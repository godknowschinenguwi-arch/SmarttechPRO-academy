'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    setError('');
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: params.token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? 'Something went wrong.');
    setDone(true);
    setTimeout(() => { router.push('/dashboard'); router.refresh(); }, 1200);
  }

  return (
    <div className="container-x flex justify-center py-16">
      <div className="card w-full max-w-md space-y-4 p-8">
        <div className="text-center">
          <h1 className="h-display text-2xl">Set a new password</h1>
          <p className="mt-1 text-sm text-ink-faint">Choose a new password for your account.</p>
        </div>
        {done ? (
          <p className="rounded-xl bg-emerald-50 p-4 text-center text-sm font-semibold text-emerald-700">
            Password updated — taking you to your dashboard…
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input type="password" required minLength={8} placeholder="New password (8+ characters)" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            <input type="password" required minLength={8} placeholder="Confirm new password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
            <button disabled={busy} className="btn-primary w-full">{busy ? 'Saving…' : 'Reset Password'}</button>
          </form>
        )}
        <p className="text-center text-sm text-ink-faint">
          <Link href="/login" className="font-bold text-brand-600">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
