'use client';
import type { CameraPoint, CameraType, Environment } from '@/lib/cctv/types';

let nextId = 1;
function newId() {
  nextId += 1;
  return `cam-${Date.now()}-${nextId}`;
}

const TYPES: CameraType[] = ['DOME', 'BULLET', 'TURRET', 'PTZ'];

export default function CameraPointBuilder({ points, onChange }: { points: CameraPoint[]; onChange: (points: CameraPoint[]) => void }) {
  function addPoint() {
    onChange([...points, { id: newId(), name: `Camera ${points.length + 1}`, type: 'DOME', environment: 'INDOOR', resolutionMp: 4, distanceFromNvrM: 20, lowLight: false }]);
  }

  function update(id: string, patch: Partial<CameraPoint>) {
    onChange(points.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function remove(id: string) {
    onChange(points.filter((p) => p.id !== id));
  }

  const totalDistance = points.reduce((s, p) => s + p.distanceFromNvrM, 0);
  const outdoorCount = points.filter((p) => p.environment === 'OUTDOOR').length;

  return (
    <div className="flex flex-col gap-4">
      <div className="card overflow-hidden">
        <div className="hidden grid-cols-[1.3fr_100px_90px_80px_90px_70px_28px] gap-2 border-b border-surface-line bg-surface-soft px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint md:grid">
          <span>Camera name</span>
          <span>Type</span>
          <span>Environment</span>
          <span>Resolution</span>
          <span>Distance (m)</span>
          <span>Low-light</span>
          <span />
        </div>
        <div className="divide-y divide-surface-line">
          {points.length === 0 && (
            <p className="p-8 text-center text-sm text-ink-faint">Add a camera point to start sizing the system.</p>
          )}
          {points.map((p) => (
            <div key={p.id} className="grid grid-cols-2 items-end gap-2 px-4 py-3 md:grid-cols-[1.3fr_100px_90px_80px_90px_70px_28px] md:items-center">
              <label className="col-span-2 flex flex-col gap-0.5 md:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Camera name</span>
                <input className="input-compact" value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Type</span>
                <select className="input-compact" value={p.type} onChange={(e) => update(p.id, { type: e.target.value as CameraType })}>
                  {TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0)}{t.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Environment</span>
                <select className="input-compact" value={p.environment} onChange={(e) => update(p.id, { environment: e.target.value as Environment })}>
                  <option value="INDOOR">Indoor</option>
                  <option value="OUTDOOR">Outdoor</option>
                </select>
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Resolution (MP)</span>
                <input
                  type="number" min={1} max={32}
                  className="input-compact"
                  value={p.resolutionMp}
                  onChange={(e) => update(p.id, { resolutionMp: Math.max(1, Number(e.target.value) || 1) })}
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Distance (m)</span>
                <input
                  type="number" min={0}
                  className="input-compact"
                  value={p.distanceFromNvrM}
                  onChange={(e) => update(p.id, { distanceFromNvrM: Math.max(0, Number(e.target.value) || 0) })}
                />
              </label>
              <label className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Low-light</span>
                <input type="checkbox" checked={p.lowLight} onChange={(e) => update(p.id, { lowLight: e.target.checked })} className="h-4 w-4 accent-brand-600" />
              </label>
              <button onClick={() => remove(p.id)} className="justify-self-end text-ink-faint hover:text-rose-600 md:justify-self-auto" aria-label="Remove camera">
                ✕
              </button>
            </div>
          ))}
        </div>
        <button onClick={addPoint} className="w-full border-t border-surface-line py-2.5 text-xs font-bold text-brand-700 hover:bg-brand-50">
          + Add camera
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Cameras" value={String(points.length)} />
        <Stat label="Outdoor" value={String(outdoorCount)} />
        <Stat label="Indoor" value={String(points.length - outdoorCount)} />
        <Stat label="Total cable runs" value={`${totalDistance.toLocaleString()} m`} />
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
