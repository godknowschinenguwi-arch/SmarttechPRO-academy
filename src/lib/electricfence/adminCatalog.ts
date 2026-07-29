// Server-only: request validation + auth guard shared by the admin electric
// fence catalog API routes.
import { currentUser } from '@/lib/auth';
import { CATALOG_STORES, type CatalogKind } from './catalogDb';

export async function requireAdmin(): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const user = await currentUser();
  if (!user) return { ok: false, status: 401, error: 'Unauthorized' };
  if (user.role !== 'ADMIN') return { ok: false, status: 403, error: 'Forbidden' };
  return { ok: true };
}

export function isCatalogKind(kind: string): kind is CatalogKind {
  return kind in CATALOG_STORES;
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v.slice(0, 80) : fallback;
}
function num(v: unknown, fallback = 0): number {
  return Number.isFinite(Number(v)) ? Number(v) : fallback;
}

export function coerceCatalogFields(kind: CatalogKind, body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const has = (k: string) => k in body;

  if (has('brand')) out.brand = str(body.brand, 'Unbranded');
  if (has('model')) out.model = str(body.model, 'Model');
  if (has('active')) out.active = !!body.active;
  if (has('priceUsd')) out.priceUsd = Math.max(0, num(body.priceUsd));

  if (kind === 'energizer') {
    if (has('joulesOutput')) out.joulesOutput = Math.max(0.1, num(body.joulesOutput));
    if (has('maxFenceKm')) out.maxFenceKm = Math.max(0.1, num(body.maxFenceKm));
    if (has('currentDrawA')) out.currentDrawA = Math.max(0, num(body.currentDrawA));
    if (has('voltageOptions')) {
      const arr = Array.isArray(body.voltageOptions) ? body.voltageOptions.filter((v) => v === 12 || v === 24) : [];
      out.voltageOptions = arr.length ? arr : [12];
    }
    if (has('bundledBatteryAh')) out.bundledBatteryAh = Math.max(0, num(body.bundledBatteryAh));
    if (has('bundledSiren')) out.bundledSiren = !!body.bundledSiren;
  } else if (kind === 'wire') {
    if (has('type')) out.type = body.type === 'BRAIDED_WIRE' ? 'BRAIDED_WIRE' : 'HT_WIRE';
    if (has('ohmsPerKm')) out.ohmsPerKm = Math.max(0, num(body.ohmsPerKm));
    if (has('spoolLengthM')) out.spoolLengthM = Math.max(1, num(body.spoolLengthM));
    if (has('priceUsdPerSpool')) out.priceUsdPerSpool = Math.max(0, num(body.priceUsdPerSpool));
  } else if (kind === 'post') {
    if (has('material')) out.material = ['STEEL', 'TIMBER', 'CONCRETE'].includes(body.material as string) ? body.material : 'STEEL';
    if (has('shape')) out.shape = ['STANDARD', 'SQUARE_STRAIGHT', 'SQUARE_BEND'].includes(body.shape as string) ? body.shape : 'STANDARD';
    if (has('heightM')) out.heightM = Math.max(0.1, num(body.heightM));
    if (has('insulatorsIncluded')) out.insulatorsIncluded = !!body.insulatorsIncluded;
  } else if (kind === 'monitor') {
    if (has('maxZones')) out.maxZones = Math.max(1, num(body.maxZones));
    if (has('gsmCapable')) out.gsmCapable = !!body.gsmCapable;
  } else if (kind === 'battery') {
    if (has('voltage')) out.voltage = Math.max(1, num(body.voltage));
    if (has('ah')) out.ah = Math.max(1, num(body.ah));
  } else if (kind === 'accessory') {
    if (has('category')) out.category = ['COMPRESSION_SPRING', 'HOOK', 'COPPER_FERRULE', 'FENCE_LIGHT', 'LIGHTNING_DIVERTER', 'OTHER'].includes(body.category as string) ? body.category : 'OTHER';
    if (has('spec')) out.spec = str(body.spec, '');
  }

  return out;
}

export const REQUIRED_FIELDS: Record<CatalogKind, string[]> = {
  energizer: ['brand', 'model', 'joulesOutput', 'maxFenceKm', 'currentDrawA', 'bundledBatteryAh', 'priceUsd'],
  wire: ['brand', 'model', 'type', 'ohmsPerKm', 'spoolLengthM', 'priceUsdPerSpool'],
  post: ['brand', 'model', 'material', 'shape', 'heightM', 'priceUsd'],
  monitor: ['brand', 'model', 'maxZones', 'priceUsd'],
  battery: ['brand', 'model', 'voltage', 'ah', 'priceUsd'],
  accessory: ['category', 'brand', 'model', 'spec', 'priceUsd'],
};
