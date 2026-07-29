// Server-only data access for the admin-editable electric fence equipment
// catalog. Never import this from a 'use client' component.
import { makeCatalogStore } from '../catalogStoreFactory';
import type { CatalogEnergizer, CatalogWire, CatalogPost, CatalogMonitor, CatalogBackupBattery, CatalogFenceAccessory } from './types';

export const energizerStore = makeCatalogStore<CatalogEnergizer>('FenceEnergizer', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'joulesOutput', kind: 'number' },
  { name: 'maxFenceKm', kind: 'number' },
  { name: 'currentDrawA', kind: 'number' },
  { name: 'voltageOptions', kind: 'json' },
  { name: 'bundledBatteryAh', kind: 'number' },
  { name: 'bundledSiren', kind: 'boolean' },
  { name: 'priceUsd', kind: 'number' },
]);

export const wireStore = makeCatalogStore<CatalogWire>('FenceWire', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'type', kind: 'string' },
  { name: 'ohmsPerKm', kind: 'number' },
  { name: 'spoolLengthM', kind: 'number' },
  { name: 'priceUsdPerSpool', kind: 'number' },
]);

export const postStore = makeCatalogStore<CatalogPost>('FencePost', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'material', kind: 'string' },
  { name: 'shape', kind: 'string' },
  { name: 'heightM', kind: 'number' },
  { name: 'insulatorsIncluded', kind: 'boolean' },
  { name: 'priceUsd', kind: 'number' },
]);

export const monitorStore = makeCatalogStore<CatalogMonitor>('FenceMonitor', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'maxZones', kind: 'number' },
  { name: 'gsmCapable', kind: 'boolean' },
  { name: 'priceUsd', kind: 'number' },
]);

export const batteryStore = makeCatalogStore<CatalogBackupBattery>('FenceBattery', [
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'voltage', kind: 'number' },
  { name: 'ah', kind: 'number' },
  { name: 'priceUsd', kind: 'number' },
]);

export const accessoryStore = makeCatalogStore<CatalogFenceAccessory>('FenceAccessory', [
  { name: 'category', kind: 'string' },
  { name: 'brand', kind: 'string' },
  { name: 'model', kind: 'string' },
  { name: 'spec', kind: 'string' },
  { name: 'priceUsd', kind: 'number' },
]);

export const CATALOG_STORES = {
  energizer: energizerStore,
  wire: wireStore,
  post: postStore,
  monitor: monitorStore,
  battery: batteryStore,
  accessory: accessoryStore,
} as const;

export type CatalogKind = keyof typeof CATALOG_STORES;
