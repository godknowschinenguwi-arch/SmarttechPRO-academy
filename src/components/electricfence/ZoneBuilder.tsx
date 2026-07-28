'use client';
import type { FenceZone } from '@/lib/electricfence/types';

let nextId = 1;
function newId() {
  nextId += 1;
  return `zone-${Date.now()}-${nextId}`;
}

export default function ZoneBuilder({ zones, onChange }: { zones: FenceZone[]; onChange: (zones: FenceZone[]) => void }) {
  function addZone() {
    onChange([...zones, { id: newId(), name: `Zone ${zones.length + 1}`, lengthM: 100, corners: 2 }]);
  }

  function update(id: string, patch: Partial<FenceZone>) {
    onChange(zones.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  }

  function remove(id: string) {
    onChange(zones.filter((z) => z.id !== id));
  }

  const totalM = zones.reduce((s, z) => s + z.lengthM, 0);
  const totalCorners = zones.reduce((s, z) => s + z.corners, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="card overflow-hidden">
        <div className="hidden grid-cols-[1.6fr_110px_100px_28px] gap-2 border-b border-surface-line bg-surface-soft px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint md:grid">
          <span>Zone name</span>
          <span>Length (m)</span>
          <span>Corners</span>
          <span />
        </div>
        <div className="divide-y divide-surface-line">
          {zones.length === 0 && (
            <p className="p-8 text-center text-sm text-ink-faint">Add a zone to start sizing the fence.</p>
          )}
          {zones.map((z) => (
            <div key={z.id} className="grid grid-cols-2 items-end gap-2 px-4 py-3 md:grid-cols-[1.6fr_110px_100px_28px] md:items-center">
              <label className="col-span-2 flex flex-col gap-0.5 md:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Zone name</span>
                <input className="input-compact" value={z.name} onChange={(e) => update(z.id, { name: e.target.value })} />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Length (m)</span>
                <input
                  type="number"
                  min={0}
                  className="input-compact"
                  value={z.lengthM}
                  onChange={(e) => update(z.id, { lengthM: Math.max(0, Number(e.target.value) || 0) })}
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Corners</span>
                <input
                  type="number"
                  min={0}
                  className="input-compact"
                  value={z.corners}
                  onChange={(e) => update(z.id, { corners: Math.max(0, Number(e.target.value) || 0) })}
                />
              </label>
              <button onClick={() => remove(z.id)} className="justify-self-end text-ink-faint hover:text-rose-600 md:justify-self-auto" aria-label="Remove zone">
                ✕
              </button>
            </div>
          ))}
        </div>
        <button onClick={addZone} className="w-full border-t border-surface-line py-2.5 text-xs font-bold text-brand-700 hover:bg-brand-50">
          + Add zone
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total perimeter" value={`${totalM.toLocaleString()} m`} />
        <Stat label="Zones" value={String(zones.length)} />
        <Stat label="Corners / bends" value={String(totalCorners)} />
        <Stat label="Approx. length" value={`${(totalM / 1000).toFixed(2)} km`} />
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
