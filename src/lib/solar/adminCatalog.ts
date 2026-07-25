// Server-only: request validation + auth guard shared by the admin solar
// catalog API routes.
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

// Coerces a raw request body into the field shape expected by each catalog
// table, applying only fields relevant to that kind. Used for both create
// (all fields present) and update (only supplied fields are included).
export function coerceCatalogFields(kind: CatalogKind, body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const has = (k: string) => k in body;

  if (has('brand')) out.brand = str(body.brand, 'Unbranded');
  if (has('model')) out.model = str(body.model, 'Model');
  if (has('active')) out.active = !!body.active;
  if (has('priceUsd')) out.priceUsd = Math.max(0, num(body.priceUsd));

  if (kind === 'panel') {
    if (has('wattage')) out.wattage = Math.max(1, num(body.wattage));
    if (has('vmp')) out.vmp = Math.max(0, num(body.vmp));
    if (has('imp')) out.imp = Math.max(0, num(body.imp));
    if (has('voc')) out.voc = Math.max(0, num(body.voc));
    if (has('isc')) out.isc = Math.max(0, num(body.isc));
  } else if (kind === 'battery') {
    if (has('chemistry')) out.chemistry = ['LFP', 'AGM', 'GEL', 'FLOODED'].includes(body.chemistry as string) ? body.chemistry : 'LFP';
    if (has('voltage')) out.voltage = Math.max(1, num(body.voltage));
    if (has('ah')) out.ah = Math.max(1, num(body.ah));
    if (has('maxDodPct')) out.maxDodPct = Math.min(1, Math.max(0.1, num(body.maxDodPct, 0.5)));
    if (has('roundTripEff')) out.roundTripEff = Math.min(1, Math.max(0.1, num(body.roundTripEff, 0.85)));
    if (has('cycleLife')) out.cycleLife = Math.max(0, num(body.cycleLife));
  } else if (kind === 'inverter') {
    if (has('type')) out.type = ['OFF_GRID', 'HYBRID', 'GRID_TIE'].includes(body.type as string) ? body.type : 'HYBRID';
    if (has('continuousW')) out.continuousW = Math.max(1, num(body.continuousW));
    if (has('surgeW')) out.surgeW = Math.max(1, num(body.surgeW));
    if (has('voltageOptions')) {
      const arr = Array.isArray(body.voltageOptions) ? body.voltageOptions.filter((v) => v === 12 || v === 24 || v === 48) : [];
      out.voltageOptions = arr.length ? arr : [48];
    }
    if (has('mpptBuiltIn')) out.mpptBuiltIn = !!body.mpptBuiltIn;
    if (has('efficiencyPct')) out.efficiencyPct = Math.min(1, Math.max(0.1, num(body.efficiencyPct, 0.9)));
  } else if (kind === 'controller') {
    if (has('type')) out.type = body.type === 'PWM' ? 'PWM' : 'MPPT';
    if (has('maxAmps')) out.maxAmps = Math.max(1, num(body.maxAmps));
    if (has('maxPvVoltage')) out.maxPvVoltage = Math.max(1, num(body.maxPvVoltage));
  }

  return out;
}

export const REQUIRED_FIELDS: Record<CatalogKind, string[]> = {
  panel: ['brand', 'model', 'wattage', 'vmp', 'imp', 'voc', 'isc', 'priceUsd'],
  battery: ['brand', 'model', 'chemistry', 'voltage', 'ah', 'maxDodPct', 'roundTripEff', 'cycleLife', 'priceUsd'],
  inverter: ['brand', 'model', 'type', 'continuousW', 'surgeW', 'priceUsd'],
  controller: ['brand', 'model', 'type', 'maxAmps', 'maxPvVoltage', 'priceUsd'],
};
