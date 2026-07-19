'use client';
import { useState } from 'react';

type Q = { id: string; kind: string; prompt: string; options: string; imageUrl: string | null };

export default function QuizPlayer({ quizId, questions, passMarkPct }: {
  quizId: string; questions: Q[]; passMarkPct: number;
}) {
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [result, setResult] = useState<{ scorePct: number; passed: boolean; detail: Record<string, boolean> } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setBusy(true);
    setError('');
    const res = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId, answers }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? 'Could not submit quiz.');
    setResult(data);
  }

  return (
    <div className="space-y-6">
      {result && (
        <div className={`rounded-2xl p-5 text-center ${result.passed ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          <p className="font-display text-3xl font-bold">{result.scorePct}%</p>
          <p className={`mt-1 text-sm font-semibold ${result.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
            {result.passed ? `Passed — pass mark ${passMarkPct}%. +${result.scorePct === 100 ? '50 XP & Quiz Ace badge' : '50 XP'}` : `Not yet — you need ${passMarkPct}%. Review the lesson and retry.`}
          </p>
        </div>
      )}

      {questions.map((q, i) => {
        const opts: string[] = JSON.parse(q.options || '[]');
        const verdict = result?.detail?.[q.id];
        return (
          <div key={q.id} className={`card p-5 ${result ? (verdict ? 'ring-1 ring-emerald-300' : 'ring-1 ring-rose-300') : ''}`}>
            <p className="text-sm font-bold">
              <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-brand-50 text-xs text-brand-700">{i + 1}</span>
              {q.prompt}
            </p>
            {q.kind === 'FILL_BLANK' ? (
              <input
                className="input mt-3"
                placeholder="Type your answer…"
                disabled={!!result}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              />
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {opts.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                      answers[q.id] === oi ? 'border-brand-500 bg-brand-50 font-semibold text-brand-800' : 'border-surface-line bg-white hover:border-brand-200'
                    }`}
                  >
                    <input
                      type="radio" name={q.id} className="accent-brand-600" disabled={!!result}
                      checked={answers[q.id] === oi} onChange={() => setAnswers({ ...answers, [q.id]: oi })}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
      {!result ? (
        <button onClick={submit} disabled={busy || Object.keys(answers).length < questions.length} className="btn-primary w-full sm:w-auto">
          {busy ? 'Grading…' : 'Submit Answers'}
        </button>
      ) : (
        !result.passed && (
          <button onClick={() => { setResult(null); setAnswers({}); }} className="btn-ghost w-full sm:w-auto">Try Again</button>
        )
      )}
    </div>
  );
}
