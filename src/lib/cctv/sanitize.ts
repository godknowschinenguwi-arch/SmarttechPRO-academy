// Shared request-payload sanitizers for the CCTV API routes — the client
// sends back its full points/config state, so every field is treated as
// untrusted input.
import { defaultCctvConfig } from './engine';
import { ANY_BRAND } from './types';
import type { CameraPoint, CctvConfig, CctvCatalog, CatalogCamera, CatalogNvr, CatalogHdd, CatalogCable, CatalogPoeSwitch, CatalogAccessory, SelectedAccessory } from './types';

const MAX_POINTS = 200;
const MAX_CATALOG_ITEMS = 100;
const MAX_ACCESSORY_SELECTIONS = 100;

export function sanitizeCameraPoints(input: unknown): CameraPoint[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, MAX_POINTS).map((raw, i) => {
    const p = raw as Partial<CameraPoint>;
    return {
      id: typeof p.id === 'string' ? p.id : `cam-${i}`,
      name: typeof p.name === 'string' ? p.name.slice(0, 60) : `Camera ${i + 1}`,
      type: ['DOME', 'BULLET', 'TURRET', 'PTZ'].includes(p.type as string) ? (p.type as CameraPoint['type']) : 'DOME',
      environment: p.environment === 'OUTDOOR' ? 'OUTDOOR' : 'INDOOR',
      resolutionMp: Number.isFinite(p.resolutionMp) ? Math.min(32, Math.max(1, Number(p.resolutionMp))) : 4,
      distanceFromNvrM: Number.isFinite(p.distanceFromNvrM) ? Math.max(0, Number(p.distanceFromNvrM)) : 0,
      lowLight: !!p.lowLight,
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

export function sanitizeCctvConfig(input: unknown): CctvConfig {
  const d = defaultCctvConfig();
  if (!input || typeof input !== 'object') return d;
  const c = input as Partial<CctvConfig>;
  return {
    systemType: c.systemType === 'ANALOG' ? 'ANALOG' : 'IP',
    brand: typeof c.brand === 'string' && c.brand.trim() ? c.brand.trim().slice(0, 60) : ANY_BRAND,
    frameRate: Number.isFinite(c.frameRate) ? Math.min(60, Math.max(1, Number(c.frameRate))) : d.frameRate,
    compression: c.compression === 'H264' || c.compression === 'H265' ? c.compression : d.compression,
    recordingMode: c.recordingMode === 'CONTINUOUS' || c.recordingMode === 'MOTION' ? c.recordingMode : d.recordingMode,
    motionActivityPct: Number.isFinite(c.motionActivityPct) ? Math.min(100, Math.max(1, Number(c.motionActivityPct))) : d.motionActivityPct,
    retentionDays: Number.isFinite(c.retentionDays) ? Math.min(365, Math.max(1, Number(c.retentionDays))) : d.retentionDays,
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
export function sanitizeCctvCatalog(input: unknown): CctvCatalog | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const c = input as Partial<Record<keyof CctvCatalog, unknown>>;

  const cameras: CatalogCamera[] = Array.isArray(c.cameras)
    ? c.cameras.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const cam = raw as Partial<CatalogCamera>;
        return {
          id: str(cam.id, `camera-${i}`, 40), brand: str(cam.brand, 'Camera'), model: str(cam.model, 'Camera'),
          systemType: cam.systemType === 'ANALOG' ? 'ANALOG' : 'IP',
          type: (['DOME', 'BULLET', 'TURRET', 'PTZ'] as string[]).includes(cam.type ?? '') ? (cam.type as CatalogCamera['type']) : 'DOME',
          environment: cam.environment === 'OUTDOOR' ? 'OUTDOOR' : 'INDOOR',
          resolutionMp: num(cam.resolutionMp, 4), lowLight: !!cam.lowLight, poeWatts: num(cam.poeWatts),
          priceUsd: num(cam.priceUsd),
        };
      })
    : [];

  const nvrs: CatalogNvr[] = Array.isArray(c.nvrs)
    ? c.nvrs.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const n = raw as Partial<CatalogNvr>;
        return {
          id: str(n.id, `nvr-${i}`, 40), brand: str(n.brand, 'NVR'), model: str(n.model, 'NVR'),
          systemType: n.systemType === 'ANALOG' ? 'ANALOG' : 'IP',
          channels: num(n.channels, 4), poePorts: num(n.poePorts), poeBudgetW: num(n.poeBudgetW),
          maxHddBays: num(n.maxHddBays, 1), priceUsd: num(n.priceUsd),
        };
      })
    : [];

  const hdds: CatalogHdd[] = Array.isArray(c.hdds)
    ? c.hdds.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const h = raw as Partial<CatalogHdd>;
        return { id: str(h.id, `hdd-${i}`, 40), brand: str(h.brand, 'HDD'), model: str(h.model, 'HDD'), capacityTb: num(h.capacityTb, 1), priceUsd: num(h.priceUsd) };
      })
    : [];

  const cables: CatalogCable[] = Array.isArray(c.cables)
    ? c.cables.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const cb = raw as Partial<CatalogCable>;
        return {
          id: str(cb.id, `cable-${i}`, 40), brand: str(cb.brand, 'Cable'), model: str(cb.model, 'Cable'),
          type: cb.type === 'COAX_POWER' ? 'COAX_POWER' : 'CAT6', spoolLengthM: num(cb.spoolLengthM, 1), priceUsdPerSpool: num(cb.priceUsdPerSpool),
        };
      })
    : [];

  const poeSwitches: CatalogPoeSwitch[] = Array.isArray(c.poeSwitches)
    ? c.poeSwitches.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const s = raw as Partial<CatalogPoeSwitch>;
        return { id: str(s.id, `poeswitch-${i}`, 40), brand: str(s.brand, 'Switch'), model: str(s.model, 'Switch'), ports: num(s.ports, 8), poeBudgetW: num(s.poeBudgetW), priceUsd: num(s.priceUsd) };
      })
    : [];

  const accessories: CatalogAccessory[] = Array.isArray(c.accessories)
    ? c.accessories.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const a = raw as Partial<CatalogAccessory>;
        return {
          id: str(a.id, `accessory-${i}`, 40),
          category: (['CABINET', 'MONITOR', 'HDMI_CABLE', 'HDMI_SPLITTER', 'OTHER'] as string[]).includes(a.category ?? '') ? (a.category as CatalogAccessory['category']) : 'OTHER',
          brand: str(a.brand, 'Accessory'), model: str(a.model, 'Accessory'), spec: str(a.spec, ''),
          priceUsd: num(a.priceUsd),
        };
      })
    : [];

  if (!cameras.length || !nvrs.length || !hdds.length || !cables.length) return undefined;
  return { cameras, nvrs, hdds, cables, poeSwitches, accessories };
}
