'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompleteLessonButton({ lessonId, completed, nextHref }: {
  lessonId: string; completed: boolean; nextHref: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(completed);
  const router = useRouter();

  async function markComplete() {
    setBusy(true);
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, completed: true }),
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {done ? (
        <span className="chip bg-emerald-50 text-emerald-700">✓ Lesson completed · +25 XP</span>
      ) : (
        <button onClick={markComplete} disabled={busy} className="btn-primary">
          {busy ? 'Saving…' : 'Mark as Complete'}
        </button>
      )}
      {nextHref && <a href={nextHref} className="btn-ghost">Next Lesson →</a>}
    </div>
  );
}
