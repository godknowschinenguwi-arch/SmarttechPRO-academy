// Server-only: request validation + auth guard shared by the admin CCTV
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

export function coerceCatalogFields(kind: CatalogKind, body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const has = (k: string) => k in body;

  if (has('brand')) out.brand = str(body.brand, 'Unbranded');
  if (has('model')) out.model = str(body.model, 'Model');
  if (has('active')) out.active = !!body.active;
  if (has('priceUsd')) out.priceUsd = Math.max(0, num(body.priceUsd));

  if (kind === 'camera') {
    if (has('type')) out.type = ['DOME', 'BULLET', 'TURRET', 'PTZ'].includes(body.type as string) ? body.type : 'DOME';
    if (has('environment')) out.environment = body.environment === 'OUTDOOR' ? 'OUTDOOR' : 'INDOOR';
    if (has('resolutionMp')) out.resolutionMp = Math.max(1, num(body.resolutionMp, 4));
    if (has('lowLight')) out.lowLight = !!body.lowLight;
    if (has('poeWatts')) out.poeWatts = Math.max(0, num(body.poeWatts));
  } else if (kind === 'nvr') {
    if (has('channels')) out.channels = Math.max(1, num(body.channels, 4));
    if (has('poePorts')) out.poePorts = Math.max(0, num(body.poePorts));
    if (has('poeBudgetW')) out.poeBudgetW = Math.max(0, num(body.poeBudgetW));
    if (has('maxHddBays')) out.maxHddBays = Math.max(1, num(body.maxHddBays, 1));
  } else if (kind === 'hdd') {
    if (has('capacityTb')) out.capacityTb = Math.max(0.1, num(body.capacityTb, 1));
  } else if (kind === 'cable') {
    if (has('type')) out.type = body.type === 'COAX_POWER' ? 'COAX_POWER' : 'CAT6';
    if (has('spoolLengthM')) out.spoolLengthM = Math.max(1, num(body.spoolLengthM));
    if (has('priceUsdPerSpool')) out.priceUsdPerSpool = Math.max(0, num(body.priceUsdPerSpool));
  } else if (kind === 'poeSwitch') {
    if (has('ports')) out.ports = Math.max(1, num(body.ports, 8));
    if (has('poeBudgetW')) out.poeBudgetW = Math.max(0, num(body.poeBudgetW));
  }

  return out;
}

export const REQUIRED_FIELDS: Record<CatalogKind, string[]> = {
  camera: ['brand', 'model', 'type', 'environment', 'resolutionMp', 'poeWatts', 'priceUsd'],
  nvr: ['brand', 'model', 'channels', 'poePorts', 'poeBudgetW', 'maxHddBays', 'priceUsd'],
  hdd: ['brand', 'model', 'capacityTb', 'priceUsd'],
  cable: ['brand', 'model', 'type', 'spoolLengthM', 'priceUsdPerSpool'],
  poeSwitch: ['brand', 'model', 'ports', 'poeBudgetW', 'priceUsd'],
};
