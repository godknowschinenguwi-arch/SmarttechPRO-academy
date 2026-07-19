import Link from 'next/link';
import { redirect } from 'next/navigation';
import ProgressRing from '@/components/ProgressRing';
import CourseCard from '@/components/CourseCard';
import { getStudentDashboard } from '@/lib/queries';
import { currentUser } from '@/lib/auth';
import { get, all } from '@/lib/db';

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/dashboard');

  const { enrollments, certificates, bookings, notifications, badges, recommended } = await getStudentDashboard(user.id);
  const inProgress = enrollments.filter((e: any) => e.status === 'ACTIVE');
  const completed = enrollments.filter((e: any) => e.status === 'COMPLETED');
  const avgPct = enrollments.length
    ? enrollments.reduce((s: number, e: any) => s + (e.lessonCount ? (e.doneCount / e.lessonCount) * 100 : 0), 0) / enrollments.length
    : 0;

  // find "continue learning" target: first incomplete lesson of most recent active course
  let continueHref: string | null = null;
  if (inProgress[0]) {
    const nextLesson = await get<any>(
      `SELECT l.id FROM Lesson l JOIN Module m ON m.id = l.moduleId
       WHERE m.courseId = ? AND l.id NOT IN (SELECT lessonId FROM LessonProgress WHERE userId = ? AND completed = 1)
       ORDER BY m."order", l."order" LIMIT 1`,
      [inProgress[0].courseId, user.id]);
    if (nextLesson) continueHref = `/learn/${inProgress[0].slug}/${nextLesson.id}`;
  }

  const xpForNext = user.level * 500;

  return (
    <div className="container-x space-y-10 py-10">
      {/* Welcome strip */}
      <section className="card flex flex-col gap-6 bg-gradient-to-br from-brand-600 to-brand-800 !border-0 p-8 text-white md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="h-display text-2xl text-white sm:text-3xl">Welcome back, {user.name.split(' ')[0]} 👋</h1>
          <p className="mt-2 text-white/70">Technician Level {user.level} · {user.xp} XP · {xpForNext - (user.xp % xpForNext)} XP to next level</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {continueHref && <Link href={continueHref} className="btn-accent">Continue Learning →</Link>}
            <Link href="/courses" className="btn bg-white/10 text-white hover:bg-white/20">Browse Courses</Link>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="font-display text-4xl font-bold">🔥 {user.streakDays}</p>
            <p className="text-xs text-white/60">day streak</p>
          </div>
          <div className="rounded-2xl bg-white p-3"><ProgressRing pct={avgPct} /></div>
        </div>
      </section>

      {/* KPI row */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['📚', inProgress.length, 'Courses in progress'],
          ['✅', completed.length, 'Courses completed'],
          ['📜', certificates.length, 'Certificates earned'],
          ['🏅', badges.length, 'Badges unlocked'],
        ].map(([icon, n, label]) => (
          <div key={String(label)} className="card p-5">
            <span className="text-2xl">{icon}</span>
            <p className="mt-2 font-display text-2xl font-bold">{String(n)}</p>
            <p className="text-xs font-semibold text-ink-faint">{label}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          {/* In progress */}
          <section>
            <h2 className="h-display text-xl">My learning</h2>
            <div className="mt-4 space-y-4">
              {enrollments.map((e: any) => {
                const pct = e.lessonCount ? Math.round((e.doneCount / e.lessonCount) * 100) : 0;
                return (
                  <div key={e.id} className="card flex items-center gap-5 p-5">
                    <div className="hidden h-16 w-24 shrink-0 rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 sm:block" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <Link href={`/courses/${e.slug}`} className="truncate font-display text-sm font-bold hover:text-brand-700">{e.title}</Link>
                        {e.status === 'COMPLETED' && <span className="chip bg-emerald-50 text-emerald-700">Completed</span>}
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-line">
                        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1.5 text-xs text-ink-faint">{pct}% · {e.doneCount}/{e.lessonCount} lessons</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Certificates */}
          <section>
            <h2 className="h-display text-xl">Certificates</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {certificates.length === 0 && <p className="text-sm text-ink-faint">Complete a course to earn your first certificate.</p>}
              {certificates.map((c: any) => (
                <div key={c.id} className="card overflow-hidden">
                  <div className="border-b-4 border-accent-500 bg-gradient-to-br from-brand-800 to-brand-950 p-5 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Certificate of Completion</p>
                    <p className="mt-2 font-display font-bold">{c.courseTitle}</p>
                    <p className="mt-1 text-xs text-white/60">{c.hoursCompleted} hours · issued {new Date(c.issuedAt).toDateString()}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-4 text-xs">
                    <span className="font-mono text-ink-faint">{c.serial}</span>
                    <span className="flex gap-3">
                      <a href={`/api/certificates/${c.serial}/pdf`} target="_blank" className="font-bold text-accent-600 hover:text-accent-700">⬇ PDF</a>
                      <Link href={`/verify/${c.serial}`} className="font-bold text-brand-600 hover:text-brand-800">Verify →</Link>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recommended */}
          <section>
            <h2 className="h-display text-xl">Recommended for you</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map((c: any, i: number) => <CourseCard key={c.id} course={c} index={i + 2} />)}
            </div>
          </section>
        </div>

        {/* Right rail */}
        <aside className="space-y-6">
          <div className="card p-6">
            <h3 className="font-display font-bold">🛠 Upcoming practical sessions</h3>
            <div className="mt-4 space-y-3">
              {bookings.length === 0 && <p className="text-sm text-ink-faint">No bookings yet. <Link href="/practicals" className="font-bold text-brand-600">Find a session →</Link></p>}
              {bookings.map((b: any) => (
                <div key={b.id} className="rounded-xl border border-surface-line p-4 text-sm">
                  <p className="font-bold">{b.courseTitle}</p>
                  <p className="mt-1 text-xs text-ink-faint">{b.city} · {b.venue}</p>
                  <p className="text-xs text-ink-faint">{new Date(b.startsAt).toDateString()}</p>
                  <p className="mt-2 flex items-center justify-between text-xs">
                    <span className="chip bg-brand-50 text-brand-700">{b.status}</span>
                    <span className="font-mono text-[10px] text-ink-faint">Slip: {String(b.slipCode).slice(0, 8).toUpperCase()}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-display font-bold">🏅 Achievements</h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {badges.map((b: any) => (
                <div key={b.name} className="rounded-xl bg-surface-soft p-3 text-center" title={b.description}>
                  <p className="text-2xl">{b.icon}</p>
                  <p className="mt-1 text-[10px] font-bold leading-tight text-ink-soft">{b.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-display font-bold">🔔 Announcements</h3>
            <div className="mt-4 space-y-3">
              {notifications.map((n: any) => (
                <div key={n.id} className="rounded-xl bg-surface-soft p-3 text-sm">
                  <p className="font-bold">{n.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-ink-faint">{n.body}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
