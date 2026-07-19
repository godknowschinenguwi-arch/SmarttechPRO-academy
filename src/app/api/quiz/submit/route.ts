import { NextRequest, NextResponse } from 'next/server';
import { all, get, insert, run } from '@/lib/db';
import { currentUser } from '@/lib/auth';

// Auto-grading: MCQ / TRUE_FALSE / IMAGE_MCQ by option index, FILL_BLANK by accepted answers.
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { quizId, answers } = await req.json().catch(() => ({}));
  const quiz = await get<any>('SELECT * FROM Quiz WHERE id = ?', [quizId]);
  if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

  const questions = await all<any>('SELECT * FROM Question WHERE quizId = ? ORDER BY "order"', [quizId]);
  let earned = 0, possible = 0;
  const detail: Record<string, boolean> = {};

  for (const q of questions) {
    possible += q.points;
    const given = answers?.[q.id];
    const correct = JSON.parse(q.answer);
    let ok = false;
    if (q.kind === 'FILL_BLANK') {
      ok = typeof given === 'string' && correct.some((a: string) => a.toLowerCase().trim() === given.toLowerCase().trim());
    } else {
      ok = Number(given) === Number(correct[0]);
    }
    if (ok) earned += q.points;
    detail[q.id] = ok;
  }

  const scorePct = possible ? Math.round((earned / possible) * 100) : 0;
  const passed = scorePct >= quiz.passMarkPct;
  await insert('QuizAttempt', { quizId, userId: user.id, scorePct, passed, answers: JSON.stringify(answers ?? {}) });
  if (passed) {
    await run('UPDATE User SET xp = xp + ? WHERE id = ?', [quiz.isFinalExam ? 200 : 50, user.id]);
    if (scorePct === 100) {
      const badge = await get<any>("SELECT id FROM Badge WHERE key = 'quiz-ace'", []);
      if (badge) {
        const has = await get('SELECT id FROM UserBadge WHERE userId = ? AND badgeId = ?', [user.id, badge.id]);
        if (!has) await insert('UserBadge', { userId: user.id, badgeId: badge.id });
      }
    }
  }
  await insert('Notification', {
    userId: user.id, kind: 'QUIZ_RESULT', title: passed ? `Quiz passed — ${scorePct}%` : `Quiz result — ${scorePct}%`,
    body: passed ? 'Well done! Keep the streak going.' : `You need ${quiz.passMarkPct}% to pass. Review the lesson and try again.`,
  });

  return NextResponse.json({ ok: true, scorePct, passed, passMarkPct: quiz.passMarkPct, detail });
}
