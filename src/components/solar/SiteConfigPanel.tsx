'use client';
import { useState } from 'react';
import { LOCATIONS } from '@/lib/solar/locations';
import type { SiteConfig, SystemType, BatteryChemistry, SystemVoltage } from '@/lib/solar/types';

const SYSTEM_TYPES: { id: SystemType; label: string; blurb: string }[] = [
  { id: 'OFF_GRID', label: 'Off-grid', blurb: 'No utility connection — panels + battery cover 100% of demand.' },
  { id: 'HYBRID', label: 'Hybrid', blurb: 'Grid-tied with battery backup for essential loads during outages.' },
  { id: 'GRID_TIED', label: 'Grid-tied', blurb: 'No battery — offsets the utility bill, shuts down in an outage.' },
];

const CHEMISTRIES: { id: BatteryChemistry; label: string }[] = [
  { id: 'LFP', label: 'Lithium (LiFePO4)' },
  { id: 'AGM', label: 'AGM lead-acid' },
  { id: 'GEL', label: 'Gel lead-acid' },
  { id: 'FLOODED', label: 'Flooded lead-acid' },
];

export default function SiteConfigPanel({
  site,
  onChange,
}: {
  site: SiteConfig;
  onChange: (site: SiteConfig) => void;
}) {
  const [advanced, setAdvanced] = useState(false);

  function set<K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) {
    onChange({ ...site, [key]: value });
  }

  function setLocation(id: string) {
    const loc = LOCATIONS.find((l) => l.id === id);
    if (loc) onChange({ ...site, locationId: id, psh: loc.psh });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card flex flex-col gap-4 p-5">
        <h3 className="font-display text-sm font-bold text-ink">Site &amp; system type</h3>

        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Client name</label>
          <input className="input" value={site.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="e.g. T. Moyo Residence" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Site / address</label>
          <input className="input" value={site.siteName} onChange={(e) => set('siteName', e.target.value)} placeholder="e.g. 12 Borrowdale Rd, Harare" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Location (peak sun hours)</label>
          <select className="input" value={site.locationId} onChange={(e) => setLocation(e.target.value)}>
            {LOCATIONS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}{l.country !== '—' ? `, ${l.country}` : ''} — {l.psh.toFixed(1)} PSH
              </option>
            ))}
          </select>
          {site.locationId === 'custom' && (
            <input
              type="number"
              step={0.1}
              min={2}
              max={8}
              className="input mt-2"
              value={site.psh}
              onChange={(e) => set('psh', Number(e.target.value) || 0)}
              placeholder="Peak sun hours / day"
            />
          )}
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold text-ink-soft">System type</label>
          <div className="grid gap-2">
            {SYSTEM_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => set('systemType', t.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  site.systemType === t.id ? 'border-brand-600 bg-brand-50' : 'border-surface-line hover:border-brand-300'
                }`}
              >
                <p className={`text-sm font-bold ${site.systemType === t.id ? 'text-brand-700' : 'text-ink'}`}>{t.label}</p>
                <p className="text-xs text-ink-faint">{t.blurb}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card flex flex-col gap-4 p-5">
        <h3 className="font-display text-sm font-bold text-ink">Battery &amp; backup</h3>

        <fieldset disabled={site.systemType === 'GRID_TIED'} className="flex flex-col gap-4 disabled:opacity-40">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-soft">Battery chemistry</label>
            <select className="input" value={site.batteryChemistry} onChange={(e) => set('batteryChemistry', e.target.value as BatteryChemistry)}>
              {CHEMISTRIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 flex justify-between text-xs font-semibold text-ink-soft">
              <span>Autonomy (backup days)</span> <span>{site.autonomyDays} day{site.autonomyDays !== 1 ? 's' : ''}</span>
            </label>
            <input
              type="range" min={0.5} max={5} step={0.5}
              value={site.autonomyDays}
              onChange={(e) => set('autonomyDays', Number(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-soft">System (bus) voltage</label>
            <div className="flex gap-2">
              {[12, 24, 48].map((v) => (
                <button
                  key={v}
                  onClick={() => set('systemVoltage', v as SystemVoltage)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-bold transition ${
                    site.systemVoltage === v ? 'border-brand-600 bg-brand-600 text-white' : 'border-surface-line text-ink-soft hover:border-brand-300'
                  }`}
                >
                  {v}V
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        <div className="border-t border-surface-line pt-4">
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Monthly grid bill (USD)</label>
          <input type="number" min={0} className="input" value={site.monthlyGridBillUsd} onChange={(e) => set('monthlyGridBillUsd', Number(e.target.value) || 0)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Grid tariff (USD/kWh)</label>
          <input type="number" min={0} step={0.01} className="input" value={site.tariffUsdPerKwh} onChange={(e) => set('tariffUsdPerKwh', Number(e.target.value) || 0)} />
        </div>

        <button onClick={() => setAdvanced((v) => !v)} className="text-left text-xs font-bold text-brand-700 hover:underline">
          {advanced ? 'Hide' : 'Show'} advanced engineering parameters
        </button>
        {advanced && (
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-surface-soft p-3">
            <PctField label="Panel derating" value={site.panelDeratingPct} onChange={(v) => set('panelDeratingPct', v)} />
            <PctField label="Inverter efficiency" value={site.inverterEfficiencyPct} onChange={(v) => set('inverterEfficiencyPct', v)} />
            <PctField label="Wiring loss" value={site.wiringLossPct} onChange={(v) => set('wiringLossPct', v)} />
            <PctField label="Install/BOS buffer" value={site.installBufferPct} onChange={(v) => set('installBufferPct', v)} />
          </div>
        )}
      </div>
    </div>
  );
}

function PctField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-ink-soft">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number" min={0} max={100} step={1}
          className="input !py-1.5 text-sm"
          value={Math.round(value * 100)}
          onChange={(e) => onChange(Math.min(1, Math.max(0, Number(e.target.value) || 0)) / 100)}
        />
        <span className="text-xs text-ink-faint">%</span>
      </div>
    </div>
  );
}
