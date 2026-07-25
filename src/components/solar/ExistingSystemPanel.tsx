'use client';
import type { ExistingSystem, BatteryChemistry } from '@/lib/solar/types';

const CHEMISTRIES: { id: BatteryChemistry; label: string }[] = [
  { id: 'LFP', label: 'Lithium (LiFePO4)' },
  { id: 'AGM', label: 'AGM lead-acid' },
  { id: 'GEL', label: 'Gel lead-acid' },
  { id: 'FLOODED', label: 'Flooded lead-acid' },
];

export default function ExistingSystemPanel({
  existing,
  onChange,
}: {
  existing: ExistingSystem;
  onChange: (existing: ExistingSystem) => void;
}) {
  function set<K extends keyof ExistingSystem>(key: K, value: ExistingSystem[K]) {
    onChange({ ...existing, [key]: value });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card flex flex-col gap-4 p-5">
        <h3 className="font-display text-sm font-bold text-ink">Existing array &amp; battery</h3>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Current array size (Wp)</label>
          <input
            type="number" min={0}
            className="input"
            value={existing.arrayWp}
            onChange={(e) => set('arrayWp', Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Current battery usable capacity (kWh)</label>
          <input
            type="number" min={0} step={0.1}
            className="input"
            value={existing.batteryUsableKwh}
            onChange={(e) => set('batteryUsableKwh', Math.max(0, Number(e.target.value) || 0))}
          />
          <p className="mt-1 text-[11px] text-ink-faint">Usable energy you can actually draw — nameplate capacity × depth of discharge.</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Existing battery chemistry</label>
          <select className="input" value={existing.batteryChemistry} onChange={(e) => set('batteryChemistry', e.target.value as BatteryChemistry)}>
            {CHEMISTRIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card flex flex-col gap-4 p-5">
        <h3 className="font-display text-sm font-bold text-ink">Existing inverter &amp; controller</h3>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Inverter continuous rating (W)</label>
          <input
            type="number" min={0}
            className="input"
            value={existing.inverterContinuousW}
            onChange={(e) => set('inverterContinuousW', Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Inverter surge rating (W)</label>
          <input
            type="number" min={0}
            className="input"
            value={existing.inverterSurgeW}
            onChange={(e) => set('inverterSurgeW', Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
          <input
            type="checkbox"
            checked={existing.hasController}
            onChange={(e) => set('hasController', e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          Has a separate charge controller (not built into the inverter)
        </label>
        {existing.hasController && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-soft">Charge controller max current (A)</label>
            <input
              type="number" min={0}
              className="input"
              value={existing.controllerMaxAmps}
              onChange={(e) => set('controllerMaxAmps', Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
