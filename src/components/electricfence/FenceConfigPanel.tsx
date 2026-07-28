'use client';
import type { FenceConfig, PowerSource, PostMaterial, WireType } from '@/lib/electricfence/types';

const WIRE_TYPES: { id: WireType; label: string; blurb: string }[] = [
  { id: 'HT_WIRE', label: 'High-tensile galvanised', blurb: 'Standard 2.5mm HT wire — low resistance, longest effective run per energizer.' },
  { id: 'BRAIDED_WIRE', label: 'Conductive braid/rope', blurb: 'More visible, flexible — higher resistance shortens the effective range.' },
];

const POST_MATERIALS: { id: PostMaterial; label: string }[] = [
  { id: 'STEEL', label: 'Steel Y-standard' },
  { id: 'TIMBER', label: 'Treated timber' },
  { id: 'CONCRETE', label: 'Precast concrete' },
];

const POWER_SOURCES: { id: PowerSource; label: string; blurb: string }[] = [
  { id: 'MAINS', label: 'Mains only', blurb: 'No backup — fence goes down in a power outage.' },
  { id: 'MAINS_WITH_BACKUP', label: 'Mains + battery backup', blurb: 'Stays energized through outages for a set number of hours.' },
  { id: 'SOLAR', label: 'Solar + battery', blurb: 'Off-grid site — panel keeps the backup battery topped up.' },
];

export default function FenceConfigPanel({ config, onChange }: { config: FenceConfig; onChange: (config: FenceConfig) => void }) {
  function set<K extends keyof FenceConfig>(key: K, value: FenceConfig[K]) {
    onChange({ ...config, [key]: value });
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
          <label className="mb-2 block text-xs font-semibold text-ink-soft">Wire type</label>
          <div className="grid gap-2">
            {WIRE_TYPES.map((w) => (
              <button
                key={w.id}
                onClick={() => set('wireType', w.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  config.wireType === w.id ? 'border-brand-600 bg-brand-50' : 'border-surface-line hover:border-brand-300'
                }`}
              >
                <p className={`text-sm font-bold ${config.wireType === w.id ? 'text-brand-700' : 'text-ink'}`}>{w.label}</p>
                <p className="text-xs text-ink-faint">{w.blurb}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 flex justify-between text-xs font-semibold text-ink-soft">
            <span>Number of strands</span> <span>{config.strandCount}</span>
          </label>
          <input
            type="range" min={2} max={16} step={1}
            value={config.strandCount}
            onChange={(e) => set('strandCount', Number(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-soft">Post spacing (m)</label>
            <input type="number" min={1} max={6} step={0.5} className="input" value={config.postSpacingM} onChange={(e) => set('postSpacingM', Math.max(1, Number(e.target.value) || 1))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-soft">Post material</label>
            <select className="input" value={config.postMaterial} onChange={(e) => set('postMaterial', e.target.value as PostMaterial)}>
              {POST_MATERIALS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Gates / access points</label>
          <input type="number" min={0} className="input" value={config.gateCount} onChange={(e) => set('gateCount', Math.max(0, Number(e.target.value) || 0))} />
        </div>
      </div>

      <div className="card flex flex-col gap-4 p-5">
        <h3 className="font-display text-sm font-bold text-ink">Power &amp; monitoring</h3>

        <div>
          <label className="mb-2 block text-xs font-semibold text-ink-soft">Power source</label>
          <div className="grid gap-2">
            {POWER_SOURCES.map((p) => (
              <button
                key={p.id}
                onClick={() => set('powerSource', p.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  config.powerSource === p.id ? 'border-brand-600 bg-brand-50' : 'border-surface-line hover:border-brand-300'
                }`}
              >
                <p className={`text-sm font-bold ${config.powerSource === p.id ? 'text-brand-700' : 'text-ink'}`}>{p.label}</p>
                <p className="text-xs text-ink-faint">{p.blurb}</p>
              </button>
            ))}
          </div>
        </div>

        {config.powerSource !== 'MAINS' && (
          <div>
            <label className="mb-1 flex justify-between text-xs font-semibold text-ink-soft">
              <span>Backup autonomy</span> <span>{config.backupHours}h</span>
            </label>
            <input
              type="range" min={2} max={48} step={1}
              value={config.backupHours}
              onChange={(e) => set('backupHours', Number(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>
        )}

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={config.monitoringEnabled} onChange={(e) => set('monitoringEnabled', e.target.checked)} className="h-4 w-4 accent-brand-600" />
          <span className="text-sm font-semibold text-ink">Zone monitoring panel (detects/pinpoints a cut wire)</span>
        </label>

        {config.monitoringEnabled && (
          <label className="ml-6 flex items-center gap-2">
            <input type="checkbox" checked={config.gsmAlertEnabled} onChange={(e) => set('gsmAlertEnabled', e.target.checked)} className="h-4 w-4 accent-brand-600" />
            <span className="text-sm text-ink-soft">GSM/SMS alert on trigger</span>
          </label>
        )}

        <div className="border-t border-surface-line pt-4">
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Notes for the installer</label>
          <textarea className="input" rows={3} value={config.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Terrain, vegetation, existing wall/palisade to mount to, access restrictions…" />
        </div>
      </div>
    </div>
  );
}
