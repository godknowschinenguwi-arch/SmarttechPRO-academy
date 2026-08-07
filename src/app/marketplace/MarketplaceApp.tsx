'use client';
import { useEffect, useState } from 'react';
import { Price } from '@/components/CurrencyProvider';
import { whatsappLinkTo } from '@/lib/contact';

interface OpenLead {
  id: string;
  source: string;
  summary: string;
  city: string | null;
  totalUsd: number;
  createdAt: string;
}

interface MyLead {
  id: string;
  source: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  message: string | null;
  summary: string;
  totalUsd: number;
  status: string;
  claimedAt: string | null;
  createdAt: string;
}

const SOURCE_LABEL: Record<string, string> = { SOLAR: '⚡ Solar', FENCE: '🔌 Fence', CCTV: '📹 CCTV', WIRING: '🔧 Wiring' };
const STATUSES = ['CLAIMED', 'CONTACTED', 'CONVERTED', 'CLOSED'];
const STATUS_STYLE: Record<string, string> = {
  CLAIMED: 'bg-brand-50 text-brand-700 border-brand-200',
  CONTACTED: 'bg-amber-50 text-amber-700 border-amber-200',
  CONVERTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-surface-soft text-ink-faint border-surface-line',
};

export default function MarketplaceApp() {
  const [tab, setTab] = useState<'open' | 'mine'>('open');
  const [open, setOpen] = useState<OpenLead[]>([]);
  const [mine, setMine] = useState<MyLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/marketplace/leads');
      const data = await res.json();
      setOpen(data.open ?? []);
      setMine(data.mine ?? []);
    } catch {
      setError('Could not load the marketplace. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function claim(id: string) {
    setClaimingId(id);
    setError('');
    try {
      const res = await fetch(`/api/marketplace/leads/${id}/claim`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not claim this lead.');
        await load();
        return;
      }
      await load();
      setTab('mine');
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setClaimingId(null);
    }
  }

  async function updateStatus(id: string, status: string) {
    setMine((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await fetch(`/api/marketplace/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {
      // optimistic update stands; a refresh will resync if it failed
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-xl border border-surface-line bg-white p-1 w-fit">
        <button
          onClick={() => setTab('open')}
          className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${tab === 'open' ? 'bg-brand-600 text-white shadow-lift' : 'text-ink-soft hover:bg-surface-soft'}`}
        >
          Open leads ({open.length})
        </button>
        <button
          onClick={() => setTab('mine')}
          className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${tab === 'mine' ? 'bg-brand-600 text-white shadow-lift' : 'text-ink-soft hover:bg-surface-soft'}`}
        >
          My claimed leads ({mine.length})
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</div>}

      {loading ? (
        <div className="card p-8 text-center text-sm text-ink-faint">Loading…</div>
      ) : tab === 'open' ? (
        open.length === 0 ? (
          <div className="card p-8 text-center text-sm text-ink-faint">No open leads right now — check back soon.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {open.map((l) => (
              <div key={l.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip bg-surface-soft text-ink-soft">{SOURCE_LABEL[l.source] ?? l.source}</span>
                    <p className="font-display text-sm font-bold text-ink">{l.summary}</p>
                  </div>
                  <p className="mt-1 text-xs text-ink-faint">
                    {l.city ? `📍 ${l.city} · ` : ''}<Price cents={l.totalUsd * 100} /> estimated · {new Date(l.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={() => claim(l.id)} disabled={claimingId === l.id} className="btn-primary shrink-0 disabled:opacity-50">
                  {claimingId === l.id ? 'Claiming…' : 'Claim this lead'}
                </button>
              </div>
            ))}
          </div>
        )
      ) : mine.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-faint">You haven&apos;t claimed any leads yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {mine.map((l) => (
            <div key={l.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip bg-surface-soft text-ink-soft">{SOURCE_LABEL[l.source] ?? l.source}</span>
                  <p className="font-display text-sm font-bold text-ink">{l.name}</p>
                  <span className={`chip border text-[10px] ${STATUS_STYLE[l.status] ?? STATUS_STYLE.CLAIMED}`}>{l.status}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-faint">
                  📞 {l.phone}{l.email ? ` · ✉️ ${l.email}` : ''}{l.city ? ` · 📍 ${l.city}` : ''}
                </p>
                <p className="mt-1 text-xs text-ink-faint">{l.summary} · <Price cents={l.totalUsd * 100} /></p>
                {l.message && <p className="mt-2 rounded-lg bg-surface-soft p-2 text-xs text-ink-soft">{l.message}</p>}
                <a
                  href={whatsappLinkTo(l.phone, `Hi ${l.name.split(' ')[0]}, this is a SmartTech-certified installer following up on your ${SOURCE_LABEL[l.source]?.replace(/^\S+\s/, '') ?? l.source} quote request.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs font-bold text-emerald-700 hover:underline"
                >
                  💬 Contact via WhatsApp
                </a>
              </div>
              <select
                className="input w-full !py-2 text-xs sm:w-40"
                value={l.status}
                onChange={(e) => updateStatus(l.id, e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
