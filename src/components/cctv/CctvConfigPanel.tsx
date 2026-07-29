'use client';
import { useMemo } from 'react';
import { ANY_BRAND } from '@/lib/cctv/types';
import type { CctvConfig, CctvCatalog, Compression, RecordingMode, SystemType } from '@/lib/cctv/types';

export default function CctvConfigPanel({ config, catalog, onChange }: { config: CctvConfig; catalog: CctvCatalog; onChange: (config: CctvConfig) => void }) {
  function set<K extends keyof CctvConfig>(key: K, value: CctvConfig[K]) {
    onChange({ ...config, [key]: value });
  }

  const brandsForSystem = useMemo(() => {
    const set = new Set<string>();
    for (const c of catalog.cameras) if (c.systemType === config.systemType) set.add(c.brand);
    for (const n of catalog.nvrs) if (n.systemType === config.systemType) set.add(n.brand);
    return Array.from(set).sort();
  }, [catalog, config.systemType]);

  function setSystemType(next: SystemType) {
    const brands = new Set<string>();
    for (const c of catalog.cameras) if (c.systemType === next) brands.add(c.brand);
    for (const n of catalog.nvrs) if (n.systemType === next) brands.add(n.brand);
    const brand = config.brand !== ANY_BRAND && !brands.has(config.brand) ? ANY_BRAND : config.brand;
    onChange({ ...config, systemType: next, brand });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card flex flex-col gap-4 p-5">
        <h3 className="font-display text-sm font-bold text-ink">Site details</h3>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Client name</label>
          <input className="input" value={config.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="e.g. T. Moyo Residence" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Site / address</label>
          <input className="input" value={config.siteName} onChange={(e) => set('siteName', e.target.value)} placeholder="e.g. 12 Borrowdale Rd, Harare" />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold text-ink-soft">System type</label>
          <div className="grid gap-2">
            <button
              onClick={() => setSystemType('IP')}
              className={`rounded-xl border p-3 text-left transition ${config.systemType === 'IP' ? 'border-brand-600 bg-brand-50' : 'border-surface-line hover:border-brand-300'}`}
            >
              <p className={`text-sm font-bold ${config.systemType === 'IP' ? 'text-brand-700' : 'text-ink'}`}>IP cameras over PoE</p>
              <p className="text-xs text-ink-faint">Cat6 cabling, single-cable power + data, NVR.</p>
            </button>
            <button
              onClick={() => setSystemType('ANALOG')}
              className={`rounded-xl border p-3 text-left transition ${config.systemType === 'ANALOG' ? 'border-brand-600 bg-brand-50' : 'border-surface-line hover:border-brand-300'}`}
            >
              <p className={`text-sm font-bold ${config.systemType === 'ANALOG' ? 'text-brand-700' : 'text-ink'}`}>Analog cameras</p>
              <p className="text-xs text-ink-faint">Coax + separate power run, DVR.</p>
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-ink-faint">Cameras, the recorder, cabling and PoE gear all follow this choice — the design never mixes IP and analog equipment.</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Brand</label>
          <select className="input" value={config.brand} onChange={(e) => set('brand', e.target.value)}>
            <option value={ANY_BRAND}>Any brand (cheapest suitable match)</option>
            {brandsForSystem.map((b) => (
              <option key={b} value={b}>{b} only</option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-ink-faint">Locking a brand keeps cameras and the {config.systemType === 'IP' ? 'NVR' : 'DVR'} from the same manufacturer — no mixed-brand systems.</p>
        </div>

        <div className="border-t border-surface-line pt-4">
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Notes for the installer</label>
          <textarea className="input" rows={3} value={config.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Access restrictions, existing trunking, monitor/viewing requirements…" />
        </div>
      </div>

      <div className="card flex flex-col gap-4 p-5">
        <h3 className="font-display text-sm font-bold text-ink">Recording &amp; storage</h3>

        <div>
          <label className="mb-1 flex justify-between text-xs font-semibold text-ink-soft">
            <span>Frame rate</span> <span>{config.frameRate} fps</span>
          </label>
          <input type="range" min={5} max={30} step={1} value={config.frameRate} onChange={(e) => set('frameRate', Number(e.target.value))} className="w-full accent-brand-600" />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold text-ink-soft">Compression</label>
          <div className="flex gap-2">
            {(['H264', 'H265'] as Compression[]).map((c) => (
              <button
                key={c}
                onClick={() => set('compression', c)}
                className={`flex-1 rounded-lg border py-2 text-sm font-bold transition ${config.compression === c ? 'border-brand-600 bg-brand-600 text-white' : 'border-surface-line text-ink-soft hover:border-brand-300'}`}
              >
                {c === 'H265' ? 'H.265 (efficient)' : 'H.264 (compatible)'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold text-ink-soft">Recording mode</label>
          <div className="flex gap-2">
            {(['CONTINUOUS', 'MOTION'] as RecordingMode[]).map((m) => (
              <button
                key={m}
                onClick={() => set('recordingMode', m)}
                className={`flex-1 rounded-lg border py-2 text-sm font-bold transition ${config.recordingMode === m ? 'border-brand-600 bg-brand-600 text-white' : 'border-surface-line text-ink-soft hover:border-brand-300'}`}
              >
                {m === 'CONTINUOUS' ? 'Continuous' : 'Motion-triggered'}
              </button>
            ))}
          </div>
        </div>

        {config.recordingMode === 'MOTION' && (
          <div>
            <label className="mb-1 flex justify-between text-xs font-semibold text-ink-soft">
              <span>Estimated active time</span> <span>{config.motionActivityPct}%</span>
            </label>
            <input type="range" min={5} max={100} step={5} value={config.motionActivityPct} onChange={(e) => set('motionActivityPct', Number(e.target.value))} className="w-full accent-brand-600" />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Retention period (days)</label>
          <input type="number" min={1} max={365} className="input" value={config.retentionDays} onChange={(e) => set('retentionDays', Math.min(365, Math.max(1, Number(e.target.value) || 1)))} />
        </div>
      </div>
    </div>
  );
}
