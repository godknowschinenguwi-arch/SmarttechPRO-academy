// Shared request-payload sanitizers for the electric fence API routes — the
// client sends back its full zones/config state, so every field is treated
// as untrusted input.
import { defaultFenceConfig } from './engine';
import type { FenceZone, FenceConfig, FenceCatalog, CatalogEnergizer, CatalogWire, CatalogPost, CatalogMonitor, CatalogBackupBattery, CatalogFenceAccessory, SelectedAccessory } from './types';

const MAX_ZONES = 100;
const MAX_CATALOG_ITEMS = 100;
const MAX_ACCESSORY_SELECTIONS = 100;

export function sanitizeZones(input: unknown): FenceZone[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, MAX_ZONES).map((raw, i) => {
    const z = raw as Partial<FenceZone>;
    return {
      id: typeof z.id === 'string' ? z.id : `zone-${i}`,
      name: typeof z.name === 'string' ? z.name.slice(0, 60) : `Zone ${i + 1}`,
      lengthM: Number.isFinite(z.lengthM) ? Math.max(0, Number(z.lengthM)) : 0,
      corners: Number.isFinite(z.corners) ? Math.max(0, Number(z.corners)) : 0,
    };
  });
}

function sanitizeSelectedAccessories(input: unknown): SelectedAccessory[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, MAX_ACCESSORY_SELECTIONS).reduce<SelectedAccessory[]>((acc, raw) => {
    const s = raw as Partial<SelectedAccessory>;
    if (typeof s.id !== 'string' || !s.id) return acc;
    const qty = Number.isFinite(s.qty) ? Math.min(999, Math.max(0, Math.round(Number(s.qty)))) : 0;
    if (qty > 0) acc.push({ id: s.id.slice(0, 40), qty });
    return acc;
  }, []);
}

export function sanitizeFenceConfig(input: unknown): FenceConfig {
  const d = defaultFenceConfig();
  if (!input || typeof input !== 'object') return d;
  const c = input as Partial<FenceConfig>;
  return {
    strandCount: Number.isFinite(c.strandCount) ? Math.min(20, Math.max(1, Number(c.strandCount))) : d.strandCount,
    wireType: c.wireType === 'HT_WIRE' || c.wireType === 'BRAIDED_WIRE' ? c.wireType : d.wireType,
    postSpacingM: Number.isFinite(c.postSpacingM) ? Math.min(10, Math.max(0.5, Number(c.postSpacingM))) : d.postSpacingM,
    postMaterial: ['STEEL', 'TIMBER', 'CONCRETE'].includes(c.postMaterial as string) ? (c.postMaterial as FenceConfig['postMaterial']) : d.postMaterial,
    postShape: ['STANDARD', 'SQUARE_STRAIGHT', 'SQUARE_BEND'].includes(c.postShape as string) ? (c.postShape as FenceConfig['postShape']) : d.postShape,
    cornerStaysPerCorner: Number.isFinite(c.cornerStaysPerCorner) ? Math.min(4, Math.max(0, Number(c.cornerStaysPerCorner))) : d.cornerStaysPerCorner,
    gateCount: Number.isFinite(c.gateCount) ? Math.max(0, Number(c.gateCount)) : d.gateCount,
    powerSource: ['MAINS', 'MAINS_WITH_BACKUP', 'SOLAR'].includes(c.powerSource as string) ? (c.powerSource as FenceConfig['powerSource']) : d.powerSource,
    backupHours: Number.isFinite(c.backupHours) ? Math.min(72, Math.max(0, Number(c.backupHours))) : d.backupHours,
    monitoringEnabled: !!c.monitoringEnabled,
    gsmAlertEnabled: !!c.gsmAlertEnabled,
    installBufferPct: Number.isFinite(c.installBufferPct) ? Math.min(1, Math.max(0, Number(c.installBufferPct))) : d.installBufferPct,
    clientName: typeof c.clientName === 'string' ? c.clientName.slice(0, 80) : d.clientName,
    siteName: typeof c.siteName === 'string' ? c.siteName.slice(0, 120) : d.siteName,
    notes: typeof c.notes === 'string' ? c.notes.slice(0, 600) : d.notes,
    accessories: sanitizeSelectedAccessories(c.accessories),
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
export function sanitizeFenceCatalog(input: unknown): FenceCatalog | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const c = input as Partial<Record<keyof FenceCatalog, unknown>>;

  const energizers: CatalogEnergizer[] = Array.isArray(c.energizers)
    ? c.energizers.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const e = raw as Partial<CatalogEnergizer>;
        const voltageOptions = Array.isArray(e.voltageOptions)
          ? e.voltageOptions.filter((v): v is CatalogEnergizer['voltageOptions'][number] => v === 12 || v === 24)
          : [];
        return {
          id: str(e.id, `energizer-${i}`, 40), brand: str(e.brand, 'Energizer'), model: str(e.model, 'Energizer'),
          joulesOutput: num(e.joulesOutput, 1), maxFenceKm: num(e.maxFenceKm, 1), currentDrawA: num(e.currentDrawA, 0.1),
          voltageOptions: voltageOptions.length ? voltageOptions : [12],
          bundledBatteryAh: num(e.bundledBatteryAh, 0), bundledSiren: !!e.bundledSiren,
          priceUsd: num(e.priceUsd),
        };
      })
    : [];

  const wires: CatalogWire[] = Array.isArray(c.wires)
    ? c.wires.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const w = raw as Partial<CatalogWire>;
        return {
          id: str(w.id, `wire-${i}`, 40), brand: str(w.brand, 'Wire'), model: str(w.model, 'Wire'),
          type: w.type === 'BRAIDED_WIRE' ? 'BRAIDED_WIRE' : 'HT_WIRE',
          ohmsPerKm: num(w.ohmsPerKm), spoolLengthM: num(w.spoolLengthM, 1), priceUsdPerSpool: num(w.priceUsdPerSpool),
        };
      })
    : [];

  const posts: CatalogPost[] = Array.isArray(c.posts)
    ? c.posts.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const p = raw as Partial<CatalogPost>;
        return {
          id: str(p.id, `post-${i}`, 40), brand: str(p.brand, 'Post'), model: str(p.model, 'Post'),
          material: (['STEEL', 'TIMBER', 'CONCRETE'] as string[]).includes(p.material ?? '') ? (p.material as CatalogPost['material']) : 'STEEL',
          shape: (['STANDARD', 'SQUARE_STRAIGHT', 'SQUARE_BEND'] as string[]).includes(p.shape ?? '') ? (p.shape as CatalogPost['shape']) : 'STANDARD',
          heightM: num(p.heightM, 1.8), insulatorsIncluded: !!p.insulatorsIncluded, priceUsd: num(p.priceUsd),
        };
      })
    : [];

  const monitors: CatalogMonitor[] = Array.isArray(c.monitors)
    ? c.monitors.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const m = raw as Partial<CatalogMonitor>;
        return {
          id: str(m.id, `monitor-${i}`, 40), brand: str(m.brand, 'Monitor'), model: str(m.model, 'Monitor'),
          maxZones: num(m.maxZones, 4), gsmCapable: !!m.gsmCapable, priceUsd: num(m.priceUsd),
        };
      })
    : [];

  const batteries: CatalogBackupBattery[] = Array.isArray(c.batteries)
    ? c.batteries.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const b = raw as Partial<CatalogBackupBattery>;
        const voltage = b.voltage === 24 ? 24 : 12;
        return {
          id: str(b.id, `battery-${i}`, 40), brand: str(b.brand, 'Battery'), model: str(b.model, 'Battery'),
          voltage, ah: num(b.ah, 1), priceUsd: num(b.priceUsd),
        };
      })
    : [];

  const accessories: CatalogFenceAccessory[] = Array.isArray(c.accessories)
    ? c.accessories.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const a = raw as Partial<CatalogFenceAccessory>;
        return {
          id: str(a.id, `accessory-${i}`, 40),
          category: (['COMPRESSION_SPRING', 'HOOK', 'COPPER_FERRULE', 'FENCE_LIGHT', 'LIGHTNING_DIVERTER', 'OTHER'] as string[]).includes(a.category ?? '') ? (a.category as CatalogFenceAccessory['category']) : 'OTHER',
          brand: str(a.brand, 'Accessory'), model: str(a.model, 'Accessory'), spec: str(a.spec, ''),
          priceUsd: num(a.priceUsd),
        };
      })
    : [];

  if (!energizers.length || !wires.length || !posts.length) return undefined;
  return { energizers, wires, posts, monitors, batteries, accessories };
}
