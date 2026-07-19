'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? 'Registration failed.');
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="container-x flex justify-center py-16">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl shadow-lift md:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-brand-700 to-brand-950 p-10 text-white md:block">
          <h2 className="h-display text-2xl text-white">Start building real skills today</h2>
          <ul className="mt-6 space-y-4 text-sm text-white/80">
            <li className="flex gap-3"><span>🎥</span>HD video courses built by working technicians</li>
            <li className="flex gap-3"><span>🛠️</span>Hands-on practical days in Harare, Bulawayo & Johannesburg</li>
            <li className="flex gap-3"><span>📜</span>QR-verifiable certificates employers trust</li>
            <li className="flex gap-3"><span>💳</span>Pay with EcoCash, PayNow, Mukuru, card or PayPal</li>
          </ul>
        </div>
        <form onSubmit={submit} className="space-y-4 bg-white p-8">
          <div>
            <h1 className="h-display text-2xl">Create your account</h1>
            <p className="mt-1 text-sm text-ink-faint">Free to join — pay only for the courses you take.</p>
          </div>
          <input required placeholder="Full name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input type="email" required placeholder="Email address" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required placeholder="City (for practical sessions)" className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input type="password" required minLength={8} placeholder="Password (8+ characters)" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
          <button disabled={busy} className="btn-accent w-full">{busy ? 'Creating account…' : 'Create Account'}</button>
          <p className="text-center text-sm text-ink-faint">
            Already a student? <Link href="/login" className="font-bold text-brand-600">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
