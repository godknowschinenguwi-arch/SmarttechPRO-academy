'use client';
import { useEffect, useMemo, useState } from 'react';
import ZoneBuilder from '@/components/electricfence/ZoneBuilder';
import FenceConfigPanel from '@/components/electricfence/FenceConfigPanel';
import FenceResultsPanel from '@/components/electricfence/FenceResultsPanel';
import ScenarioCompare from '@/components/electricfence/ScenarioCompare';
import RequestQuoteModal from '@/components/electricfence/RequestQuoteModal';
import AiAssistantWidget from '@/components/AiAssistantWidget';
import { computeFenceDesign, defaultFenceConfig, defaultFenceZones, DEFAULT_FENCE_CATALOG } from '@/lib/electricfence/engine';
import { buildFenceWhatsAppMessage } from '@/lib/electricfence/whatsapp';
import { whatsappLink } from '@/lib/contact';
import type { FenceZone, FenceScenario, FenceCatalog } from '@/lib/electricfence/types';

const STORAGE_KEY = 'sta_fence_scenarios_v1';

const TABS = [
  { id: 'zones', label: '1. Zones' },
  { id: 'config', label: '2. Fence & power' },
  { id: 'design', label: '3. Design' },
  { id: 'compare', label: '4. Compare' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ElectricFenceCalculatorApp({
  catalog = DEFAULT_FENCE_CATALOG,
  signedIn = false,
}: {
  catalog?: FenceCatalog;
  signedIn?: boolean;
}) {
  const [zones, setZones] = useState<FenceZone[]>(defaultFenceZones());
  const [config, setConfig] = useState(defaultFenceConfig());
  const [tab, setTab] = useState<TabId>('zones');
  const [exporting, setExporting] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [scenarios, setScenarios] = useState<FenceScenario[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(signedIn);
  const [scenarioError, setScenarioError] = useState('');

  useEffect(() => {
    if (signedIn) {
      fetch('/api/electricfence/designs')
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

  function persistLocal(next: FenceScenario[]) {
    setScenarios(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const design = useMemo(() => computeFenceDesign(zones, config, catalog), [zones, config, catalog]);

  async function saveScenario(name: string) {
    if (signedIn) {
      setScenarioError('');
      try {
        const res = await fetch('/api/electricfence/designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, zones, config }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setScenarioError(data.error || 'Could not save your design to your account.');
          return;
        }
        setScenarios((prev) => [{ id: data.id, name: data.name, createdAt: new Date().toISOString(), zones: data.zones, config: data.config }, ...prev]);
      } catch {
        setScenarioError('Could not reach the server. Check your connection and try again.');
      }
      return;
    }
    const scenario: FenceScenario = {
      id: `scn-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      zones,
      config,
    };
    persistLocal([...scenarios, scenario]);
  }

  function loadScenario(s: FenceScenario) {
    setZones(s.zones);
    setConfig(s.config);
    setTab('design');
  }

  async function deleteScenario(id: string) {
    if (signedIn) {
      setScenarios((prev) => prev.filter((s) => s.id !== id));
      try {
        await fetch(`/api/electricfence/designs/${id}`, { method: 'DELETE' });
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
      const res = await fetch('/api/electricfence/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zones, config, catalog }),
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
        <div className="flex flex-wrap gap-2">
          <a
            href={whatsappLink(buildFenceWhatsAppMessage(design, config))}
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

      {tab === 'zones' && <ZoneBuilder zones={zones} onChange={setZones} />}
      {tab === 'config' && <FenceConfigPanel config={config} onChange={setConfig} />}
      {tab === 'design' && <FenceResultsPanel design={design} />}
      {tab === 'compare' && (
        <ScenarioCompare
          scenarios={scenarios}
          loading={scenariosLoading}
          error={scenarioError}
          signedIn={signedIn}
          currentZones={zones}
          currentConfig={config}
          catalog={catalog}
          onSave={saveScenario}
          onLoad={loadScenario}
          onDelete={deleteScenario}
        />
      )}

      <AiAssistantWidget
        apiPath="/api/electricfence/assistant"
        payload={{ zones, config, catalog }}
        title="SmartTech Security Assistant"
        subtitle="Ask about your current fence design"
        starterPrompts={['Why do I need this energizer size?', 'What if I extend the perimeter by 100m?', 'Do I need a monitor for this fence?']}
      />
      {quoteOpen && <RequestQuoteModal zones={zones} config={config} design={design} catalog={catalog} onClose={() => setQuoteOpen(false)} />}
    </div>
  );
}
