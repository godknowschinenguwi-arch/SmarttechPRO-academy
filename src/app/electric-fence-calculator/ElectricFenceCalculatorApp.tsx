'use client';
import { useMemo, useState } from 'react';
import ZoneBuilder from '@/components/electricfence/ZoneBuilder';
import FenceConfigPanel from '@/components/electricfence/FenceConfigPanel';
import FenceResultsPanel from '@/components/electricfence/FenceResultsPanel';
import { computeFenceDesign, defaultFenceConfig, defaultFenceZones } from '@/lib/electricfence/engine';
import type { FenceZone } from '@/lib/electricfence/types';

const TABS = [
  { id: 'zones', label: '1. Zones' },
  { id: 'config', label: '2. Fence & power' },
  { id: 'design', label: '3. Design' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ElectricFenceCalculatorApp() {
  const [zones, setZones] = useState<FenceZone[]>(defaultFenceZones());
  const [config, setConfig] = useState(defaultFenceConfig());
  const [tab, setTab] = useState<TabId>('zones');
  const [exporting, setExporting] = useState(false);

  const design = useMemo(() => computeFenceDesign(zones, config), [zones, config]);

  async function exportPdf() {
    setExporting(true);
    try {
      const res = await fetch('/api/electricfence/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zones, config }),
      });
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SmartTech-ElectricFence-Proposal-${(config.clientName || 'design').replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not generate the PDF proposal. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-surface-line bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                tab === t.id ? 'bg-brand-600 text-white shadow-lift' : 'text-ink-soft hover:bg-surface-soft'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={exportPdf} disabled={exporting} className="btn-accent">
          {exporting ? 'Generating…' : '📄 Export PDF proposal'}
        </button>
      </div>

      {tab === 'zones' && <ZoneBuilder zones={zones} onChange={setZones} />}
      {tab === 'config' && <FenceConfigPanel config={config} onChange={setConfig} />}
      {tab === 'design' && <FenceResultsPanel design={design} />}
    </div>
  );
}
