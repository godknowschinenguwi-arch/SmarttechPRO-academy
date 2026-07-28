'use client';
import { useState } from 'react';

export interface DiscussionPost {
  id?: string;
  body: string;
  likes: number;
  isAnswer: boolean;
  userName: string;
  role: string;
}

export default function CourseDiscussion({ courseId, initialPosts }: { courseId: string; initialPosts: DiscussionPost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!text.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, body: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not post your message.');
        return;
      }
      setPosts((prev) => [...prev, data.post]);
      setText('');
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      {posts.length === 0 && <p className="text-sm text-ink-faint">No questions yet — be the first to ask.</p>}
      {posts.map((d, i) => (
        <div key={d.id ?? i} className={`rounded-xl p-4 ${d.isAnswer ? 'bg-emerald-50' : 'bg-surface-soft'}`}>
          <p className="text-xs font-bold">
            {d.userName}
            {d.role === 'INSTRUCTOR' && <span className="ml-2 chip bg-brand-600 text-white !text-[10px]">Instructor</span>}
            {d.isAnswer ? <span className="ml-2 text-emerald-600">✓ Best answer</span> : null}
          </p>
          <p className="mt-1 text-sm leading-6 text-ink-soft">{d.body}</p>
          <p className="mt-2 text-xs text-ink-faint">👍 {d.likes}</p>
        </div>
      ))}
      <textarea
        className="input"
        rows={2}
        placeholder="Ask a question about this lesson…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
      <button onClick={submit} disabled={busy || !text.trim()} className="btn-ghost !py-2 text-xs disabled:opacity-50">
        {busy ? 'Posting…' : 'Post question'}
      </button>
    </div>
  );
}
