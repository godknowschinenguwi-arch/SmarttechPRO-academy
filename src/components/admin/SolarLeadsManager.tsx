'use client';
import { useState } from 'react';
import { Price } from '@/components/CurrencyProvider';

export interface SolarLeadRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  message: string | null;
  systemType: string;
  totalUsd: number;
  arrayWpActual: number;
  batteryUsableKwh: number;
  status: string;
  createdAt: string;
}

const STATUSES = ['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'];
const STATUS_STYLE: Record<string, string> = {
  NEW: 'bg-brand-50 text-brand-700 border-brand-200',
  CONTACTED: 'bg-amber-50 text-amber-700 border-amber-200',
  CONVERTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-surface-soft text-ink-faint border-surface-line',
};

export default function SolarLeadsManager({ leads: initial }: { leads: SolarLeadRow[] }) {
  const [leads, setLeads] = useState(initial);
  const [filter, setFilter] = useState<string>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setBusyId(id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await fetch(`/api/admin/solar-leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } finally {
      setBusyId(null);
    }
  }

  const visible = filter === 'ALL' ? leads : leads.filter((l) => l.status === filter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {['ALL', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`chip border ${filter === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-surface-line bg-white text-ink-soft hover:border-brand-300'}`}
          >
            {s === 'ALL' ? `All (${leads.length})` : `${s} (${leads.filter((l) => l.status === s).length})`}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-faint">No leads in this category yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((l) => (
            <div key={l.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-sm font-bold text-ink">{l.name}</p>
                  <span className={`chip border text-[10px] ${STATUS_STYLE[l.status] ?? STATUS_STYLE.NEW}`}>{l.status}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-faint">
                  📞 {l.phone}{l.email ? ` · ✉️ ${l.email}` : ''}{l.city ? ` · 📍 ${l.city}` : ''}
                </p>
                <p className="mt-1 text-xs text-ink-faint">
                  {l.systemType.replace('_', '-')} · {(l.arrayWpActual / 1000).toFixed(2)}kWp
                  {l.batteryUsableKwh ? ` · ${l.batteryUsableKwh.toFixed(1)}kWh battery` : ''} ·{' '}
                  <Price cents={l.totalUsd * 100} />
                </p>
                {l.message && <p className="mt-2 rounded-lg bg-surface-soft p-2 text-xs text-ink-soft">{l.message}</p>}
                <p className="mt-1 text-[10.5px] text-ink-faint">{new Date(l.createdAt).toLocaleString()}</p>
              </div>
              <select
                className="input w-full !py-2 text-xs sm:w-40"
                value={l.status}
                disabled={busyId === l.id}
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
