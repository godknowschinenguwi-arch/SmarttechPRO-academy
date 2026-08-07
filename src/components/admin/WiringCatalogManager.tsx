'use client';
import { useState } from 'react';
import CatalogTable, { type ColumnSpec, type WithMeta } from './CatalogTable';
import type { CatalogCable, CatalogConduit, CatalogDistributionBoard, CatalogBreaker, CatalogWiringAccessory } from '@/lib/wiring/types';

type Kind = 'cable' | 'conduit' | 'board' | 'breaker' | 'accessory';

const CABLE_COLUMNS: ColumnSpec<Omit<CatalogCable, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'csaMm2', label: 'CSA (mm²)', type: 'number', step: 0.5 },
  { key: 'maxCurrentA', label: 'Max current (A)', type: 'number', step: 0.5 },
  { key: 'spoolLengthM', label: 'Spool (m)', type: 'number' },
  { key: 'priceUsdPerSpool', label: 'Price/spool ($)', type: 'number' },
];

const CONDUIT_COLUMNS: ColumnSpec<Omit<CatalogConduit, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'diameterMm', label: 'Diameter (mm)', type: 'number' },
  { key: 'lengthM', label: 'Length (m)', type: 'number', step: 0.5 },
  { key: 'priceUsdPerLength', label: 'Price/length ($)', type: 'number' },
];

const BOARD_COLUMNS: ColumnSpec<Omit<CatalogDistributionBoard, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'ways', label: 'Ways', type: 'number' },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

const BREAKER_COLUMNS: ColumnSpec<Omit<CatalogBreaker, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'type', label: 'Type', type: 'select', options: ['MCB', 'RCD', 'ISOLATOR'] },
  { key: 'ampRating', label: 'Amp rating', type: 'number' },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

const ACCESSORY_COLUMNS: ColumnSpec<Omit<CatalogWiringAccessory, 'id'>>[] = [
  { key: 'category', label: 'Category', type: 'select', options: ['SWITCH', 'SOCKET_OUTLET', 'LIGHT_FITTING', 'JUNCTION_BOX', 'OTHER'] },
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'spec', label: 'Spec', type: 'text' },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

function emptyCable(): Omit<CatalogCable, 'id'> {
  return { brand: '', model: '', csaMm2: 1.5, maxCurrentA: 17.5, spoolLengthM: 100, priceUsdPerSpool: 45 };
}
function emptyConduit(): Omit<CatalogConduit, 'id'> {
  return { brand: '', model: '', diameterMm: 20, lengthM: 3, priceUsdPerLength: 2.2 };
}
function emptyBoard(): Omit<CatalogDistributionBoard, 'id'> {
  return { brand: '', model: '', ways: 8, priceUsd: 48 };
}
function emptyBreaker(): Omit<CatalogBreaker, 'id'> {
  return { brand: '', model: '', type: 'MCB', ampRating: 20, priceUsd: 7 };
}
function emptyAccessory(): Omit<CatalogWiringAccessory, 'id'> {
  return { category: 'SWITCH', brand: '', model: '', spec: '', priceUsd: 3.2 };
}

const TABS: { id: Kind; label: string }[] = [
  { id: 'cable', label: 'Cable' },
  { id: 'conduit', label: 'Conduit' },
  { id: 'board', label: 'Boards' },
  { id: 'breaker', label: 'Breakers' },
  { id: 'accessory', label: 'Accessories' },
];

export default function WiringCatalogManager({
  cables,
  conduits,
  boards,
  breakers,
  accessories,
}: {
  cables: WithMeta<CatalogCable>[];
  conduits: WithMeta<CatalogConduit>[];
  boards: WithMeta<CatalogDistributionBoard>[];
  breakers: WithMeta<CatalogBreaker>[];
  accessories: WithMeta<CatalogWiringAccessory>[];
}) {
  const [tab, setTab] = useState<Kind>('cable');
  const API_BASE = '/api/admin/wiring-catalog';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1 rounded-xl border border-surface-line bg-white p-1">
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

      {tab === 'cable' && <CatalogTable apiBase={`${API_BASE}/cable`} columns={CABLE_COLUMNS} initialRows={cables} emptyRow={emptyCable()} />}
      {tab === 'conduit' && <CatalogTable apiBase={`${API_BASE}/conduit`} columns={CONDUIT_COLUMNS} initialRows={conduits} emptyRow={emptyConduit()} />}
      {tab === 'board' && <CatalogTable apiBase={`${API_BASE}/board`} columns={BOARD_COLUMNS} initialRows={boards} emptyRow={emptyBoard()} />}
      {tab === 'breaker' && <CatalogTable apiBase={`${API_BASE}/breaker`} columns={BREAKER_COLUMNS} initialRows={breakers} emptyRow={emptyBreaker()} />}
      {tab === 'accessory' && <CatalogTable apiBase={`${API_BASE}/accessory`} columns={ACCESSORY_COLUMNS} initialRows={accessories} emptyRow={emptyAccessory()} />}
    </div>
  );
}
