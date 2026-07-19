import { NextRequest, NextResponse } from 'next/server';
import { get, insert, run } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { lessonId, completed = true, secondsWatched = 0 } = await req.json().catch(() => ({}));
  const lesson = await get<any>(
    'SELECT l.id, m.courseId FROM Lesson l JOIN Module m ON m.id = l.moduleId WHERE l.id = ?', [lessonId]);
  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

  const existing = await get<any>('SELECT id FROM LessonProgress WHERE userId = ? AND lessonId = ?', [user.id, lessonId]);
  if (existing) {
    await run(
      "UPDATE LessonProgress SET completed = ?, secondsWatched = MAX(secondsWatched, ?), completedAt = CASE WHEN ? THEN datetime('now') ELSE completedAt END WHERE id = ?",
      [completed ? 1 : 0, secondsWatched, completed ? 1 : 0, existing.id]);
  } else {
    await insert('LessonProgress', { userId: user.id, lessonId, completed, secondsWatched, completedAt: completed ? new Date() : null });
    if (completed) await run('UPDATE User SET xp = xp + 25 WHERE id = ?', [user.id]); // XP per lesson
  }

  // Recompute course progress
  const totals = await get<any>(
    `SELECT
      (SELECT COUNT(*) FROM Lesson l JOIN Module m ON m.id = l.moduleId WHERE m.courseId = ?) AS total,
      (SELECT COUNT(*) FROM LessonProgress lp JOIN Lesson l ON l.id = lp.lessonId JOIN Module m ON m.id = l.moduleId
        WHERE m.courseId = ? AND lp.userId = ? AND lp.completed = 1) AS done`,
    [lesson.courseId, lesson.courseId, user.id]);
  const pct = totals.total ? Math.round((totals.done / totals.total) * 100) : 0;
  await run("UPDATE Enrollment SET progressPct = ?, status = CASE WHEN ? >= 100 THEN 'COMPLETED' ELSE status END, completedAt = CASE WHEN ? >= 100 THEN datetime('now') ELSE completedAt END WHERE userId = ? AND courseId = ?",
    [pct, pct, pct, user.id, lesson.courseId]);

  // Auto-issue certificate at 100%
  if (pct >= 100) {
    const has = await get('SELECT id FROM Certificate WHERE userId = ? AND courseId = ?', [user.id, lesson.courseId]);
    if (!has) {
      const course = await get<any>('SELECT title, durationHours, certificateEnabled FROM Course WHERE id = ?', [lesson.courseId]);
      if (course?.certificateEnabled) {
        const serial = `STA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900000) + 100000)}`;
        await insert('Certificate', { serial, userId: user.id, courseId: lesson.courseId, hoursCompleted: course.durationHours });
        await insert('Notification', {
          userId: user.id, kind: 'CERT_READY', title: 'Certificate ready 🎓',
          body: `Your certificate for “${course.title}” has been issued.`, href: '/dashboard',
        });
      }
    }
  }

  return NextResponse.json({ ok: true, progressPct: pct });
}
