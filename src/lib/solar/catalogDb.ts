// Server-only data access for the admin-editable solar equipment catalog.
// Never import this from a 'use client' component — it touches the DB layer.
import { all, insert, run } from '@/lib/db';
import type { CatalogPanel, CatalogBattery, CatalogInverter, CatalogController } from './types';

type FieldKind = 'string' | 'number' | 'boolean' | 'json';
interface FieldSpec {
  name: string;
  kind: FieldKind;
}

function toBool(v: unknown): boolean {
  return v === 1 || v === true || v === '1';
}

function rowToRecord<T>(row: Record<string, unknown>, fields: FieldSpec[]): T & { active: boolean } {
  const out: Record<string, unknown> = { id: row.id, active: toBool(row.active) };
  for (const f of fields) {
    const v = row[f.name];
    out[f.name] = f.kind === 'boolean' ? toBool(v) : f.kind === 'json' ? JSON.parse(String(v)) : v;
  }
  return out as T & { active: boolean };
}

function recordToRow(data: Record<string, unknown>, fields: FieldSpec[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (!(f.name in data)) continue;
    const v = data[f.name];
    out[f.name] = f.kind === 'boolean' ? (v ? 1 : 0) : f.kind === 'json' ? JSON.stringify(v) : v;
  }
  if ('active' in data) out.active = data.active ? 1 : 0;
  return out;
}

function makeCatalogStore<T extends { id: string }>(table: string, fields: FieldSpec[]) {
  return {
    async list(includeInactive = false): Promise<(T & { active: boolean })[]> {
      const rows = await all<Record<string, unknown>>(
        `SELECT * FROM ${table} ${includeInactive ? '' : 'WHERE active = 1'} ORDER BY brand, model`
      );
      return rows.map((r) => rowToRecord<T>(r, fields));
    },
    async create(data: Omit<T, 'id'> & { active?: boolean }): Promise<string> {
      const row = recordToRow({ ...data, active: data.active ?? true }, fields);
      return insert(table, row);
    },
    async update(id: string, data: Partial<Omit<T, 'id'>> & { active?: boolean }): Promise<void> {
      const row = recordToRow(data, fields);
      const keys = Object.keys(row);
      if (keys.length === 0) return;
      await run(`UPDATE ${table} SET ${keys.map((k) => `"${k}" = ?`).join(', ')} WHERE id = ?`, [
        ...keys.map((k) => row[k] as never),
        id,
      ]);
    },
    async remove(id: string): Promise<void> {
      await run(`DELETE FROM ${table} WHERE id = ?`, [id]);
    },
  };
}

export const panelStore = makeCatalogStore<CatalogPanel>('SolarPanel', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'wattage', kind: 'number' },
  { name: 'vmp', kind: 'number' },
  { name: 'imp', kind: 'number' },
  { name: 'voc', kind: 'number' },
  { name: 'isc', kind: 'number' },
  { name: 'priceUsd', kind: 'number' },
]);

export const batteryStore = makeCatalogStore<CatalogBattery>('SolarBattery', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'chemistry', kind: 'string' },
  { name: 'voltage', kind: 'number' },
  { name: 'ah', kind: 'number' },
  { name: 'maxDodPct', kind: 'number' },
  { name: 'roundTripEff', kind: 'number' },
  { name: 'cycleLife', kind: 'number' },
  { name: 'priceUsd', kind: 'number' },
]);

export const inverterStore = makeCatalogStore<CatalogInverter>('SolarInverter', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'type', kind: 'string' },
  { name: 'continuousW', kind: 'number' },
  { name: 'surgeW', kind: 'number' },
  { name: 'voltageOptions', kind: 'json' },
  { name: 'mpptBuiltIn', kind: 'boolean' },
  { name: 'efficiencyPct', kind: 'number' },
  { name: 'priceUsd', kind: 'number' },
]);

export const controllerStore = makeCatalogStore<CatalogController>('SolarController', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'type', kind: 'string' },
  { name: 'maxAmps', kind: 'number' },
  { name: 'maxPvVoltage', kind: 'number' },
  { name: 'priceUsd', kind: 'number' },
]);

export const CATALOG_STORES = {
  panel: panelStore,
  battery: batteryStore,
  inverter: inverterStore,
  controller: controllerStore,
} as const;

export type CatalogKind = keyof typeof CATALOG_STORES;
