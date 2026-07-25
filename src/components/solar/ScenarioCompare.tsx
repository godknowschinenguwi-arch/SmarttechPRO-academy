'use client';
import { useState } from 'react';
import { computeSystemDesign } from '@/lib/solar/engine';
import { Price } from '@/components/CurrencyProvider';
import type { Scenario, LoadItem, SiteConfig } from '@/lib/solar/types';

const TYPE_LABEL: Record<string, string> = { OFF_GRID: 'Off-grid', HYBRID: 'Hybrid', GRID_TIED: 'Grid-tied' };

export default function ScenarioCompare({
  scenarios,
  currentLoads,
  currentSite,
  onSave,
  onLoad,
  onDelete,
}: {
  scenarios: Scenario[];
  currentLoads: LoadItem[];
  currentSite: SiteConfig;
  onSave: (name: string) => void;
  onLoad: (scenario: Scenario) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState('');

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          className="input flex-1"
          placeholder="Name this design (e.g. Budget off-grid)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="btn-primary"
          onClick={() => {
            const finalName = name.trim() || `Design ${scenarios.length + 1}`;
            onSave(finalName);
            setName('');
          }}
        >
          Save current design
        </button>
      </div>

      {scenarios.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-faint">
          Save designs above to compare budget vs. premium, or off-grid vs. hybrid, side by side.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-surface-line bg-surface-soft text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-2.5">Design</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Array</th>
                <th className="px-4 py-2.5">Battery</th>
                <th className="px-4 py-2.5">Inverter</th>
                <th className="px-4 py-2.5 text-right">Cost</th>
                <th className="px-4 py-2.5 text-right">Payback</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-line">
              {scenarios.map((s) => {
                const d = computeSystemDesign(s.loads, s.site);
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-semibold text-ink">{s.name}</td>
                    <td className="px-4 py-3 text-ink-faint">{TYPE_LABEL[s.site.systemType]}</td>
                    <td className="px-4 py-3">{(d.arrayWpActual / 1000).toFixed(2)} kWp</td>
                    <td className="px-4 py-3">{d.batteryTotalCount ? `${d.batteryUsableKwh.toFixed(1)} kWh` : '—'}</td>
                    <td className="px-4 py-3">{((d.inverter.continuousW * d.inverterCount) / 1000).toFixed(1)} kW</td>
                    <td className="px-4 py-3 text-right font-bold text-brand-700"><Price cents={d.totalUsd * 100} /></td>
                    <td className="px-4 py-3 text-right">{d.paybackYears ? `${d.paybackYears.toFixed(1)} yrs` : '—'}</td>
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
