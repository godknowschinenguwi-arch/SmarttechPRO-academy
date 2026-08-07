import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Price } from '@/components/CurrencyProvider';
import { getInstructorDashboard } from '@/lib/queries';
import { currentUser } from '@/lib/auth';

export default async function InstructorPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/instructor');
  if (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') redirect('/dashboard');

  const { courses, toGrade } = await getInstructorDashboard(user.id);
  const totalStudents = courses.reduce((s: number, c: any) => s + Number(c.students), 0);
  const revenueCents = courses.reduce((s: number, c: any) => s + Number(c.students) * Number(c.priceCents), 0);

  return (
    <div className="container-x space-y-10 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="h-display text-3xl">Instructor studio</h1>
          <p className="mt-1 text-ink-faint">Welcome, {user.name}. Manage your courses, students and grading.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/instructor/course-design" className="btn-ghost">📐 CCTV design progress</Link>
          <button className="btn-primary">+ Create New Course</button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['👥', totalStudents.toLocaleString(), 'Total enrollments'],
          ['📚', courses.length, 'Courses'],
          ['💰', null, 'Gross revenue'],
          ['📤', toGrade.length, 'Submissions to grade'],
        ].map(([icon, n, label], i) => (
          <div key={String(label)} className="card p-5">
            <span className="text-2xl">{icon}</span>
            {i === 2
              ? <Price cents={revenueCents} className="mt-2 block font-display text-2xl font-bold" />
              : <p className="mt-2 font-display text-2xl font-bold">{String(n)}</p>}
            <p className="text-xs font-semibold text-ink-faint">{label}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="h-display text-xl">My courses</h2>
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-surface-line bg-surface-soft text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-6 py-3">Course</th>
                <th className="px-6 py-3">Students</th>
                <th className="px-6 py-3">Rating</th>
                <th className="px-6 py-3">Completions</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c: any) => (
                <tr key={c.id} className="border-b border-surface-line last:border-0 hover:bg-surface-soft/50">
                  <td className="px-6 py-4">
                    <Link href={`/courses/${c.slug}`} className="font-bold hover:text-brand-700">{c.title}</Link>
                  </td>
                  <td className="px-6 py-4">{Number(c.students).toLocaleString()}</td>
                  <td className="px-6 py-4">{c.rating ? `★ ${Number(c.rating).toFixed(1)}` : '—'}</td>
                  <td className="px-6 py-4">{c.completed}</td>
                  <td className="px-6 py-4"><Price cents={c.priceCents} /></td>
                  <td className="px-6 py-4">
                    <span className={`chip ${c.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {c.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="h-display text-xl">Grading queue</h2>
          <div className="card mt-4 divide-y divide-surface-line">
            {toGrade.length === 0 && <p className="p-6 text-sm text-ink-faint">🎉 All caught up — no submissions waiting.</p>}
            {toGrade.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between gap-4 p-5 text-sm">
                <div>
                  <p className="font-bold">{s.assignmentTitle}</p>
                  <p className="text-xs text-ink-faint">{s.studentName} · {s.courseTitle}</p>
                </div>
                <button className="btn-ghost !px-4 !py-2 text-xs">Grade</button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="h-display text-xl">Course builder</h2>
          <div className="card mt-4 p-6 text-sm leading-7 text-ink-soft">
            <p>
              The drag-and-drop course builder lets you structure <b>Course → Module → Lesson</b>, upload videos,
              PowerPoints and PDFs, attach quizzes and assignments, set prerequisites and pricing, preview as a
              student and publish when ready.
            </p>
            <p className="mt-3 rounded-xl bg-surface-soft p-3 text-xs text-ink-faint">
              Lessons are content-agnostic: you can publish a lesson with notes today and attach the video later —
              no course redesign needed.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
