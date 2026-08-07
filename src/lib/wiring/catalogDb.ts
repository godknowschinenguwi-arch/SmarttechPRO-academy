// Server-only data access for the admin-editable house wiring equipment
// catalog. Never import this from a 'use client' component.
import { makeCatalogStore } from '../catalogStoreFactory';
import type { CatalogCable, CatalogConduit, CatalogDistributionBoard, CatalogBreaker, CatalogWiringAccessory } from './types';

export const cableStore = makeCatalogStore<CatalogCable>('WiringCable', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'csaMm2', kind: 'number' },
  { name: 'maxCurrentA', kind: 'number' },
  { name: 'spoolLengthM', kind: 'number' },
  { name: 'priceUsdPerSpool', kind: 'number' },
]);

export const conduitStore = makeCatalogStore<CatalogConduit>('WiringConduit', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'diameterMm', kind: 'number' },
  { name: 'lengthM', kind: 'number' },
  { name: 'priceUsdPerLength', kind: 'number' },
]);

export const boardStore = makeCatalogStore<CatalogDistributionBoard>('WiringBoard', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'ways', kind: 'number' },
  { name: 'priceUsd', kind: 'number' },
]);

export const breakerStore = makeCatalogStore<CatalogBreaker>('WiringBreaker', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'type', kind: 'string' },
  { name: 'ampRating', kind: 'number' },
  { name: 'priceUsd', kind: 'number' },
]);

export const accessoryStore = makeCatalogStore<CatalogWiringAccessory>('WiringAccessory', [
  { name: 'category', kind: 'string' },
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'spec', kind: 'string' },
  { name: 'priceUsd', kind: 'number' },
]);

export const CATALOG_STORES = {
  cable: cableStore,
  conduit: conduitStore,
  board: boardStore,
  breaker: breakerStore,
  accessory: accessoryStore,
} as const;

export type CatalogKind = keyof typeof CATALOG_STORES;
