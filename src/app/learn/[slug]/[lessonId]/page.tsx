import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import QuizPlayer from '@/components/QuizPlayer';
import CompleteLessonButton from '@/components/CompleteLessonButton';
import { getCourse, getEnrollment, getLessonBundle, getUserProgressForCourse } from '@/lib/queries';
import { all } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export default async function LessonPage({ params }: { params: { slug: string; lessonId: string } }) {
  const user = await currentUser();
  if (!user) redirect(`/login?next=/learn/${params.slug}/${params.lessonId}`);

  const data = await getCourse(params.slug);
  if (!data) notFound();
  const { course, modules, lessons } = data;

  const bundle = await getLessonBundle(params.lessonId);
  if (!bundle || bundle.lesson.courseId !== course.id) notFound();
  const { lesson, attachments, quiz, questions, assignment } = bundle;

  const enrollment = await getEnrollment(user.id, course.id);
  if (!enrollment && !lesson.isFreePreview && user.role === 'STUDENT') redirect(`/courses/${params.slug}`);

  const progress = await getUserProgressForCourse(user.id, course.id);
  const doneSet = new Set(progress.filter((p: any) => p.completed).map((p: any) => p.lessonId));
  const lessonProgress = progress.find((p: any) => p.lessonId === lesson.id);
  const idx = lessons.findIndex((l: any) => l.id === lesson.id);
  const next = lessons[idx + 1] ?? null;
  const pct = lessons.length ? Math.round((doneSet.size / lessons.length) * 100) : 0;

  const discussion = await all<any>(
    `SELECT fp.body, fp.likes, fp.isAnswer, u.name AS userName, u.role FROM ForumPost fp
     JOIN ForumThread ft ON ft.id = fp.threadId JOIN User u ON u.id = fp.userId
     WHERE ft.courseId = ? ORDER BY fp.createdAt LIMIT 6`, [course.id]);

  const lessonsByModule = new Map<string, any[]>();
  for (const l of lessons) {
    if (!lessonsByModule.has(l.moduleId)) lessonsByModule.set(l.moduleId, []);
    lessonsByModule.get(l.moduleId)!.push(l);
  }

  return (
    <div className="container-x grid gap-8 py-8 lg:grid-cols-[320px_1fr]">
      {/* Curriculum sidebar */}
      <aside className="card h-fit overflow-hidden lg:sticky lg:top-20">
        <div className="border-b border-surface-line bg-surface-soft p-5">
          <Link href={`/courses/${course.slug}`} className="text-xs font-bold text-brand-600 hover:text-brand-800">← {course.title}</Link>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-line">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-ink-faint">{pct}% complete · {doneSet.size}/{lessons.length} lessons</p>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {modules.map((m: any) => (
            <div key={m.id}>
              <p className="bg-surface-soft/70 px-5 py-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint">{m.title}</p>
              {(lessonsByModule.get(m.id) ?? []).map((l: any) => (
                <Link
                  key={l.id}
                  href={`/learn/${course.slug}/${l.id}`}
                  className={`flex items-center gap-3 px-5 py-2.5 text-sm transition ${
                    l.id === lesson.id ? 'bg-brand-50 font-bold text-brand-800' : 'text-ink-soft hover:bg-surface-soft'
                  }`}
                >
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${
                    doneSet.has(l.id) ? 'bg-emerald-500 text-white' : 'border border-surface-line text-ink-faint'
                  }`}>
                    {doneSet.has(l.id) ? '✓' : ''}
                  </span>
                  <span className="truncate">{l.title}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Lesson content */}
      <div className="min-w-0 space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">{lesson.moduleTitle} · ⏱ {lesson.estMinutes} min</p>
          <h1 className="h-display mt-1 text-2xl sm:text-3xl">{lesson.title}</h1>
        </div>

        {lesson.kind === 'QUIZ' && quiz ? (
          <QuizPlayer quizId={quiz.id} questions={questions} passMarkPct={quiz.passMarkPct} />
        ) : (
          <>
            {lesson.videoUrl && (
              <VideoPlayer
                src={lesson.videoUrl}
                lessonId={lesson.id}
                initialSeconds={lessonProgress?.secondsWatched ?? 0}
                title={lesson.title}
                watermark={user.email}
              />
            )}
            {lesson.contentHtml && (
              <div className="card prose-sm max-w-none p-7 text-sm leading-7 text-ink-soft [&_p]:mb-3"
                dangerouslySetInnerHTML={{ __html: lesson.contentHtml }} />
            )}
          </>
        )}

        {assignment && (
          <section className="card border-l-4 border-l-accent-500 p-6">
            <h2 className="font-display font-bold">📤 Assignment: {assignment.title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">{assignment.brief}</p>
            <div className="mt-4 rounded-xl border-2 border-dashed border-surface-line bg-surface-soft p-8 text-center text-sm text-ink-faint">
              Drag photos, videos or PDFs here — or <button className="font-bold text-brand-600">browse files</button>
              <p className="mt-1 text-xs">Accepted: {String(assignment.submitKinds).toLowerCase().replaceAll(',', ', ')} · graded by your instructor</p>
            </div>
          </section>
        )}

        {attachments.length > 0 && (
          <section className="card p-6">
            <h2 className="font-display font-bold">Downloads</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {attachments.map((a: any) => (
                <a key={a.id} href={a.fileUrl} className="flex items-center gap-3 rounded-xl border border-surface-line p-3 text-sm transition hover:border-brand-300 hover:bg-brand-50/40">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-lg">{a.kind === 'PDF' ? '📄' : a.kind === 'PPTX' ? '📊' : '📎'}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{a.name}</span>
                    <span className="text-xs text-ink-faint">{a.kind} · {(a.sizeKb / 1024).toFixed(1)} MB</span>
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        <CompleteLessonButton
          lessonId={lesson.id}
          completed={doneSet.has(lesson.id)}
          nextHref={next ? `/learn/${course.slug}/${next.id}` : null}
        />

        {/* Discussion */}
        <section className="card p-6">
          <h2 className="font-display font-bold">💬 Discussion</h2>
          <div className="mt-4 space-y-4">
            {discussion.map((d: any, i: number) => (
              <div key={i} className={`rounded-xl p-4 ${d.isAnswer ? 'bg-emerald-50' : 'bg-surface-soft'}`}>
                <p className="text-xs font-bold">
                  {d.userName}
                  {d.role === 'INSTRUCTOR' && <span className="ml-2 chip bg-brand-600 text-white !text-[10px]">Instructor</span>}
                  {d.isAnswer ? <span className="ml-2 text-emerald-600">✓ Best answer</span> : null}
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-soft">{d.body}</p>
                <p className="mt-2 text-xs text-ink-faint">👍 {d.likes}</p>
              </div>
            ))}
            <textarea className="input" rows={2} placeholder="Ask a question about this lesson…" />
            <button className="btn-ghost !py-2 text-xs">Post question</button>
          </div>
        </section>
      </div>
    </div>
  );
}
