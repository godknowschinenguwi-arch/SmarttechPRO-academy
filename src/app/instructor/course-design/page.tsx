import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCctvDesignProgress } from '@/lib/queries';
import { currentUser } from '@/lib/auth';
import ProgressRing from '@/components/ProgressRing';

function statusFor(pct: number): { label: string; className: string } {
  if (pct >= 100) return { label: 'Done', className: 'bg-emerald-50 text-emerald-700' };
  if (pct <= 0) return { label: 'Not started', className: 'bg-ink-faint/10 text-ink-faint' };
  return { label: 'In progress', className: 'bg-amber-50 text-amber-700' };
}

export default async function CourseDesignPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/instructor/course-design');
  if (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') redirect('/dashboard');

  const courses = await getCctvDesignProgress();
  const designedCount = courses.reduce((s, c) => s + c.designedCount, 0);
  const totalCount = courses.reduce((s, c) => s + c.totalCount, 0);
  const videoCount = courses.reduce((s, c) => s + c.videoCount, 0);
  const overallPct = totalCount ? (designedCount / totalCount) * 100 : 0;
  const videoPct = totalCount ? (videoCount / totalCount) * 100 : 0;

  return (
    <div className="container-x space-y-10 py-10">
      <div>
        <Link href="/instructor" className="text-xs font-semibold text-ink-faint hover:text-brand-700">← Instructor studio</Link>
        <h1 className="h-display mt-1 text-3xl">CCTV course design progress</h1>
        <p className="mt-1 max-w-2xl text-ink-faint">
          How much of the curriculum — lesson notes, quiz questions and assignment briefs — is actually written,
          across every CCTV course, versus still sitting on the placeholder scaffold.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="card p-8 text-sm text-ink-faint">No CCTV courses found yet.</div>
      ) : (
        <>
          <section className="grid gap-6 sm:grid-cols-[auto_1fr]">
            <div className="card flex flex-col items-center justify-center gap-3 p-6">
              <ProgressRing pct={overallPct} size={120} />
              <p className="text-center text-xs font-semibold text-ink-faint">
                Curriculum designed<br />{designedCount} / {totalCount} lessons
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ['📚', courses.length, 'CCTV courses'],
                ['✅', designedCount, 'Lessons designed'],
                ['✍️', totalCount - designedCount, 'Left to write'],
                ['🎬', `${Math.round(videoPct)}%`, 'Have video attached'],
              ].map(([icon, n, label]) => (
                <div key={String(label)} className="card p-5">
                  <span className="text-2xl">{icon}</span>
                  <p className="mt-2 font-display text-2xl font-bold">{String(n)}</p>
                  <p className="text-xs font-semibold text-ink-faint">{label}</p>
                </div>
              ))}
            </div>
          </section>

          {courses.map((course) => {
            const pct = course.totalCount ? (course.designedCount / course.totalCount) * 100 : 0;
            return (
              <section key={course.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="h-display text-xl">
                    <Link href={`/courses/${course.slug}`} className="hover:text-brand-700">{course.title}</Link>
                  </h2>
                  <span className={`chip ${course.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div className="card mt-4 p-5">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Curriculum design</span>
                    <span>{course.designedCount} / {course.totalCount} lessons ({Math.round(pct)}%)</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-soft">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-accent-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="card mt-4 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-surface-line bg-surface-soft text-xs uppercase tracking-wide text-ink-faint">
                      <tr>
                        <th className="px-6 py-3">Module</th>
                        <th className="px-6 py-3">Lessons</th>
                        <th className="px-6 py-3">Designed</th>
                        <th className="px-6 py-3">Video attached</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.modules.map((m) => {
                        const modPct = m.totalCount ? (m.designedCount / m.totalCount) * 100 : 0;
                        const status = statusFor(modPct);
                        return (
                          <tr key={m.id} className="border-b border-surface-line last:border-0 hover:bg-surface-soft/50">
                            <td className="px-6 py-4">
                              <p className="font-bold">{m.title}</p>
                              {m.summary && <p className="text-xs text-ink-faint">{m.summary}</p>}
                            </td>
                            <td className="px-6 py-4">{m.totalCount}</td>
                            <td className="px-6 py-4">{m.designedCount} / {m.totalCount}</td>
                            <td className="px-6 py-4">{m.videoCount} / {m.totalCount}</td>
                            <td className="px-6 py-4"><span className={`chip ${status.className}`}>{status.label}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
