'use client';
import type { AccessoryCategory, CatalogAccessory, SelectedAccessory } from '@/lib/cctv/types';

const CATEGORY_ORDER: AccessoryCategory[] = ['CABINET', 'MONITOR', 'HDMI_CABLE', 'HDMI_SPLITTER', 'OTHER'];
const CATEGORY_LABELS: Record<AccessoryCategory, string> = {
  CABINET: 'Network cabinets',
  MONITOR: 'Monitors (19" – 80")',
  HDMI_CABLE: 'HDMI cable',
  HDMI_SPLITTER: 'HDMI splitters',
  OTHER: 'Other accessories',
};

export default function AccessoryPicker({
  catalog,
  selected,
  onChange,
}: {
  catalog: CatalogAccessory[];
  selected: SelectedAccessory[];
  onChange: (next: SelectedAccessory[]) => void;
}) {
  function qtyFor(id: string): number {
    return selected.find((s) => s.id === id)?.qty ?? 0;
  }

  function setQty(id: string, qty: number) {
    const clamped = Math.max(0, Math.min(999, qty));
    const next = selected.filter((s) => s.id !== id);
    if (clamped > 0) next.push({ id, qty: clamped });
    onChange(next);
  }

  const totalSelected = selected.reduce((s, x) => s + x.qty, 0);

  return (
    <div className="flex flex-col gap-6">
      {CATEGORY_ORDER.map((category) => {
        const items = catalog.filter((a) => a.category === category);
        if (!items.length) return null;
        return (
          <div key={category} className="card p-5">
            <h3 className="mb-3 font-display text-sm font-bold text-ink">{CATEGORY_LABELS[category]}</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const qty = qtyFor(item.id);
                return (
                  <div key={item.id} className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${qty > 0 ? 'border-brand-300 bg-brand-50' : 'border-surface-line'}`}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{item.brand} {item.model}</p>
                      <p className="text-xs text-ink-faint">{item.spec} · ${item.priceUsd.toLocaleString()}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => setQty(item.id, qty - 1)}
                        disabled={qty === 0}
                        className="h-7 w-7 rounded-lg border border-surface-line text-sm font-bold text-ink-soft hover:border-brand-300 disabled:opacity-30"
                        aria-label={`Decrease ${item.brand} ${item.model} ${item.spec}`}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-ink">{qty}</span>
                      <button
                        onClick={() => setQty(item.id, qty + 1)}
                        className="h-7 w-7 rounded-lg border border-surface-line text-sm font-bold text-ink-soft hover:border-brand-300"
                        aria-label={`Increase ${item.brand} ${item.model} ${item.spec}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {totalSelected === 0 && (
        <p className="card p-6 text-center text-sm text-ink-faint">
          No accessories selected yet — add network cabinets, monitors, HDMI cable/splitters or other items above. They'll be added to the bill of materials.
        </p>
      )}
    </div>
  );
}
