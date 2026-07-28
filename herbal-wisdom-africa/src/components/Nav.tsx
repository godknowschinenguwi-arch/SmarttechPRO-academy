import Link from 'next/link';
import { currentUser } from '@/lib/auth';

export default async function Nav() {
  const user = await currentUser();
  return (
    <header className="border-b border-surface-line bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-leaf-800">
          <span className="text-xl">🌿</span>
          <span>Herbal Wisdom Africa</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/" className="text-ink-soft hover:text-ink">
            Browse
          </Link>
          {user ? (
            <>
              <Link href="/remedies/new" className="btn-primary">
                Share your experience
              </Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin/moderation" className="text-ink-soft hover:text-ink">
                  Moderation
                </Link>
              )}
              <span className="text-ink-faint">Hi, {user.name.split(' ')[0]}</span>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="text-ink-soft hover:text-ink">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-ink-soft hover:text-ink">
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
