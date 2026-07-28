'use client';
import { useState } from 'react';

export interface ColumnSpec<T> {
  key: keyof T;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  options?: string[];
  step?: number;
}

export type WithMeta<T> = T & { active: boolean };

// Generic spreadsheet-style CRUD table for an admin-editable equipment
// catalog, shared across the Solar/Electric Fence/CCTV calculators. Each
// domain supplies its own column spec, empty-row defaults, and REST base
// path (POST to create, PATCH/DELETE at {apiBase}/{id}).
export default function CatalogTable<T extends Record<string, unknown>>({
  apiBase,
  columns,
  initialRows,
  emptyRow,
}: {
  apiBase: string;
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
      const res = await fetch(`${apiBase}/${id}`, {
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
      const res = await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
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
      const res = await fetch(apiBase, {
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

  function renderInput(col: ColumnSpec<T>, value: unknown, onChange: (v: unknown) => void) {
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
