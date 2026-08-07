'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CurrencySwitcher } from './CurrencyProvider';

type NavUser = { name: string; role: string } | null;
type Counts = { notifications: number; messages: number };

function Badge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
      {n > 9 ? '9+' : n}
    </span>
  );
}

export default function Navbar({ user, counts }: { user: NavUser; counts?: Counts }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  const dashHref = user?.role === 'ADMIN' ? '/admin' : user?.role === 'INSTRUCTOR' ? '/instructor' : '/dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-surface-line bg-white/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 font-display text-sm font-bold text-white shadow-lift">ST</span>
          <span className="font-display text-lg font-bold tracking-tight">
            SmartTech<span className="text-brand-600"> Academy</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-ink-soft md:flex">
          <Link href="/courses" className="hover:text-brand-700">Courses</Link>
          <Link href="/practicals" className="hover:text-brand-700">Practical Training</Link>
          <Link href="/verify" className="hover:text-brand-700">Verify Certificate</Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <CurrencySwitcher />
          {user ? (
            <>
              <Link href="/messages" aria-label="Messages" className="relative rounded-lg p-2 text-ink-soft hover:bg-surface-soft hover:text-brand-700">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <Badge n={counts?.messages ?? 0} />
              </Link>
              <Link href="/notifications" aria-label="Notifications" className="relative rounded-lg p-2 text-ink-soft hover:bg-surface-soft hover:text-brand-700">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <Badge n={counts?.notifications ?? 0} />
              </Link>
              <Link href={dashHref} className="btn-primary !px-4 !py-2">My Dashboard</Link>
              <button onClick={logout} className="text-sm font-semibold text-ink-faint hover:text-ink">Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-ink-soft hover:text-brand-700">Log in</Link>
              <Link href="/register" className="btn-accent !px-4 !py-2">Get Started</Link>
            </>
          )}
        </div>

        <button aria-label="Menu" className="md:hidden" onClick={() => setOpen(!open)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-surface-line bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-semibold">
            <Link href="/courses" onClick={() => setOpen(false)}>Courses</Link>
            <Link href="/practicals" onClick={() => setOpen(false)}>Practical Training</Link>
            <Link href="/verify" onClick={() => setOpen(false)}>Verify Certificate</Link>
            <div className="pt-2"><CurrencySwitcher /></div>
            {user ? (
              <>
                <Link href="/messages" onClick={() => setOpen(false)}>
                  Messages{(counts?.messages ?? 0) > 0 && <span className="ml-2 chip bg-accent-500 text-white">{counts!.messages}</span>}
                </Link>
                <Link href="/notifications" onClick={() => setOpen(false)}>
                  Notifications{(counts?.notifications ?? 0) > 0 && <span className="ml-2 chip bg-accent-500 text-white">{counts!.notifications}</span>}
                </Link>
                <Link href={dashHref} className="btn-primary" onClick={() => setOpen(false)}>My Dashboard</Link>
                <button onClick={logout} className="text-left text-ink-faint">Log out</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>Log in</Link>
                <Link href="/register" className="btn-accent" onClick={() => setOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
