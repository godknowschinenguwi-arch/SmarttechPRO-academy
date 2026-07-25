'use client';
import { useEffect, useRef, useState } from 'react';
import { DEFAULT_CATALOG } from '@/lib/solar/engine';
import type { LoadItem, SiteConfig, SolarCatalog } from '@/lib/solar/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_PROMPTS = [
  'Why do I need this many panels?',
  'What if I add air conditioning?',
  'Is my battery bank big enough?',
];

export default function AiAssistant({
  loads,
  site,
  catalog = DEFAULT_CATALOG,
}: {
  loads: LoadItem[];
  site: SiteConfig;
  catalog?: SolarCatalog;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading || unavailable) return;

    const next = [...messages, { role: 'user' as const, content: question }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/solar/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, loads, site, catalog }),
      });

      if (res.status === 503) {
        setUnavailable(true);
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessages((m) => [...m, { role: 'assistant', content: err.error || 'Something went wrong. Please try again.' }]);
        return;
      }

      const data = await res.json();
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Could not reach the assistant. Please check your connection and try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[520px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-surface-line bg-white shadow-lift">
          <div className="flex items-center justify-between bg-gradient-to-r from-brand-700 to-brand-900 px-4 py-3 text-white">
            <div>
              <p className="font-display text-sm font-bold">SmartTech Solar Assistant</p>
              <p className="text-[11px] text-brand-100">Ask about your current design</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white" aria-label="Close">✕</button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-surface-soft p-3">
            {unavailable ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                The AI assistant isn't configured on this deployment yet. You can still use every other part of the calculator normally.
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-ink-faint">Try asking:</p>
                    {STARTER_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => send(p)}
                        className="rounded-xl border border-surface-line bg-white px-3 py-2 text-left text-xs font-semibold text-ink-soft hover:border-brand-300 hover:text-brand-700"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        m.role === 'user' ? 'bg-brand-600 text-white' : 'border border-surface-line bg-white text-ink'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-surface-line bg-white px-3 py-2 text-xs text-ink-faint">Thinking…</div>
                  </div>
                )}
              </>
            )}
          </div>

          {!unavailable && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-surface-line bg-white p-2"
            >
              <input
                className="input !py-2 text-xs"
                placeholder="Ask about this design…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button type="submit" disabled={loading || !input.trim()} className="btn-primary !px-3 !py-2 text-xs">
                Send
              </button>
            </form>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-2xl text-white shadow-lift transition hover:scale-105"
        aria-label="Open AI assistant"
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
