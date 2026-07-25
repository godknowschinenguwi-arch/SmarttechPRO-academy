'use client';
import { useMemo, useState } from 'react';
import { APPLIANCE_LIBRARY, APPLIANCE_CATEGORIES } from '@/lib/solar/appliances';
import type { LoadItem } from '@/lib/solar/types';

let nextId = 1;
function newId() {
  nextId += 1;
  return `load-${Date.now()}-${nextId}`;
}

export default function LoadBuilder({
  loads,
  onChange,
  systemType,
}: {
  loads: LoadItem[];
  onChange: (loads: LoadItem[]) => void;
  systemType: string;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');

  const filtered = useMemo(() => {
    return APPLIANCE_LIBRARY.filter((a) => {
      const matchesCategory = category === 'All' || a.category === category;
      const matchesQuery = a.name.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  function addAppliance(id: string) {
    const def = APPLIANCE_LIBRARY.find((a) => a.id === id);
    if (!def) return;
    const item: LoadItem = {
      id: newId(),
      applianceId: def.id,
      name: def.name,
      category: def.category,
      icon: def.icon,
      watts: def.watts,
      qty: def.defaultQty,
      hours: def.defaultHours,
      surgeFactor: def.surgeFactor,
      essential: false,
    };
    onChange([...loads, item]);
  }

  function addCustom() {
    const item: LoadItem = {
      id: newId(),
      applianceId: 'custom',
      name: 'Custom load',
      category: 'Custom',
      icon: '⚙️',
      watts: 100,
      qty: 1,
      hours: 2,
      surgeFactor: 1,
      essential: false,
    };
    onChange([...loads, item]);
  }

  function update(id: string, patch: Partial<LoadItem>) {
    onChange(loads.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function remove(id: string) {
    onChange(loads.filter((l) => l.id !== id));
  }

  const dailyWh = loads.reduce((s, l) => s + l.watts * l.qty * l.hours, 0);
  const peakW = loads.reduce((s, l) => s + l.watts * l.qty, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Appliance library */}
      <div className="card flex flex-col gap-3 p-4">
        <h3 className="font-display text-sm font-bold text-ink">Appliance library</h3>
        <input
          className="input"
          placeholder="Search appliances…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          {['All', ...APPLIANCE_CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`chip border transition ${
                category === c
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-surface-line bg-white text-ink-soft hover:border-brand-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex max-h-[420px] flex-col gap-1 overflow-y-auto pr-1">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => addAppliance(a.id)}
              className="flex items-center justify-between rounded-xl border border-surface-line px-3 py-2 text-left text-sm hover:border-brand-300 hover:bg-brand-50"
            >
              <span className="flex items-center gap-2">
                <span>{a.icon}</span>
                <span className="font-medium text-ink">{a.name}</span>
              </span>
              <span className="text-xs font-semibold text-ink-faint">{a.watts}W</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="p-3 text-center text-xs text-ink-faint">No matches.</p>}
        </div>
        <button onClick={addCustom} className="btn-ghost w-full !py-2 text-xs">
          + Add custom load
        </button>
      </div>

      {/* Load list */}
      <div className="flex flex-col gap-3">
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-[1.6fr_84px_64px_72px_64px_28px] gap-2 border-b border-surface-line bg-surface-soft px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint md:grid">
            <span>Appliance</span>
            <span>Watts</span>
            <span>Qty</span>
            <span>Hrs/day</span>
            <span>{systemType === 'HYBRID' ? 'Backup' : ''}</span>
            <span />
          </div>
          <div className="divide-y divide-surface-line">
            {loads.length === 0 && (
              <p className="p-8 text-center text-sm text-ink-faint">
                Add appliances from the library to build your load profile.
              </p>
            )}
            {loads.map((l) => (
              <div key={l.id} className="grid grid-cols-2 items-end gap-2 px-4 py-3 md:grid-cols-[1.6fr_84px_64px_72px_64px_28px] md:items-center">
                <span className="col-span-2 flex items-center gap-2 text-sm font-semibold text-ink md:col-span-1">
                  <span>{l.icon}</span> {l.name}
                </span>
                <label className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Watts</span>
                  <input
                    type="number"
                    min={0}
                    className="input-compact"
                    value={l.watts}
                    onChange={(e) => update(l.id, { watts: Number(e.target.value) || 0 })}
                  />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Qty</span>
                  <input
                    type="number"
                    min={0}
                    className="input-compact"
                    value={l.qty}
                    onChange={(e) => update(l.id, { qty: Math.max(0, Number(e.target.value) || 0) })}
                  />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Hrs/day</span>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    step={0.1}
                    className="input-compact"
                    value={l.hours}
                    onChange={(e) => update(l.id, { hours: Math.min(24, Math.max(0, Number(e.target.value) || 0)) })}
                  />
                </label>
                {systemType === 'HYBRID' ? (
                  <label className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Backup</span>
                    <input
                      type="checkbox"
                      checked={l.essential}
                      onChange={(e) => update(l.id, { essential: e.target.checked })}
                      className="h-4 w-4 accent-accent-500"
                      title="Keep this load on battery backup"
                    />
                  </label>
                ) : (
                  <span />
                )}
                <button onClick={() => remove(l.id)} className="justify-self-end text-ink-faint hover:text-rose-600 md:justify-self-auto" aria-label="Remove">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Daily energy" value={`${(dailyWh / 1000).toFixed(2)} kWh`} />
          <Stat label="Peak load" value={`${(peakW / 1000).toFixed(2)} kW`} />
          <Stat label="Appliances" value={String(loads.length)} />
          <Stat label="Avg. use" value={loads.length ? `${(loads.reduce((s, l) => s + l.hours, 0) / loads.length).toFixed(1)} hrs` : '—'} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3 text-center">
      <p className="font-display text-lg font-bold text-brand-700">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  );
}
