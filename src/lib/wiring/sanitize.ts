// Shared request-payload sanitizers for the wiring calculator API routes —
// the client sends back its full circuits/config state, so every field is
// treated as untrusted input.
import { defaultWiringConfig } from './engine';
import type { WiringCircuit, WiringConfig, WiringCatalog, CatalogCable, CatalogConduit, CatalogDistributionBoard, CatalogBreaker, CatalogWiringAccessory } from './types';

const MAX_CIRCUITS = 100;
const MAX_CATALOG_ITEMS = 100;

export function sanitizeCircuits(input: unknown): WiringCircuit[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, MAX_CIRCUITS).map((raw, i) => {
    const c = raw as Partial<WiringCircuit>;
    return {
      id: typeof c.id === 'string' ? c.id : `ckt-${i}`,
      name: typeof c.name === 'string' ? c.name.slice(0, 60) : `Circuit ${i + 1}`,
      type: ['LIGHTING', 'SOCKET', 'DEDICATED'].includes(c.type as string) ? (c.type as WiringCircuit['type']) : 'LIGHTING',
      points: Number.isFinite(c.points) ? Math.min(30, Math.max(1, Number(c.points))) : 1,
      dedicatedLoadW: Number.isFinite(c.dedicatedLoadW) ? Math.min(30000, Math.max(0, Number(c.dedicatedLoadW))) : 0,
      cableRunM: Number.isFinite(c.cableRunM) ? Math.max(0, Number(c.cableRunM)) : 0,
    };
  });
}

export function sanitizeWiringConfig(input: unknown): WiringConfig {
  const d = defaultWiringConfig();
  if (!input || typeof input !== 'object') return d;
  const c = input as Partial<WiringConfig>;
  return {
    earthLeakageEnabled: c.earthLeakageEnabled === undefined ? d.earthLeakageEnabled : !!c.earthLeakageEnabled,
    surgeProtectionEnabled: !!c.surgeProtectionEnabled,
    conduitMounting: c.conduitMounting === 'SURFACE' ? 'SURFACE' : 'CHASED',
    spareDbWaysPct: Number.isFinite(c.spareDbWaysPct) ? Math.min(1, Math.max(0, Number(c.spareDbWaysPct))) : d.spareDbWaysPct,
    installBufferPct: Number.isFinite(c.installBufferPct) ? Math.min(1, Math.max(0, Number(c.installBufferPct))) : d.installBufferPct,
    clientName: typeof c.clientName === 'string' ? c.clientName.slice(0, 80) : d.clientName,
    siteName: typeof c.siteName === 'string' ? c.siteName.slice(0, 120) : d.siteName,
    notes: typeof c.notes === 'string' ? c.notes.slice(0, 600) : d.notes,
  };
}

function num(v: unknown, fallback = 0): number {
  return Number.isFinite(v as number) ? Number(v) : fallback;
}
function str(v: unknown, fallback: string, maxLen = 80): string {
  return typeof v === 'string' && v.trim() ? v.slice(0, maxLen) : fallback;
}

// The client passes back the catalog it rendered with (fetched server-side on
// page load), so PDF/lead/assistant numbers match what's on screen. Returns
// undefined when absent/malformed so callers fall back to the default catalog.
export function sanitizeWiringCatalog(input: unknown): WiringCatalog | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const c = input as Partial<Record<keyof WiringCatalog, unknown>>;

  const cables: CatalogCable[] = Array.isArray(c.cables)
    ? c.cables.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const cb = raw as Partial<CatalogCable>;
        return {
          id: str(cb.id, `cable-${i}`, 40), brand: str(cb.brand, 'Cable'), model: str(cb.model, 'Cable'),
          csaMm2: num(cb.csaMm2, 1.5), maxCurrentA: num(cb.maxCurrentA, 17.5),
          spoolLengthM: num(cb.spoolLengthM, 100), priceUsdPerSpool: num(cb.priceUsdPerSpool),
        };
      })
    : [];

  const conduits: CatalogConduit[] = Array.isArray(c.conduits)
    ? c.conduits.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const cd = raw as Partial<CatalogConduit>;
        return {
          id: str(cd.id, `conduit-${i}`, 40), brand: str(cd.brand, 'Conduit'), model: str(cd.model, 'Conduit'),
          diameterMm: num(cd.diameterMm, 20), lengthM: num(cd.lengthM, 3), priceUsdPerLength: num(cd.priceUsdPerLength),
        };
      })
    : [];

  const boards: CatalogDistributionBoard[] = Array.isArray(c.boards)
    ? c.boards.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const b = raw as Partial<CatalogDistributionBoard>;
        return { id: str(b.id, `board-${i}`, 40), brand: str(b.brand, 'Board'), model: str(b.model, 'Board'), ways: num(b.ways, 4), priceUsd: num(b.priceUsd) };
      })
    : [];

  const breakers: CatalogBreaker[] = Array.isArray(c.breakers)
    ? c.breakers.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const bk = raw as Partial<CatalogBreaker>;
        return {
          id: str(bk.id, `breaker-${i}`, 40), brand: str(bk.brand, 'Breaker'), model: str(bk.model, 'Breaker'),
          type: (['MCB', 'RCD', 'ISOLATOR'] as string[]).includes(bk.type ?? '') ? (bk.type as CatalogBreaker['type']) : 'MCB',
          ampRating: num(bk.ampRating, 10), priceUsd: num(bk.priceUsd),
        };
      })
    : [];

  const accessories: CatalogWiringAccessory[] = Array.isArray(c.accessories)
    ? c.accessories.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const a = raw as Partial<CatalogWiringAccessory>;
        return {
          id: str(a.id, `accessory-${i}`, 40),
          category: (['SWITCH', 'SOCKET_OUTLET', 'LIGHT_FITTING', 'JUNCTION_BOX', 'OTHER'] as string[]).includes(a.category ?? '') ? (a.category as CatalogWiringAccessory['category']) : 'OTHER',
          brand: str(a.brand, 'Accessory'), model: str(a.model, 'Accessory'), spec: str(a.spec, ''),
          priceUsd: num(a.priceUsd),
        };
      })
    : [];

  if (!cables.length || !conduits.length || !boards.length || !breakers.length) return undefined;
  return { cables, conduits, boards, breakers, accessories };
}
