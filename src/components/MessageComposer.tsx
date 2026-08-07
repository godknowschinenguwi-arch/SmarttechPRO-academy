'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MessageComposer({ recipientId }: { recipientId: string }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function send() {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId, body }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? 'Could not send message.');
    setText('');
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-3">
        <textarea
          className="input min-h-[48px] flex-1 resize-none"
          placeholder="Write a message… (Enter to send, Shift+Enter for a new line)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
          }}
        />
        <button type="submit" disabled={busy || !text.trim()} className="btn-primary">{busy ? 'Sending…' : 'Send'}</button>
      </form>
    </div>
  );
}
