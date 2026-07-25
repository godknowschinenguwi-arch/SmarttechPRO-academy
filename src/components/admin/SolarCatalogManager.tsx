'use client';
import { useState } from 'react';
import type { CatalogPanel, CatalogBattery, CatalogInverter, CatalogController } from '@/lib/solar/types';

type Kind = 'panel' | 'battery' | 'inverter' | 'controller';
type WithMeta<T> = T & { active: boolean };

interface ColumnSpec<T> {
  key: keyof T;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  options?: string[];
  step?: number;
}

const PANEL_COLUMNS: ColumnSpec<Omit<CatalogPanel, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'wattage', label: 'Watts', type: 'number' },
  { key: 'vmp', label: 'Vmp', type: 'number', step: 0.1 },
  { key: 'imp', label: 'Imp', type: 'number', step: 0.1 },
  { key: 'voc', label: 'Voc', type: 'number', step: 0.1 },
  { key: 'isc', label: 'Isc', type: 'number', step: 0.1 },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

const BATTERY_COLUMNS: ColumnSpec<Omit<CatalogBattery, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'chemistry', label: 'Chemistry', type: 'select', options: ['LFP', 'AGM', 'GEL', 'FLOODED'] },
  { key: 'voltage', label: 'Volts', type: 'number' },
  { key: 'ah', label: 'Ah', type: 'number' },
  { key: 'maxDodPct', label: 'Max DoD', type: 'number', step: 0.05 },
  { key: 'roundTripEff', label: 'Rnd-trip eff.', type: 'number', step: 0.01 },
  { key: 'cycleLife', label: 'Cycles', type: 'number' },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

const INVERTER_COLUMNS: ColumnSpec<Omit<CatalogInverter, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'type', label: 'Type', type: 'select', options: ['OFF_GRID', 'HYBRID', 'GRID_TIE'] },
  { key: 'continuousW', label: 'Continuous W', type: 'number' },
  { key: 'surgeW', label: 'Surge W', type: 'number' },
  { key: 'mpptBuiltIn', label: 'Built-in MPPT', type: 'checkbox' },
  { key: 'efficiencyPct', label: 'Efficiency', type: 'number', step: 0.01 },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

const CONTROLLER_COLUMNS: ColumnSpec<Omit<CatalogController, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'type', label: 'Type', type: 'select', options: ['MPPT', 'PWM'] },
  { key: 'maxAmps', label: 'Max amps', type: 'number' },
  { key: 'maxPvVoltage', label: 'Max PV volts', type: 'number' },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

function emptyPanel(): Omit<CatalogPanel, 'id'> {
  return { brand: '', model: '', wattage: 450, vmp: 40, imp: 11, voc: 49, isc: 12, priceUsd: 120 };
}
function emptyBattery(): Omit<CatalogBattery, 'id'> {
  return { brand: '', model: '', chemistry: 'LFP', voltage: 12, ah: 100, maxDodPct: 0.9, roundTripEff: 0.96, cycleLife: 6000, priceUsd: 380 };
}
function emptyInverter(): Omit<CatalogInverter, 'id'> {
  return { brand: '', model: '', type: 'HYBRID', continuousW: 5000, surgeW: 10000, voltageOptions: [48], mpptBuiltIn: true, efficiencyPct: 0.97, priceUsd: 1150 };
}
function emptyController(): Omit<CatalogController, 'id'> {
  return { brand: '', model: '', type: 'MPPT', maxAmps: 60, maxPvVoltage: 150, priceUsd: 340 };
}

const TABS: { id: Kind; label: string }[] = [
  { id: 'panel', label: 'Panels' },
  { id: 'battery', label: 'Batteries' },
  { id: 'inverter', label: 'Inverters' },
  { id: 'controller', label: 'Controllers' },
];

export default function SolarCatalogManager({
  panels,
  batteries,
  inverters,
  controllers,
}: {
  panels: WithMeta<CatalogPanel>[];
  batteries: WithMeta<CatalogBattery>[];
  inverters: WithMeta<CatalogInverter>[];
  controllers: WithMeta<CatalogController>[];
}) {
  const [tab, setTab] = useState<Kind>('panel');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-xl border border-surface-line bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              tab === t.id ? 'bg-brand-600 text-white shadow-lift' : 'text-ink-soft hover:bg-surface-soft'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'panel' && <CatalogTable kind="panel" columns={PANEL_COLUMNS} initialRows={panels} emptyRow={emptyPanel()} />}
      {tab === 'battery' && <CatalogTable kind="battery" columns={BATTERY_COLUMNS} initialRows={batteries} emptyRow={emptyBattery()} />}
      {tab === 'inverter' && <CatalogTable kind="inverter" columns={INVERTER_COLUMNS} initialRows={inverters} emptyRow={emptyInverter()} />}
      {tab === 'controller' && <CatalogTable kind="controller" columns={CONTROLLER_COLUMNS} initialRows={controllers} emptyRow={emptyController()} />}
    </div>
  );
}

function CatalogTable<T extends Record<string, unknown>>({
  kind,
  columns,
  initialRows,
  emptyRow,
}: {
  kind: Kind;
  columns: ColumnSpec<T>[];
  initialRows: WithMeta<T & { id: string }>[];
  emptyRow: T;
}) {
  const [rows, setRows] = useState(initialRows);
  const [draft, setDraft] = useState<T>(emptyRow);
  const [busy, setBusy] = useState<string | null>(null);

  function patchRowLocal(id: string, fields: Record<string, unknown>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...fields } : r)));
  }

  async function save(id: string, fields: Record<string, unknown>) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/solar-catalog/${kind}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        alert('Could not save changes.');
        return;
      }
      patchRowLocal(id, fields);
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this item permanently? This cannot be undone.')) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/solar-catalog/${kind}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        alert('Could not delete item.');
        return;
      }
      setRows((rs) => rs.filter((r) => r.id !== id));
    } finally {
      setBusy(null);
    }
  }

  async function addNew() {
    setBusy('new');
    try {
      const res = await fetch(`/api/admin/solar-catalog/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        alert('Could not add item — check the fields and try again.');
        return;
      }
      const { id } = await res.json();
      setRows((rs) => [...rs, { id, active: true, ...draft } as WithMeta<T & { id: string }>]);
      setDraft(emptyRow);
    } finally {
      setBusy(null);
    }
  }

  function renderInput(
    col: ColumnSpec<T>,
    value: unknown,
    onChange: (v: unknown) => void
  ) {
    if (col.type === 'checkbox') {
      return <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-brand-600" />;
    }
    if (col.type === 'select') {
      return (
        <select className="input !py-1.5 text-xs" value={String(value)} onChange={(e) => onChange(e.target.value)}>
          {col.options?.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        type={col.type}
        step={col.step ?? 1}
        className="input !py-1.5 text-xs"
        value={value as string | number}
        onChange={(e) => onChange(col.type === 'number' ? Number(e.target.value) : e.target.value)}
      />
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-surface-line bg-surface-soft text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            {columns.map((c) => (
              <th key={String(c.key)} className="px-3 py-2">{c.label}</th>
            ))}
            <th className="px-3 py-2">Active</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-line">
          {rows.map((row) => (
            <tr key={row.id} className={row.active ? '' : 'opacity-50'}>
              {columns.map((c) => (
                <td key={String(c.key)} className="px-3 py-2">
                  {renderInput(c, row[c.key], (v) => save(row.id, { [c.key]: v }))}
                </td>
              ))}
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={row.active}
                  onChange={(e) => save(row.id, { active: e.target.checked })}
                  className="h-4 w-4 accent-emerald-600"
                />
              </td>
              <td className="px-3 py-2">
                <button
                  onClick={() => remove(row.id)}
                  disabled={busy === row.id}
                  className="text-xs font-bold text-rose-600 hover:underline disabled:opacity-40"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          <tr className="bg-brand-50/40">
            {columns.map((c) => (
              <td key={String(c.key)} className="px-3 py-2">
                {renderInput(c, draft[c.key], (v) => setDraft((d) => ({ ...d, [c.key]: v })))}
              </td>
            ))}
            <td className="px-3 py-2 text-xs text-ink-faint">—</td>
            <td className="px-3 py-2">
              <button onClick={addNew} disabled={busy === 'new'} className="btn-primary !px-3 !py-1.5 text-xs disabled:opacity-40">
                Add
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
