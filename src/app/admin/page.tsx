import { redirect } from 'next/navigation';
import { Price } from '@/components/CurrencyProvider';
import { getAdminDashboard } from '@/lib/queries';
import { currentUser } from '@/lib/auth';

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/admin');
  if (user.role !== 'ADMIN') redirect('/dashboard');

  const { users, courses, enrollments, certs, revenue, payments, sessions } = await getAdminDashboard();

  return (
    <div className="container-x space-y-10 py-10">
      <div>
        <h1 className="h-display text-3xl">Admin console</h1>
        <p className="mt-1 text-ink-faint">Platform overview — users, courses, payments, practicals and certificates.</p>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          ['👥', users.toLocaleString(), 'Users'],
          ['📚', courses, 'Published courses'],
          ['🎓', enrollments.toLocaleString(), 'Enrollments'],
          ['📜', certs, 'Certificates issued'],
        ].map(([icon, n, label]) => (
          <div key={String(label)} className="card p-5">
            <span className="text-2xl">{icon}</span>
            <p className="mt-2 font-display text-2xl font-bold">{String(n)}</p>
            <p className="text-xs font-semibold text-ink-faint">{label}</p>
          </div>
        ))}
        <div className="card bg-gradient-to-br from-brand-600 to-brand-800 !border-0 p-5 text-white">
          <span className="text-2xl">💰</span>
          <Price cents={revenue} className="mt-2 block font-display text-2xl font-bold" />
          <p className="text-xs font-semibold text-white/60">Paid revenue</p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="h-display text-xl">Recent payments</h2>
          <div className="card mt-4 divide-y divide-surface-line">
            {payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                <div>
                  <p className="font-bold">{p.userName}</p>
                  <p className="text-xs text-ink-faint">{p.provider} · {p.purpose} · {new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <Price cents={p.amountCents} className="font-display font-bold" />
                  <p className={`text-xs font-bold ${p.status === 'PAID' ? 'text-emerald-600' : p.status === 'PENDING' ? 'text-amber-600' : 'text-rose-600'}`}>{p.status}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="h-display text-xl">Practical training schedule</h2>
          <div className="card mt-4 divide-y divide-surface-line">
            {sessions.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                <div>
                  <p className="font-bold">{s.city} — {s.courseTitle}</p>
                  <p className="text-xs text-ink-faint">{s.venue} · {new Date(s.startsAt).toDateString()}</p>
                </div>
                <span className={`chip ${s.booked >= s.capacity ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-700'}`}>
                  {s.booked}/{s.capacity} booked
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card p-6">
        <h2 className="font-display font-bold">Management modules</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {['Users & roles', 'Courses & instructors', 'Payments & invoicing', 'Coupons', 'Reviews moderation', 'Reports & analytics', 'Practical schedules', 'Certificates & audit logs'].map((m) => (
            <button key={m} className="rounded-xl border border-surface-line bg-surface-soft px-4 py-3 text-left text-xs font-semibold text-ink-soft transition hover:border-brand-300 hover:text-brand-700">
              {m} →
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
