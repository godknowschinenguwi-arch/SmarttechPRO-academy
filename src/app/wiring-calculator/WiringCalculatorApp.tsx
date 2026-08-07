'use client';
import { useMemo, useState } from 'react';
import CircuitBuilder from '@/components/wiring/CircuitBuilder';
import WiringConfigPanel from '@/components/wiring/WiringConfigPanel';
import WiringResultsPanel from '@/components/wiring/WiringResultsPanel';
import RequestQuoteModal from '@/components/wiring/RequestQuoteModal';
import { computeWiringDesign, defaultWiringConfig, defaultWiringCircuits } from '@/lib/wiring/engine';
import { buildWiringWhatsAppMessage } from '@/lib/wiring/whatsapp';
import { whatsappLink } from '@/lib/contact';
import type { WiringCircuit } from '@/lib/wiring/types';

const TABS = [
  { id: 'circuits', label: '1. Circuits' },
  { id: 'config', label: '2. DB & protection' },
  { id: 'design', label: '3. Design' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function WiringCalculatorApp() {
  const [circuits, setCircuits] = useState<WiringCircuit[]>(defaultWiringCircuits());
  const [config, setConfig] = useState(defaultWiringConfig());
  const [tab, setTab] = useState<TabId>('circuits');
  const [exporting, setExporting] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

  const design = useMemo(() => computeWiringDesign(circuits, config), [circuits, config]);

  async function exportPdf() {
    setExporting(true);
    try {
      const res = await fetch('/api/wiring/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circuits, config }),
      });
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SmartTech-Wiring-Proposal-${(config.clientName || 'design').replace(/\s+/g, '-')}.pdf`;
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
            href={whatsappLink(buildWiringWhatsAppMessage(design, config))}
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

      {tab === 'circuits' && <CircuitBuilder circuits={circuits} onChange={setCircuits} />}
      {tab === 'config' && <WiringConfigPanel config={config} onChange={setConfig} />}
      {tab === 'design' && <WiringResultsPanel design={design} />}

      {quoteOpen && <RequestQuoteModal circuits={circuits} config={config} design={design} onClose={() => setQuoteOpen(false)} />}
    </div>
  );
}
