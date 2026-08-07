'use client';
import type { WiringConfig, ConduitMounting } from '@/lib/wiring/types';

const CONDUIT_MOUNTINGS: { id: ConduitMounting; label: string; blurb: string }[] = [
  { id: 'CHASED', label: 'Chased into wall', blurb: 'Conduit recessed into plaster/brickwork before finishing — fewer surface fixings needed.' },
  { id: 'SURFACE', label: 'Surface-mounted', blurb: 'Conduit run on the wall face, clipped with saddles — faster, no chasing required.' },
];

export default function WiringConfigPanel({ config, onChange }: { config: WiringConfig; onChange: (config: WiringConfig) => void }) {
  function set<K extends keyof WiringConfig>(key: K, value: WiringConfig[K]) {
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
          <label className="mb-2 block text-xs font-semibold text-ink-soft">Conduit installation</label>
          <div className="grid gap-2">
            {CONDUIT_MOUNTINGS.map((m) => (
              <button
                key={m.id}
                onClick={() => set('conduitMounting', m.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  config.conduitMounting === m.id ? 'border-brand-600 bg-brand-50' : 'border-surface-line hover:border-brand-300'
                }`}
              >
                <p className={`text-sm font-bold ${config.conduitMounting === m.id ? 'text-brand-700' : 'text-ink'}`}>{m.label}</p>
                <p className="text-xs text-ink-faint">{m.blurb}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-surface-line pt-4">
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Notes for the installer</label>
          <textarea className="input" rows={3} value={config.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Wall type, access restrictions, existing DB to extend from…" />
        </div>
      </div>

      <div className="card flex flex-col gap-4 p-5">
        <h3 className="font-display text-sm font-bold text-ink">Distribution board &amp; protection</h3>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={config.earthLeakageEnabled} onChange={(e) => set('earthLeakageEnabled', e.target.checked)} className="h-4 w-4 accent-brand-600" />
          <span className="text-sm font-semibold text-ink">Earth leakage (RCD) protection on the main incomer</span>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={config.surgeProtectionEnabled} onChange={(e) => set('surgeProtectionEnabled', e.target.checked)} className="h-4 w-4 accent-brand-600" />
          <span className="text-sm font-semibold text-ink">Surge protection device (SPD)</span>
        </label>

        <div>
          <label className="mb-1 flex justify-between text-xs font-semibold text-ink-soft">
            <span>Spare DB ways for future circuits</span> <span>{Math.round(config.spareDbWaysPct * 100)}%</span>
          </label>
          <input
            type="range" min={0} max={50} step={5}
            value={Math.round(config.spareDbWaysPct * 100)}
            onChange={(e) => set('spareDbWaysPct', Number(e.target.value) / 100)}
            className="w-full accent-brand-600"
          />
        </div>

        <div>
          <label className="mb-1 flex justify-between text-xs font-semibold text-ink-soft">
            <span>Install &amp; contingency buffer</span> <span>{Math.round(config.installBufferPct * 100)}%</span>
          </label>
          <input
            type="range" min={0} max={40} step={5}
            value={Math.round(config.installBufferPct * 100)}
            onChange={(e) => set('installBufferPct', Number(e.target.value) / 100)}
            className="w-full accent-brand-600"
          />
        </div>

        <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">
          Cable, breaker and DB sizing here is an indicative estimate based on declared loads — it is not a
          substitute for a proper electrical design. Final circuit design, earthing and compliance must be verified
          by a qualified electrician against local wiring regulations.
        </p>
      </div>
    </div>
  );
}
