// Shared request-payload sanitizers for the CCTV API routes — the client
// sends back its full points/config state, so every field is treated as
// untrusted input.
import { defaultCctvConfig } from './engine';
import type { CameraPoint, CctvConfig, CctvCatalog, CatalogCamera, CatalogNvr, CatalogHdd, CatalogCable, CatalogPoeSwitch } from './types';

const MAX_POINTS = 200;
const MAX_CATALOG_ITEMS = 100;

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

export function sanitizeCctvConfig(input: unknown): CctvConfig {
  const d = defaultCctvConfig();
  if (!input || typeof input !== 'object') return d;
  const c = input as Partial<CctvConfig>;
  return {
    frameRate: Number.isFinite(c.frameRate) ? Math.min(60, Math.max(1, Number(c.frameRate))) : d.frameRate,
    compression: c.compression === 'H264' || c.compression === 'H265' ? c.compression : d.compression,
    recordingMode: c.recordingMode === 'CONTINUOUS' || c.recordingMode === 'MOTION' ? c.recordingMode : d.recordingMode,
    motionActivityPct: Number.isFinite(c.motionActivityPct) ? Math.min(100, Math.max(1, Number(c.motionActivityPct))) : d.motionActivityPct,
    retentionDays: Number.isFinite(c.retentionDays) ? Math.min(365, Math.max(1, Number(c.retentionDays))) : d.retentionDays,
    usePoe: c.usePoe === undefined ? d.usePoe : !!c.usePoe,
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
export function sanitizeCctvCatalog(input: unknown): CctvCatalog | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const c = input as Partial<Record<keyof CctvCatalog, unknown>>;

  const cameras: CatalogCamera[] = Array.isArray(c.cameras)
    ? c.cameras.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const cam = raw as Partial<CatalogCamera>;
        return {
          id: str(cam.id, `camera-${i}`, 40), brand: str(cam.brand, 'Camera'), model: str(cam.model, 'Camera'),
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

  if (!cameras.length || !nvrs.length || !hdds.length || !cables.length) return undefined;
  return { cameras, nvrs, hdds, cables, poeSwitches };
}
