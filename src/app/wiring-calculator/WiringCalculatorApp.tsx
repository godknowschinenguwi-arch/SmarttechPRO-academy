'use client';
import { useEffect, useMemo, useState } from 'react';
import CircuitBuilder from '@/components/wiring/CircuitBuilder';
import WiringConfigPanel from '@/components/wiring/WiringConfigPanel';
import WiringResultsPanel from '@/components/wiring/WiringResultsPanel';
import ScenarioCompare from '@/components/wiring/ScenarioCompare';
import RequestQuoteModal from '@/components/wiring/RequestQuoteModal';
import AiAssistantWidget from '@/components/AiAssistantWidget';
import { computeWiringDesign, defaultWiringConfig, defaultWiringCircuits, DEFAULT_WIRING_CATALOG } from '@/lib/wiring/engine';
import { buildWiringWhatsAppMessage } from '@/lib/wiring/whatsapp';
import { whatsappLink } from '@/lib/contact';
import type { WiringCircuit, WiringScenario, WiringCatalog } from '@/lib/wiring/types';

const STORAGE_KEY = 'sta_wiring_scenarios_v1';

const TABS = [
  { id: 'circuits', label: '1. Circuits' },
  { id: 'config', label: '2. DB & protection' },
  { id: 'design', label: '3. Design' },
  { id: 'compare', label: '4. Compare' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function WiringCalculatorApp({
  catalog = DEFAULT_WIRING_CATALOG,
  signedIn = false,
}: {
  catalog?: WiringCatalog;
  signedIn?: boolean;
}) {
  const [circuits, setCircuits] = useState<WiringCircuit[]>(defaultWiringCircuits());
  const [config, setConfig] = useState(defaultWiringConfig());
  const [tab, setTab] = useState<TabId>('circuits');
  const [exporting, setExporting] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [scenarios, setScenarios] = useState<WiringScenario[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(signedIn);
  const [scenarioError, setScenarioError] = useState('');

  useEffect(() => {
    if (signedIn) {
      fetch('/api/wiring/designs')
        .then((r) => r.json())
        .then((data) => setScenarios(data.designs ?? []))
        .catch(() => setScenarioError('Could not load your saved designs.'))
        .finally(() => setScenariosLoading(false));
      return;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setScenarios(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
  }, [signedIn]);

  function persistLocal(next: WiringScenario[]) {
    setScenarios(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const design = useMemo(() => computeWiringDesign(circuits, config, catalog), [circuits, config, catalog]);

  async function saveScenario(name: string) {
    if (signedIn) {
      setScenarioError('');
      try {
        const res = await fetch('/api/wiring/designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, circuits, config }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setScenarioError(data.error || 'Could not save your design to your account.');
          return;
        }
        setScenarios((prev) => [{ id: data.id, name: data.name, createdAt: new Date().toISOString(), circuits: data.circuits, config: data.config }, ...prev]);
      } catch {
        setScenarioError('Could not reach the server. Check your connection and try again.');
      }
      return;
    }
    const scenario: WiringScenario = {
      id: `scn-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      circuits,
      config,
    };
    persistLocal([...scenarios, scenario]);
  }

  function loadScenario(s: WiringScenario) {
    setCircuits(s.circuits);
    setConfig(s.config);
    setTab('design');
  }

  async function deleteScenario(id: string) {
    if (signedIn) {
      setScenarios((prev) => prev.filter((s) => s.id !== id));
      try {
        await fetch(`/api/wiring/designs/${id}`, { method: 'DELETE' });
      } catch {
        setScenarioError('Could not delete that design — it may reappear on refresh.');
      }
      return;
    }
    persistLocal(scenarios.filter((s) => s.id !== id));
  }

  async function exportPdf() {
    setExporting(true);
    try {
      const res = await fetch('/api/wiring/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circuits, config, catalog }),
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
      {tab === 'compare' && (
        <ScenarioCompare
          scenarios={scenarios}
          loading={scenariosLoading}
          error={scenarioError}
          signedIn={signedIn}
          currentCircuits={circuits}
          currentConfig={config}
          catalog={catalog}
          onSave={saveScenario}
          onLoad={loadScenario}
          onDelete={deleteScenario}
        />
      )}

      <AiAssistantWidget
        apiPath="/api/wiring/assistant"
        payload={{ circuits, config, catalog }}
        title="SmartTech Electrical Assistant"
        subtitle="Ask about your current wiring design"
        starterPrompts={['Why do I need this cable size?', 'What if I add a dedicated circuit for the aircon?', 'Do I need an RCD?']}
      />
      {quoteOpen && <RequestQuoteModal circuits={circuits} config={config} design={design} catalog={catalog} onClose={() => setQuoteOpen(false)} />}
    </div>
  );
}
