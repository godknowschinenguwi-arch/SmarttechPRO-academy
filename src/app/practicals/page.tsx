import BookSessionButton from '@/components/BookSessionButton';
import { Price } from '@/components/CurrencyProvider';
import { listPracticalSessions } from '@/lib/queries';
import { currentUser } from '@/lib/auth';
import { all } from '@/lib/db';

export default async function PracticalsPage({ searchParams }: { searchParams: { city?: string } }) {
  const user = await currentUser();
  const sessions = await listPracticalSessions();
  const myBookings = user
    ? new Set((await all<any>(`SELECT sessionId FROM PracticalBooking WHERE userId = ? AND status != 'CANCELLED'`, [user.id])).map((b) => b.sessionId))
    : new Set();

  const cities = Array.from(new Set(sessions.map((s: any) => s.city)));
  const active = searchParams.city;
  const filtered = active ? sessions.filter((s: any) => s.city === active) : sessions;

  return (
    <div className="container-x py-12">
      <div className="max-w-2xl">
        <h1 className="h-display text-3xl">Hands-on practical training</h1>
        <p className="mt-3 leading-7 text-ink-faint">
          Theory gets you started — practice gets you hired. Book a seat at a practical day, work on real
          installation rigs with your instructor, and earn the hands-on endorsement on your certificate.
          Pay the remaining balance when you book; your attendance slip appears in your dashboard.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <a href="/practicals" className={`chip ${!active ? 'bg-brand-600 text-white' : 'border border-surface-line bg-white text-ink-soft'}`}>All cities</a>
        {cities.map((c) => (
          <a key={c} href={`/practicals?city=${encodeURIComponent(c)}`} className={`chip ${active === c ? 'bg-brand-600 text-white' : 'border border-surface-line bg-white text-ink-soft hover:border-brand-300'}`}>
            📍 {c}
          </a>
        ))}
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {filtered.map((s: any) => {
          const seatsLeft = s.capacity - s.booked;
          const d = new Date(s.startsAt);
          return (
            <div key={s.id} className="card flex flex-col gap-4 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="chip bg-accent-50 text-accent-600">📍 {s.city}, {s.country}</p>
                  <h2 className="mt-3 font-display text-lg font-bold">{s.courseTitle}</h2>
                  <p className="mt-1 text-sm text-ink-faint">{s.venue}</p>
                </div>
                <div className="rounded-2xl bg-brand-950 px-4 py-3 text-center text-white">
                  <p className="font-display text-xl font-bold leading-none">{d.getDate()}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase text-white/60">{d.toLocaleString('en', { month: 'short' })} {d.getFullYear()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-ink-soft">
                <span>🕗 08:00 – 16:00</span>
                <span className={seatsLeft <= 3 ? 'text-rose-600' : ''}>💺 {seatsLeft} of {s.capacity} seats left</span>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-surface-line pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-ink-faint">Remaining balance</p>
                  <Price cents={s.priceCents} className="font-display text-xl font-bold text-brand-700" />
                </div>
                <BookSessionButton sessionId={s.id} loggedIn={!!user} full={seatsLeft <= 0} booked={myBookings.has(s.id)} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mt-10 grid gap-6 p-8 md:grid-cols-3">
        {[
          ['✅ What to bring', 'Closed shoes, notebook, and your own hand tools if you have them. Rigs, cameras and materials are provided.'],
          ['📋 Attendance & assessment', 'Your instructor marks attendance from your slip code and records your practical assessment score the same day.'],
          ['📜 Practical certificate', 'Pass the assessment to receive the practical completion endorsement, verifiable by QR code.'],
        ].map(([t, b]) => (
          <div key={t}>
            <h3 className="font-display text-sm font-bold">{t}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-faint">{b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
