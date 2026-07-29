// Server-only data access for the admin-editable CCTV equipment catalog.
// Never import this from a 'use client' component.
import { makeCatalogStore } from '../catalogStoreFactory';
import type { CatalogCamera, CatalogNvr, CatalogHdd, CatalogCable, CatalogPoeSwitch, CatalogAccessory } from './types';

export const cameraStore = makeCatalogStore<CatalogCamera>('CctvCamera', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'systemType', kind: 'string' },
  { name: 'type', kind: 'string' },
  { name: 'environment', kind: 'string' },
  { name: 'resolutionMp', kind: 'number' },
  { name: 'lowLight', kind: 'boolean' },
  { name: 'poeWatts', kind: 'number' },
  { name: 'priceUsd', kind: 'number' },
]);

export const nvrStore = makeCatalogStore<CatalogNvr>('CctvNvr', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'systemType', kind: 'string' },
  { name: 'channels', kind: 'number' },
  { name: 'poePorts', kind: 'number' },
  { name: 'poeBudgetW', kind: 'number' },
  { name: 'maxHddBays', kind: 'number' },
  { name: 'priceUsd', kind: 'number' },
]);

export const hddStore = makeCatalogStore<CatalogHdd>('CctvHdd', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'capacityTb', kind: 'number' },
  { name: 'priceUsd', kind: 'number' },
]);

export const cableStore = makeCatalogStore<CatalogCable>('CctvCable', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'type', kind: 'string' },
  { name: 'spoolLengthM', kind: 'number' },
  { name: 'priceUsdPerSpool', kind: 'number' },
]);

export const poeSwitchStore = makeCatalogStore<CatalogPoeSwitch>('CctvPoeSwitch', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'ports', kind: 'number' },
  { name: 'poeBudgetW', kind: 'number' },
  { name: 'priceUsd', kind: 'number' },
]);

export const accessoryStore = makeCatalogStore<CatalogAccessory>('CctvAccessory', [
  { name: 'category', kind: 'string' },
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'spec', kind: 'string' },
  { name: 'priceUsd', kind: 'number' },
]);

export const CATALOG_STORES = {
  camera: cameraStore,
  nvr: nvrStore,
  hdd: hddStore,
  cable: cableStore,
  poeSwitch: poeSwitchStore,
  accessory: accessoryStore,
} as const;

export type CatalogKind = keyof typeof CATALOG_STORES;
