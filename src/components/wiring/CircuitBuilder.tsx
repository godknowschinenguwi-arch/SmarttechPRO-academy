'use client';
import type { WiringCircuit, CircuitType } from '@/lib/wiring/types';

let nextId = 1;
function newId() {
  nextId += 1;
  return `ckt-${Date.now()}-${nextId}`;
}

const TYPES: { id: CircuitType; label: string }[] = [
  { id: 'LIGHTING', label: 'Lighting' },
  { id: 'SOCKET', label: 'Socket' },
  { id: 'DEDICATED', label: 'Dedicated' },
];

export default function CircuitBuilder({ circuits, onChange }: { circuits: WiringCircuit[]; onChange: (circuits: WiringCircuit[]) => void }) {
  function addCircuit() {
    onChange([...circuits, { id: newId(), name: `Circuit ${circuits.length + 1}`, type: 'LIGHTING', points: 4, dedicatedLoadW: 0, cableRunM: 10 }]);
  }

  function update(id: string, patch: Partial<WiringCircuit>) {
    onChange(circuits.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function remove(id: string) {
    onChange(circuits.filter((c) => c.id !== id));
  }

  const lightingCount = circuits.filter((c) => c.type === 'LIGHTING').length;
  const socketCount = circuits.filter((c) => c.type === 'SOCKET').length;
  const dedicatedCount = circuits.filter((c) => c.type === 'DEDICATED').length;

  return (
    <div className="flex flex-col gap-4">
      <div className="card overflow-hidden">
        <div className="hidden grid-cols-[1.4fr_110px_80px_110px_90px_28px] gap-2 border-b border-surface-line bg-surface-soft px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint md:grid">
          <span>Circuit name</span>
          <span>Type</span>
          <span>Points</span>
          <span>Load (W)</span>
          <span>Cable run (m)</span>
          <span />
        </div>
        <div className="divide-y divide-surface-line">
          {circuits.length === 0 && (
            <p className="p-8 text-center text-sm text-ink-faint">Add a circuit to start sizing the installation.</p>
          )}
          {circuits.map((c) => (
            <div key={c.id} className="grid grid-cols-2 items-end gap-2 px-4 py-3 md:grid-cols-[1.4fr_110px_80px_110px_90px_28px] md:items-center">
              <label className="col-span-2 flex flex-col gap-0.5 md:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Circuit name</span>
                <input className="input-compact" value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Type</span>
                <select className="input-compact" value={c.type} onChange={(e) => update(c.id, { type: e.target.value as CircuitType })}>
                  {TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Points</span>
                <input
                  type="number" min={1} max={30}
                  className="input-compact disabled:opacity-40"
                  disabled={c.type === 'DEDICATED'}
                  value={c.type === 'DEDICATED' ? 1 : c.points}
                  onChange={(e) => update(c.id, { points: Math.max(1, Number(e.target.value) || 1) })}
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Load (W)</span>
                <input
                  type="number" min={0} step={100}
                  className="input-compact disabled:opacity-40"
                  disabled={c.type !== 'DEDICATED'}
                  value={c.type === 'DEDICATED' ? c.dedicatedLoadW : 0}
                  onChange={(e) => update(c.id, { dedicatedLoadW: Math.max(0, Number(e.target.value) || 0) })}
                  placeholder="e.g. 4000"
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint md:hidden">Cable run (m)</span>
                <input
                  type="number" min={0}
                  className="input-compact"
                  value={c.cableRunM}
                  onChange={(e) => update(c.id, { cableRunM: Math.max(0, Number(e.target.value) || 0) })}
                />
              </label>
              <button onClick={() => remove(c.id)} className="justify-self-end text-ink-faint hover:text-rose-600 md:justify-self-auto" aria-label="Remove circuit">
                ✕
              </button>
            </div>
          ))}
        </div>
        <button onClick={addCircuit} className="w-full border-t border-surface-line py-2.5 text-xs font-bold text-brand-700 hover:bg-brand-50">
          + Add circuit
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Circuits" value={String(circuits.length)} />
        <Stat label="Lighting" value={String(lightingCount)} />
        <Stat label="Socket" value={String(socketCount)} />
        <Stat label="Dedicated" value={String(dedicatedCount)} />
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
