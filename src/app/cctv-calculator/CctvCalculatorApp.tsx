'use client';
import { useEffect, useMemo, useState } from 'react';
import CameraPointBuilder from '@/components/cctv/CameraPointBuilder';
import CctvConfigPanel from '@/components/cctv/CctvConfigPanel';
import CctvResultsPanel from '@/components/cctv/CctvResultsPanel';
import ScenarioCompare from '@/components/cctv/ScenarioCompare';
import RequestQuoteModal from '@/components/cctv/RequestQuoteModal';
import AiAssistantWidget from '@/components/AiAssistantWidget';
import { computeCctvDesign, defaultCctvConfig, defaultCameraPoints, DEFAULT_CCTV_CATALOG } from '@/lib/cctv/engine';
import { buildCctvWhatsAppMessage } from '@/lib/cctv/whatsapp';
import { whatsappLink } from '@/lib/contact';
import type { CameraPoint, CctvScenario, CctvCatalog } from '@/lib/cctv/types';

const STORAGE_KEY = 'sta_cctv_scenarios_v1';

const TABS = [
  { id: 'cameras', label: '1. Cameras' },
  { id: 'config', label: '2. Recording & network' },
  { id: 'design', label: '3. Design' },
  { id: 'compare', label: '4. Compare' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function CctvCalculatorApp({
  catalog = DEFAULT_CCTV_CATALOG,
  signedIn = false,
}: {
  catalog?: CctvCatalog;
  signedIn?: boolean;
}) {
  const [points, setPoints] = useState<CameraPoint[]>(defaultCameraPoints());
  const [config, setConfig] = useState(defaultCctvConfig());
  const [tab, setTab] = useState<TabId>('cameras');
  const [exporting, setExporting] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [scenarios, setScenarios] = useState<CctvScenario[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(signedIn);
  const [scenarioError, setScenarioError] = useState('');

  useEffect(() => {
    if (signedIn) {
      fetch('/api/cctv/designs')
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

  function persistLocal(next: CctvScenario[]) {
    setScenarios(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const design = useMemo(() => computeCctvDesign(points, config, catalog), [points, config, catalog]);

  async function saveScenario(name: string) {
    if (signedIn) {
      setScenarioError('');
      try {
        const res = await fetch('/api/cctv/designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, points, config }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setScenarioError(data.error || 'Could not save your design to your account.');
          return;
        }
        setScenarios((prev) => [{ id: data.id, name: data.name, createdAt: new Date().toISOString(), points: data.points, config: data.config }, ...prev]);
      } catch {
        setScenarioError('Could not reach the server. Check your connection and try again.');
      }
      return;
    }
    const scenario: CctvScenario = {
      id: `scn-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      points,
      config,
    };
    persistLocal([...scenarios, scenario]);
  }

  function loadScenario(s: CctvScenario) {
    setPoints(s.points);
    setConfig(s.config);
    setTab('design');
  }

  async function deleteScenario(id: string) {
    if (signedIn) {
      setScenarios((prev) => prev.filter((s) => s.id !== id));
      try {
        await fetch(`/api/cctv/designs/${id}`, { method: 'DELETE' });
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
      const res = await fetch('/api/cctv/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, config, catalog }),
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
      {tab === 'compare' && (
        <ScenarioCompare
          scenarios={scenarios}
          loading={scenariosLoading}
          error={scenarioError}
          signedIn={signedIn}
          currentPoints={points}
          currentConfig={config}
          catalog={catalog}
          onSave={saveScenario}
          onLoad={loadScenario}
          onDelete={deleteScenario}
        />
      )}

      <AiAssistantWidget
        apiPath="/api/cctv/assistant"
        payload={{ points, config, catalog }}
        title="SmartTech Security Assistant"
        subtitle="Ask about your current CCTV design"
        starterPrompts={['Why do I need this much storage?', 'What if I add 4 more cameras?', 'Do I need a PoE switch?']}
      />
      {quoteOpen && <RequestQuoteModal points={points} config={config} design={design} catalog={catalog} onClose={() => setQuoteOpen(false)} />}
    </div>
  );
}
