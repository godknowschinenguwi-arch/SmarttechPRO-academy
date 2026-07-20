import { notFound } from 'next/navigation';
import Stars from '@/components/Stars';
import EnrollButton from '@/components/EnrollButton';
import BookSessionButton from '@/components/BookSessionButton';
import { Price } from '@/components/CurrencyProvider';
import { getCourse, getEnrollment } from '@/lib/queries';
import { currentUser } from '@/lib/auth';

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const data = await getCourse(params.slug);
  if (!data) notFound();
  const { course, modules, lessons, reviews, practicals } = data;

  const user = await currentUser();
  const enrollment = user ? await getEnrollment(user.id, course.id) : null;
  const firstLesson = lessons[0];
  const objectives: string[] = JSON.parse(course.objectives);
  const requirements: string[] = JSON.parse(course.requirements);
  const resources: string[] = JSON.parse(course.resources);

  const lessonsByModule = new Map<string, any[]>();
  for (const l of lessons) {
    if (!lessonsByModule.has(l.moduleId)) lessonsByModule.set(l.moduleId, []);
    lessonsByModule.get(l.moduleId)!.push(l);
  }

  const KIND_ICON: Record<string, string> = { VIDEO: '▶', QUIZ: '❓', ASSIGNMENT: '📤', SUMMARY: '📋', THEORY: '📖', PRACTICAL_VIDEO: '🛠' };

  return (
    <>
      {/* Header */}
      <section className="bg-brand-950 text-white">
        <div className="container-x grid gap-10 py-14 lg:grid-cols-[1fr_380px]">
          <div>
            <span className="chip bg-white/10 text-accent-300">{course.categoryName}</span>
            <h1 className="h-display mt-4 text-3xl text-white sm:text-4xl">{course.title}</h1>
            <p className="mt-3 max-w-2xl text-white/75">{course.subtitle}</p>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/70">
              {course.rating && (
                <span className="flex items-center gap-2">
                  <span className="font-bold text-amber-400">{Number(course.rating).toFixed(1)}</span>
                  <Stars value={Number(course.rating)} />
                  <span>({course.reviewCount} reviews)</span>
                </span>
              )}
              <span>👥 {Number(course.studentCount).toLocaleString()} students</span>
              <span>⏱ {course.durationHours} hours</span>
              <span className="chip bg-white/10 text-white">{course.difficulty}</span>
            </div>
            <p className="mt-4 text-sm text-white/60">Instructor: <span className="font-semibold text-white">{course.instructorName}</span> · {course.instructorHeadline}</p>
          </div>

          {/* Purchase card */}
          <aside className="card h-fit overflow-hidden text-ink lg:-mb-24">
            {course.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={course.imageUrl} alt={course.title} className="h-44 w-full object-cover" />
            )}
            <div className="p-6">
            <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Full course access</p>
              <Price cents={course.priceCents} className="font-display text-4xl font-bold" />
              <p className="mt-1 text-xs text-white/60">One-time payment · installments available</p>
            </div>
            <div className="mt-5 space-y-4">
              <EnrollButton
                courseSlug={course.slug}
                loggedIn={!!user}
                enrolled={!!enrollment}
                firstLessonHref={firstLesson ? `/learn/${course.slug}/${firstLesson.id}` : '#'}
              />
              <ul className="space-y-2 text-sm text-ink-soft">
                {resources.map((r) => <li key={r} className="flex gap-2"><span className="text-emerald-500">✓</span>{r}</li>)}
              </ul>
              <p className="rounded-xl bg-surface-soft p-3 text-xs text-ink-faint">
                💡 Optional hands-on practical day: <Price cents={course.practicalFeeCents} className="font-bold text-ink" /> payable when you book a session.
              </p>
            </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="container-x grid gap-10 py-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-12">
          {/* Objectives */}
          <section className="card p-7">
            <h2 className="h-display text-xl">What you’ll learn</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {objectives.map((o) => (
                <li key={o} className="flex gap-3 text-sm leading-6 text-ink-soft"><span className="mt-0.5 text-brand-600">✓</span>{o}</li>
              ))}
            </ul>
          </section>

          {/* Curriculum */}
          <section>
            <h2 className="h-display text-xl">Course curriculum</h2>
            <p className="mt-1 text-sm text-ink-faint">{modules.length} modules · {lessons.length} lessons · {course.durationHours} hours</p>
            <div className="mt-5 space-y-3">
              {modules.map((m: any) => (
                <details key={m.id} className="card group overflow-hidden" open={m.order === 1}>
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 font-display text-sm font-bold marker:content-none">
                    <span>{m.title}</span>
                    <span className="text-xs font-semibold text-ink-faint">{lessonsByModule.get(m.id)?.length ?? 0} lessons</span>
                  </summary>
                  <div className="border-t border-surface-line">
                    {(lessonsByModule.get(m.id) ?? []).map((l: any) => (
                      <div key={l.id} className="flex items-center justify-between gap-3 px-6 py-3 text-sm odd:bg-surface-soft/60">
                        <span className="flex items-center gap-3">
                          <span className="text-brand-500">{KIND_ICON[l.kind] ?? '▶'}</span>
                          {l.title}
                          {l.isFreePreview ? <span className="chip bg-accent-50 text-accent-600">Free preview</span> : null}
                        </span>
                        <span className="text-xs text-ink-faint">{l.estMinutes} min</span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Instructor */}
          <section className="card p-7">
            <h2 className="h-display text-xl">Your instructor</h2>
            <div className="mt-5 flex items-start gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 font-display text-xl font-bold text-white">
                {String(course.instructorName).split(' ').map((p: string) => p[0]).slice(0, 2).join('')}
              </span>
              <div>
                <p className="font-display font-bold">{course.instructorName}</p>
                <p className="text-sm text-ink-faint">{course.instructorHeadline}</p>
                <p className="mt-3 text-sm leading-7 text-ink-soft">{course.instructorBio}</p>
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section>
            <h2 className="h-display text-xl">Student reviews</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {reviews.map((r: any, i: number) => (
                <figure key={i} className="card p-5">
                  <Stars value={r.rating} />
                  <blockquote className="mt-2 text-sm leading-6 text-ink-soft">“{r.comment}”</blockquote>
                  <figcaption className="mt-3 text-xs font-bold text-ink-faint">{r.userName}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar: requirements, certificate, practicals */}
        <aside className="space-y-6 lg:pt-24">
          <div className="card p-6">
            <h3 className="font-display font-bold">Requirements</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              {requirements.map((r) => <li key={r} className="flex gap-2"><span className="text-ink-faint">•</span>{r}</li>)}
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="font-display font-bold">📜 Certificate</h3>
            <p className="mt-3 text-sm leading-6 text-ink-soft">
              Finish all lessons and pass the final exam to earn a certificate with a unique serial number and QR
              verification. Complete a practical day for the hands-on endorsement.
            </p>
          </div>
          {practicals.length > 0 && (
            <div className="card p-6">
              <h3 className="font-display font-bold">🛠 Upcoming practical sessions</h3>
              <div className="mt-4 space-y-4">
                {practicals.map((p: any) => (
                  <div key={p.id} className="rounded-xl border border-surface-line p-4">
                    <p className="text-sm font-bold">{p.city}, {p.country}</p>
                    <p className="mt-1 text-xs text-ink-faint">{p.venue}</p>
                    <p className="mt-1 text-xs text-ink-faint">{new Date(p.startsAt).toDateString()}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink-soft">{p.capacity - p.booked} seats left · <Price cents={p.priceCents} className="font-bold" /></span>
                      <a href="/practicals" className="text-xs font-bold text-brand-600 hover:text-brand-800">Book →</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
