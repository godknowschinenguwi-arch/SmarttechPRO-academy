// Server-only data access for the admin-editable solar equipment catalog.
// Never import this from a 'use client' component — it touches the DB layer.
import { makeCatalogStore } from '../catalogStoreFactory';
import type { CatalogPanel, CatalogBattery, CatalogInverter, CatalogController } from './types';

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
