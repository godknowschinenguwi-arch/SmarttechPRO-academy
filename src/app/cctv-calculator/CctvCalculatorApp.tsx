'use client';
import { useMemo, useState } from 'react';
import CameraPointBuilder from '@/components/cctv/CameraPointBuilder';
import CctvConfigPanel from '@/components/cctv/CctvConfigPanel';
import CctvResultsPanel from '@/components/cctv/CctvResultsPanel';
import RequestQuoteModal from '@/components/cctv/RequestQuoteModal';
import { computeCctvDesign, defaultCctvConfig, defaultCameraPoints } from '@/lib/cctv/engine';
import { buildCctvWhatsAppMessage } from '@/lib/cctv/whatsapp';
import { whatsappLink } from '@/lib/contact';
import type { CameraPoint } from '@/lib/cctv/types';

const TABS = [
  { id: 'cameras', label: '1. Cameras' },
  { id: 'config', label: '2. Recording & network' },
  { id: 'design', label: '3. Design' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function CctvCalculatorApp() {
  const [points, setPoints] = useState<CameraPoint[]>(defaultCameraPoints());
  const [config, setConfig] = useState(defaultCctvConfig());
  const [tab, setTab] = useState<TabId>('cameras');
  const [exporting, setExporting] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

  const design = useMemo(() => computeCctvDesign(points, config), [points, config]);

  async function exportPdf() {
    setExporting(true);
    try {
      const res = await fetch('/api/cctv/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, config }),
      });
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SmartTech-CCTV-Proposal-${(config.clientName || 'design').replace(/\s+/g, '-')}.pdf`;
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
        <div className="flex flex-wrap gap-2">
          <a
            href={whatsappLink(buildCctvWhatsAppMessage(design, config))}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost !border-emerald-300 !text-emerald-700 hover:!bg-emerald-50"
          >
            💬 WhatsApp
          </a>
          <button onClick={() => setQuoteOpen(true)} className="btn-primary">
            📋 Request a quote
          </button>
          <button onClick={exportPdf} disabled={exporting} className="btn-accent">
            {exporting ? 'Generating…' : '📄 Export PDF proposal'}
          </button>
        </div>
      </div>

      {tab === 'cameras' && <CameraPointBuilder points={points} onChange={setPoints} />}
      {tab === 'config' && <CctvConfigPanel config={config} onChange={setConfig} />}
      {tab === 'design' && <CctvResultsPanel design={design} />}

      {quoteOpen && <RequestQuoteModal points={points} config={config} design={design} onClose={() => setQuoteOpen(false)} />}
    </div>
  );
}
