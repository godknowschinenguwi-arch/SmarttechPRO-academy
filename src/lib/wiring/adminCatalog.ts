// Server-only: request validation + auth guard shared by the admin house
// wiring catalog API routes.
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

  if (kind === 'cable') {
    if (has('csaMm2')) out.csaMm2 = Math.max(0.5, num(body.csaMm2, 1.5));
    if (has('maxCurrentA')) out.maxCurrentA = Math.max(1, num(body.maxCurrentA));
    if (has('spoolLengthM')) out.spoolLengthM = Math.max(1, num(body.spoolLengthM));
    if (has('priceUsdPerSpool')) out.priceUsdPerSpool = Math.max(0, num(body.priceUsdPerSpool));
  } else if (kind === 'conduit') {
    if (has('diameterMm')) out.diameterMm = Math.max(1, num(body.diameterMm, 20));
    if (has('lengthM')) out.lengthM = Math.max(0.5, num(body.lengthM, 3));
    if (has('priceUsdPerLength')) out.priceUsdPerLength = Math.max(0, num(body.priceUsdPerLength));
  } else if (kind === 'board') {
    if (has('ways')) out.ways = Math.max(1, num(body.ways, 4));
  } else if (kind === 'breaker') {
    if (has('type')) out.type = ['MCB', 'RCD', 'ISOLATOR'].includes(body.type as string) ? body.type : 'MCB';
    if (has('ampRating')) out.ampRating = Math.max(1, num(body.ampRating, 10));
  } else if (kind === 'accessory') {
    if (has('category')) out.category = ['SWITCH', 'SOCKET_OUTLET', 'LIGHT_FITTING', 'JUNCTION_BOX', 'OTHER'].includes(body.category as string) ? body.category : 'OTHER';
    if (has('spec')) out.spec = str(body.spec, '');
  }

  return out;
}

export const REQUIRED_FIELDS: Record<CatalogKind, string[]> = {
  cable: ['brand', 'model', 'csaMm2', 'maxCurrentA', 'spoolLengthM', 'priceUsdPerSpool'],
  conduit: ['brand', 'model', 'diameterMm', 'lengthM', 'priceUsdPerLength'],
  board: ['brand', 'model', 'ways', 'priceUsd'],
  breaker: ['brand', 'model', 'type', 'ampRating', 'priceUsd'],
  accessory: ['category', 'brand', 'model', 'spec', 'priceUsd'],
};
