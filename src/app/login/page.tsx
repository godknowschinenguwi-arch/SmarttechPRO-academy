'use client';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? 'Login failed.');
    const next = params.get('next') ?? (data.role === 'ADMIN' ? '/admin' : data.role === 'INSTRUCTOR' ? '/instructor' : '/dashboard');
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-8">
      <div className="text-center">
        <h1 className="h-display text-2xl">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-faint">Log in to continue learning.</p>
      </div>
      <input type="email" required placeholder="Email address" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" required placeholder="Password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
      <button disabled={busy} className="btn-primary w-full">{busy ? 'Logging in…' : 'Log In'}</button>
      <p className="text-center text-sm text-ink-faint">
        New here? <Link href="/register" className="font-bold text-brand-600">Create an account</Link>
      </p>
      <div className="rounded-xl bg-surface-soft p-4 text-xs leading-6 text-ink-faint">
        <p className="font-bold text-ink-soft">Demo accounts (password: Password123!)</p>
        <p>Student — student@smarttech.academy</p>
        <p>Instructor — tapiwa@smarttech.academy</p>
        <p>Admin — admin@smarttech.academy</p>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="container-x flex justify-center py-16">
      <Suspense><LoginForm /></Suspense>
    </div>
  );
}
