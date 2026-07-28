'use client';
import { useState } from 'react';
import { computeCctvDesign, DEFAULT_CCTV_CATALOG } from '@/lib/cctv/engine';
import { Price } from '@/components/CurrencyProvider';
import type { CctvScenario, CameraPoint, CctvConfig, CctvCatalog } from '@/lib/cctv/types';

export default function ScenarioCompare({
  scenarios,
  loading = false,
  error = '',
  signedIn = false,
  currentPoints,
  currentConfig,
  catalog = DEFAULT_CCTV_CATALOG,
  onSave,
  onLoad,
  onDelete,
}: {
  scenarios: CctvScenario[];
  loading?: boolean;
  error?: string;
  signedIn?: boolean;
  currentPoints: CameraPoint[];
  currentConfig: CctvConfig;
  catalog?: CctvCatalog;
  onSave: (name: string) => void | Promise<void>;
  onLoad: (scenario: CctvScenario) => void;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className={`card p-4 text-sm ${signedIn ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-brand-200 bg-brand-50 text-brand-800'}`}>
        {signedIn
          ? '☁️ Signed in — designs you save here are stored on your account and available on any device.'
          : '💾 Designs are saved to this browser only. Sign in to sync your saved designs to your account and access them anywhere.'}
      </div>

      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          className="input flex-1"
          placeholder="Name this design (e.g. Warehouse perimeter cameras)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="btn-primary disabled:opacity-50"
          disabled={saving}
          onClick={async () => {
            const finalName = name.trim() || `Design ${scenarios.length + 1}`;
            setSaving(true);
            try {
              await onSave(finalName);
              setName('');
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? 'Saving…' : signedIn ? 'Save to my account' : 'Save current design'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-sm text-ink-faint">Loading your saved designs…</div>
      ) : scenarios.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-faint">
          Save designs above to compare different camera layouts or NVR specs side by side.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-surface-line bg-surface-soft text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-2.5">Design</th>
                <th className="px-4 py-2.5">Cameras</th>
                <th className="px-4 py-2.5">NVR</th>
                <th className="px-4 py-2.5">Storage</th>
                <th className="px-4 py-2.5 text-right">Cost</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-line">
              {scenarios.map((s) => {
                const d = computeCctvDesign(s.points, s.config, catalog);
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-semibold text-ink">{s.name}</td>
                    <td className="px-4 py-3">{d.cameraCount}</td>
                    <td className="px-4 py-3">{d.nvr.channels}CH</td>
                    <td className="px-4 py-3">{d.totalStorageTb.toFixed(1)} TB</td>
                    <td className="px-4 py-3 text-right font-bold text-brand-700"><Price cents={d.totalUsd * 100} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => onLoad(s)} className="text-xs font-bold text-brand-700 hover:underline">Load</button>
                        <button onClick={() => onDelete(s.id)} className="text-xs font-bold text-rose-600 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
