'use client';
import { useState } from 'react';
import CatalogTable, { type ColumnSpec, type WithMeta } from './CatalogTable';
import type { CatalogPanel, CatalogBattery, CatalogInverter, CatalogController } from '@/lib/solar/types';

type Kind = 'panel' | 'battery' | 'inverter' | 'controller';

const PANEL_COLUMNS: ColumnSpec<Omit<CatalogPanel, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'wattage', label: 'Watts', type: 'number' },
  { key: 'vmp', label: 'Vmp', type: 'number', step: 0.1 },
  { key: 'imp', label: 'Imp', type: 'number', step: 0.1 },
  { key: 'voc', label: 'Voc', type: 'number', step: 0.1 },
  { key: 'isc', label: 'Isc', type: 'number', step: 0.1 },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

const BATTERY_COLUMNS: ColumnSpec<Omit<CatalogBattery, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'chemistry', label: 'Chemistry', type: 'select', options: ['LFP', 'AGM', 'GEL', 'FLOODED'] },
  { key: 'voltage', label: 'Volts', type: 'number' },
  { key: 'ah', label: 'Ah', type: 'number' },
  { key: 'maxDodPct', label: 'Max DoD', type: 'number', step: 0.05 },
  { key: 'roundTripEff', label: 'Rnd-trip eff.', type: 'number', step: 0.01 },
  { key: 'cycleLife', label: 'Cycles', type: 'number' },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

const INVERTER_COLUMNS: ColumnSpec<Omit<CatalogInverter, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'type', label: 'Type', type: 'select', options: ['OFF_GRID', 'HYBRID', 'GRID_TIE'] },
  { key: 'continuousW', label: 'Continuous W', type: 'number' },
  { key: 'surgeW', label: 'Surge W', type: 'number' },
  { key: 'mpptBuiltIn', label: 'Built-in MPPT', type: 'checkbox' },
  { key: 'efficiencyPct', label: 'Efficiency', type: 'number', step: 0.01 },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

const CONTROLLER_COLUMNS: ColumnSpec<Omit<CatalogController, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'type', label: 'Type', type: 'select', options: ['MPPT', 'PWM'] },
  { key: 'maxAmps', label: 'Max amps', type: 'number' },
  { key: 'maxPvVoltage', label: 'Max PV volts', type: 'number' },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

function emptyPanel(): Omit<CatalogPanel, 'id'> {
  return { brand: '', model: '', wattage: 450, vmp: 40, imp: 11, voc: 49, isc: 12, priceUsd: 120 };
}
function emptyBattery(): Omit<CatalogBattery, 'id'> {
  return { brand: '', model: '', chemistry: 'LFP', voltage: 12, ah: 100, maxDodPct: 0.9, roundTripEff: 0.96, cycleLife: 6000, priceUsd: 380 };
}
function emptyInverter(): Omit<CatalogInverter, 'id'> {
  return { brand: '', model: '', type: 'HYBRID', continuousW: 5000, surgeW: 10000, voltageOptions: [48], mpptBuiltIn: true, efficiencyPct: 0.97, priceUsd: 1150 };
}
function emptyController(): Omit<CatalogController, 'id'> {
  return { brand: '', model: '', type: 'MPPT', maxAmps: 60, maxPvVoltage: 150, priceUsd: 340 };
}

const TABS: { id: Kind; label: string }[] = [
  { id: 'panel', label: 'Panels' },
  { id: 'battery', label: 'Batteries' },
  { id: 'inverter', label: 'Inverters' },
  { id: 'controller', label: 'Controllers' },
];

export default function SolarCatalogManager({
  panels,
  batteries,
  inverters,
  controllers,
}: {
  panels: WithMeta<CatalogPanel>[];
  batteries: WithMeta<CatalogBattery>[];
  inverters: WithMeta<CatalogInverter>[];
  controllers: WithMeta<CatalogController>[];
}) {
  const [tab, setTab] = useState<Kind>('panel');
  const API_BASE = '/api/admin/solar-catalog';

  return (
    <div className="flex flex-col gap-4">
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

      {tab === 'panel' && <CatalogTable apiBase={`${API_BASE}/panel`} columns={PANEL_COLUMNS} initialRows={panels} emptyRow={emptyPanel()} />}
      {tab === 'battery' && <CatalogTable apiBase={`${API_BASE}/battery`} columns={BATTERY_COLUMNS} initialRows={batteries} emptyRow={emptyBattery()} />}
      {tab === 'inverter' && <CatalogTable apiBase={`${API_BASE}/inverter`} columns={INVERTER_COLUMNS} initialRows={inverters} emptyRow={emptyInverter()} />}
      {tab === 'controller' && <CatalogTable apiBase={`${API_BASE}/controller`} columns={CONTROLLER_COLUMNS} initialRows={controllers} emptyRow={emptyController()} />}
    </div>
  );
}
