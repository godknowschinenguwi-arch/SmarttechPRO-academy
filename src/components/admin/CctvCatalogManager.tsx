'use client';
import { useState } from 'react';
import CatalogTable, { type ColumnSpec, type WithMeta } from './CatalogTable';
import type { CatalogCamera, CatalogNvr, CatalogHdd, CatalogCable, CatalogPoeSwitch } from '@/lib/cctv/types';

type Kind = 'camera' | 'nvr' | 'hdd' | 'cable' | 'poeSwitch';

const CAMERA_COLUMNS: ColumnSpec<Omit<CatalogCamera, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'type', label: 'Type', type: 'select', options: ['DOME', 'BULLET', 'TURRET', 'PTZ'] },
  { key: 'environment', label: 'Environment', type: 'select', options: ['INDOOR', 'OUTDOOR'] },
  { key: 'resolutionMp', label: 'Resolution (MP)', type: 'number' },
  { key: 'lowLight', label: 'Low-light', type: 'checkbox' },
  { key: 'poeWatts', label: 'PoE (W)', type: 'number', step: 0.5 },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

const NVR_COLUMNS: ColumnSpec<Omit<CatalogNvr, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'channels', label: 'Channels', type: 'number' },
  { key: 'poePorts', label: 'PoE ports', type: 'number' },
  { key: 'poeBudgetW', label: 'PoE budget (W)', type: 'number' },
  { key: 'maxHddBays', label: 'HDD bays', type: 'number' },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

const HDD_COLUMNS: ColumnSpec<Omit<CatalogHdd, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'capacityTb', label: 'Capacity (TB)', type: 'number', step: 0.5 },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

const CABLE_COLUMNS: ColumnSpec<Omit<CatalogCable, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'type', label: 'Type', type: 'select', options: ['CAT6', 'COAX_POWER'] },
  { key: 'spoolLengthM', label: 'Spool (m)', type: 'number' },
  { key: 'priceUsdPerSpool', label: 'Price/spool ($)', type: 'number' },
];

const POE_SWITCH_COLUMNS: ColumnSpec<Omit<CatalogPoeSwitch, 'id'>>[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'ports', label: 'Ports', type: 'number' },
  { key: 'poeBudgetW', label: 'PoE budget (W)', type: 'number' },
  { key: 'priceUsd', label: 'Price ($)', type: 'number' },
];

function emptyCamera(): Omit<CatalogCamera, 'id'> {
  return { brand: '', model: '', type: 'DOME', environment: 'INDOOR', resolutionMp: 4, lowLight: false, poeWatts: 7, priceUsd: 52 };
}
function emptyNvr(): Omit<CatalogNvr, 'id'> {
  return { brand: '', model: '', channels: 8, poePorts: 8, poeBudgetW: 96, maxHddBays: 2, priceUsd: 175 };
}
function emptyHdd(): Omit<CatalogHdd, 'id'> {
  return { brand: '', model: '', capacityTb: 2, priceUsd: 65 };
}
function emptyCable(): Omit<CatalogCable, 'id'> {
  return { brand: '', model: '', type: 'CAT6', spoolLengthM: 305, priceUsdPerSpool: 75 };
}
function emptyPoeSwitch(): Omit<CatalogPoeSwitch, 'id'> {
  return { brand: '', model: '', ports: 8, poeBudgetW: 124, priceUsd: 85 };
}

const TABS: { id: Kind; label: string }[] = [
  { id: 'camera', label: 'Cameras' },
  { id: 'nvr', label: 'NVR/DVR' },
  { id: 'hdd', label: 'Storage' },
  { id: 'cable', label: 'Cable' },
  { id: 'poeSwitch', label: 'PoE switches' },
];

export default function CctvCatalogManager({
  cameras,
  nvrs,
  hdds,
  cables,
  poeSwitches,
}: {
  cameras: WithMeta<CatalogCamera>[];
  nvrs: WithMeta<CatalogNvr>[];
  hdds: WithMeta<CatalogHdd>[];
  cables: WithMeta<CatalogCable>[];
  poeSwitches: WithMeta<CatalogPoeSwitch>[];
}) {
  const [tab, setTab] = useState<Kind>('camera');
  const API_BASE = '/api/admin/cctv-catalog';

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

      {tab === 'camera' && <CatalogTable apiBase={`${API_BASE}/camera`} columns={CAMERA_COLUMNS} initialRows={cameras} emptyRow={emptyCamera()} />}
      {tab === 'nvr' && <CatalogTable apiBase={`${API_BASE}/nvr`} columns={NVR_COLUMNS} initialRows={nvrs} emptyRow={emptyNvr()} />}
      {tab === 'hdd' && <CatalogTable apiBase={`${API_BASE}/hdd`} columns={HDD_COLUMNS} initialRows={hdds} emptyRow={emptyHdd()} />}
      {tab === 'cable' && <CatalogTable apiBase={`${API_BASE}/cable`} columns={CABLE_COLUMNS} initialRows={cables} emptyRow={emptyCable()} />}
      {tab === 'poeSwitch' && <CatalogTable apiBase={`${API_BASE}/poeSwitch`} columns={POE_SWITCH_COLUMNS} initialRows={poeSwitches} emptyRow={emptyPoeSwitch()} />}
    </div>
  );
}
