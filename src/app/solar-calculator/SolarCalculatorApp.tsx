'use client';
import { useEffect, useMemo, useState } from 'react';
import LoadBuilder from '@/components/solar/LoadBuilder';
import SiteConfigPanel from '@/components/solar/SiteConfigPanel';
import SystemDiagram from '@/components/solar/SystemDiagram';
import ResultsPanel from '@/components/solar/ResultsPanel';
import ScenarioCompare from '@/components/solar/ScenarioCompare';
import ExistingSystemPanel from '@/components/solar/ExistingSystemPanel';
import UpgradeResults from '@/components/solar/UpgradeResults';
import AiAssistant from '@/components/solar/AiAssistant';
import { computeSystemDesign, computeUpgradeDesign, defaultSiteConfig, defaultExistingSystem, DEFAULT_CATALOG } from '@/lib/solar/engine';
import { APPLIANCE_LIBRARY } from '@/lib/solar/appliances';
import type { LoadItem, Scenario, SolarCatalog } from '@/lib/solar/types';

const STORAGE_KEY = 'sta_solar_scenarios_v1';

const STARTER_APPLIANCES = ['led-bulb', 'fridge', 'tv-led', 'wifi-router', 'ceiling-fan'];

function starterLoads(): LoadItem[] {
  return STARTER_APPLIANCES.map((id, i) => {
    const def = APPLIANCE_LIBRARY.find((a) => a.id === id)!;
    return {
      id: `starter-${i}`,
      applianceId: def.id,
      name: def.name,
      category: def.category,
      icon: def.icon,
      watts: def.watts,
      qty: def.defaultQty,
      hours: def.defaultHours,
      surgeFactor: def.surgeFactor,
      essential: def.id === 'fridge' || def.id === 'wifi-router',
    };
  });
}

const TABS = [
  { id: 'loads', label: '1. Loads' },
  { id: 'site', label: '2. Site & system' },
  { id: 'design', label: '3. Design' },
  { id: 'upgrade', label: '4. Upgrade path' },
  { id: 'compare', label: '5. Compare' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function SolarCalculatorApp({
  catalog = DEFAULT_CATALOG,
  signedIn = false,
}: {
  catalog?: SolarCatalog;
  signedIn?: boolean;
}) {
  const [loads, setLoads] = useState<LoadItem[]>(starterLoads());
  const [site, setSite] = useState(defaultSiteConfig());
  const [existing, setExisting] = useState(defaultExistingSystem());
  const [tab, setTab] = useState<TabId>('loads');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(signedIn);
  const [scenarioError, setScenarioError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (signedIn) {
      fetch('/api/solar/designs')
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

  function persistLocal(next: Scenario[]) {
    setScenarios(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const design = useMemo(() => computeSystemDesign(loads, site, {}, catalog), [loads, site, catalog]);
  const upgrade = useMemo(() => computeUpgradeDesign(existing, loads, site, {}, catalog), [existing, loads, site, catalog]);

  async function saveScenario(name: string) {
    if (signedIn) {
      setScenarioError('');
      try {
        const res = await fetch('/api/solar/designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, loads, site }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setScenarioError(data.error || 'Could not save your design to your account.');
          return;
        }
        setScenarios((prev) => [{ id: data.id, name: data.name, createdAt: new Date().toISOString(), loads: data.loads, site: data.site }, ...prev]);
      } catch {
        setScenarioError('Could not reach the server. Check your connection and try again.');
      }
      return;
    }
    const scenario: Scenario = {
      id: `scn-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      loads,
      site,
    };
    persistLocal([...scenarios, scenario]);
  }

  function loadScenario(s: Scenario) {
    setLoads(s.loads);
    setSite(s.site);
    setTab('design');
  }

  async function deleteScenario(id: string) {
    if (signedIn) {
      setScenarios((prev) => prev.filter((s) => s.id !== id));
      try {
        await fetch(`/api/solar/designs/${id}`, { method: 'DELETE' });
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
      const res = await fetch('/api/solar/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loads, site, catalog }),
      });
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SmartTech-Solar-Proposal-${(site.clientName || 'design').replace(/\s+/g, '-')}.pdf`;
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

      {tab === 'loads' && <LoadBuilder loads={loads} onChange={setLoads} systemType={site.systemType} />}
      {tab === 'site' && <SiteConfigPanel site={site} onChange={setSite} />}
      {tab === 'design' && (
        <div className="flex flex-col gap-6">
          <SystemDiagram design={design} site={site} />
          <ResultsPanel design={design} site={site} />
        </div>
      )}
      {tab === 'upgrade' && (
        <div className="flex flex-col gap-6">
          <div className="card border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
            Upgrading an existing installation? Enter your current array, battery, inverter and controller below —
            we&apos;ll compare them against what your load profile from step 1 actually needs, and recommend exactly
            how many panels, batteries and cables to add.
          </div>
          <ExistingSystemPanel existing={existing} onChange={setExisting} />
          <UpgradeResults upgrade={upgrade} />
        </div>
      )}
      {tab === 'compare' && (
        <ScenarioCompare
          scenarios={scenarios}
          loading={scenariosLoading}
          error={scenarioError}
          signedIn={signedIn}
          currentLoads={loads}
          currentSite={site}
          catalog={catalog}
          onSave={saveScenario}
          onLoad={loadScenario}
          onDelete={deleteScenario}
        />
      )}

      <AiAssistant loads={loads} site={site} catalog={catalog} />
    </div>
  );
}
