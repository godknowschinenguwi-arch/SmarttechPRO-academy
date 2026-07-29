'use client';
import { useState } from 'react';
import CatalogTable, { type ColumnSpec, type WithMeta } from './CatalogTable';
import type { CatalogEnergizer, CatalogWire, CatalogPost, CatalogMonitor, CatalogBackupBattery, CatalogFenceAccessory } from '@/lib/electricfence/types';

type Kind = 'energizer' | 'wire' | 'post' | 'monitor' | 'battery' | 'accessory';

const ENERGIZER_COLUMNS: ColumnSpec<Omit<CatalogEnergizer, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'joulesOutput', label: 'Joules', type: 'number', step: 0.5 },
  { key: 'maxFenceKm', label: 'Max range (km)', type: 'number', step: 0.5 },
  { key: 'currentDrawA', label: 'Current draw (A)', type: 'number', step: 0.01 },
  { key: 'bundledBatteryAh', label: 'Bundled battery (Ah)', type: 'number', step: 1 },
  { key: 'bundledSiren', label: 'Bundled siren', type: 'checkbox' },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

const WIRE_COLUMNS: ColumnSpec<Omit<CatalogWire, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'type', label: 'Type', type: 'select', options: ['HT_WIRE', 'BRAIDED_WIRE'] },
  { key: 'ohmsPerKm', label: 'Ohms/km', type: 'number', step: 0.1 },
  { key: 'spoolLengthM', label: 'Spool (m)', type: 'number' },
  { key: 'priceUsdPerSpool', label: 'Price/spool ($)', type: 'number' },
];

const POST_COLUMNS: ColumnSpec<Omit<CatalogPost, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'material', label: 'Material', type: 'select', options: ['STEEL', 'TIMBER', 'CONCRETE'] },
  { key: 'shape', label: 'Shape', type: 'select', options: ['STANDARD', 'SQUARE_STRAIGHT', 'SQUARE_BEND'] },
  { key: 'heightM', label: 'Height (m)', type: 'number', step: 0.1 },
  { key: 'insulatorsIncluded', label: 'Bobbins pre-fitted', type: 'checkbox' },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

const ACCESSORY_COLUMNS: ColumnSpec<Omit<CatalogFenceAccessory, 'id'>>[] = [
  { key: 'category', label: 'Category', type: 'select', options: ['COMPRESSION_SPRING', 'HOOK', 'COPPER_FERRULE', 'FENCE_LIGHT', 'LIGHTNING_DIVERTER', 'OTHER'] },
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'spec', label: 'Spec', type: 'text' },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

const MONITOR_COLUMNS: ColumnSpec<Omit<CatalogMonitor, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'maxZones', label: 'Max zones', type: 'number' },
  { key: 'gsmCapable', label: 'GSM alert', type: 'checkbox' },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

const BATTERY_COLUMNS: ColumnSpec<Omit<CatalogBackupBattery, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'voltage', label: 'Volts', type: 'number' },
  { key: 'ah', label: 'Ah', type: 'number' },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

function emptyEnergizer(): Omit<CatalogEnergizer, 'id'> {
  return { brand: '', model: '', joulesOutput: 5, maxFenceKm: 15, currentDrawA: 0.15, voltageOptions: [12], bundledBatteryAh: 7, bundledSiren: true, priceUsd: 200 };
}
function emptyWire(): Omit<CatalogWire, 'id'> {
  return { brand: '', model: '', type: 'HT_WIRE', ohmsPerKm: 2, spoolLengthM: 500, priceUsdPerSpool: 45 };
}
function emptyPost(): Omit<CatalogPost, 'id'> {
  return { brand: '', model: '', material: 'STEEL', shape: 'STANDARD', heightM: 1.8, insulatorsIncluded: false, priceUsd: 6.5 };
}
function emptyMonitor(): Omit<CatalogMonitor, 'id'> {
  return { brand: '', model: '', maxZones: 4, gsmCapable: false, priceUsd: 180 };
}
function emptyBattery(): Omit<CatalogBackupBattery, 'id'> {
  return { brand: '', model: '', voltage: 12, ah: 18, priceUsd: 42 };
}
function emptyAccessory(): Omit<CatalogFenceAccessory, 'id'> {
  return { category: 'COMPRESSION_SPRING', brand: '', model: '', spec: '', priceUsd: 2 };
}

const TABS: { id: Kind; label: string }[] = [
  { id: 'energizer', label: 'Energizers' },
  { id: 'wire', label: 'Wire' },
  { id: 'post', label: 'Posts' },
  { id: 'monitor', label: 'Monitors' },
  { id: 'battery', label: 'Batteries' },
  { id: 'accessory', label: 'Accessories' },
];

export default function FenceCatalogManager({
  energizers,
  wires,
  posts,
  monitors,
  batteries,
  accessories,
}: {
  energizers: WithMeta<CatalogEnergizer>[];
  wires: WithMeta<CatalogWire>[];
  posts: WithMeta<CatalogPost>[];
  monitors: WithMeta<CatalogMonitor>[];
  batteries: WithMeta<CatalogBackupBattery>[];
  accessories: WithMeta<CatalogFenceAccessory>[];
}) {
  const [tab, setTab] = useState<Kind>('energizer');
  const API_BASE = '/api/admin/fence-catalog';

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

      {tab === 'energizer' && <CatalogTable apiBase={`${API_BASE}/energizer`} columns={ENERGIZER_COLUMNS} initialRows={energizers} emptyRow={emptyEnergizer()} />}
      {tab === 'wire' && <CatalogTable apiBase={`${API_BASE}/wire`} columns={WIRE_COLUMNS} initialRows={wires} emptyRow={emptyWire()} />}
      {tab === 'post' && <CatalogTable apiBase={`${API_BASE}/post`} columns={POST_COLUMNS} initialRows={posts} emptyRow={emptyPost()} />}
      {tab === 'monitor' && <CatalogTable apiBase={`${API_BASE}/monitor`} columns={MONITOR_COLUMNS} initialRows={monitors} emptyRow={emptyMonitor()} />}
      {tab === 'battery' && <CatalogTable apiBase={`${API_BASE}/battery`} columns={BATTERY_COLUMNS} initialRows={batteries} emptyRow={emptyBattery()} />}
      {tab === 'accessory' && <CatalogTable apiBase={`${API_BASE}/accessory`} columns={ACCESSORY_COLUMNS} initialRows={accessories} emptyRow={emptyAccessory()} />}
    </div>
  );
}
