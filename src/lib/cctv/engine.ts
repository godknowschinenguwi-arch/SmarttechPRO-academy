import { CAMERAS, NVRS, HDDS, CABLES, POE_SWITCHES, ACCESSORIES } from './catalog';
import type {
  CameraPoint,
  CctvConfig,
  CctvDesignResult,
  CctvWarning,
  BomLine,
  CatalogCamera,
  CatalogNvr,
  CatalogAccessory,
  AccessoryCategory,
  CctvCatalog,
  SystemType,
} from './types';
import { ANY_BRAND } from './types';

export const DEFAULT_CCTV_CATALOG: CctvCatalog = { cameras: CAMERAS, nvrs: NVRS, hdds: HDDS, cables: CABLES, poeSwitches: POE_SWITCHES, accessories: ACCESSORIES };

// Rough Mbps-per-megapixel at 30fps baseline, scaled by actual frame rate — indicative only.
const BITRATE_FACTOR: Record<CctvConfig['compression'], number> = { H264: 2.5, H265: 1.3 };
const STORAGE_SAFETY_MARGIN = 1.15;
const CABLE_SLACK_PCT = 0.1; // routing/service loop allowance
const PWM_SAFETY = 1.1; // PoE budget headroom
const CONNECTOR_UNIT_PRICE = 3.5; // RJ45/BNC + power connector per camera run
const BALANCE_OF_SYSTEM_PCT = 0.1; // mounts, junction boxes, cable clips, labels

const ACCESSORY_CATEGORY_LABEL: Record<AccessoryCategory, string> = {
  CABINET: 'Network cabinet',
  MONITOR: 'Monitor',
  HDMI_CABLE: 'HDMI cable',
  HDMI_SPLITTER: 'HDMI splitter',
  OTHER: 'Accessory',
};

function bomLine(label: string, detail: string, qty: number, unitPriceUsd: number): BomLine {
  return { label, detail, qty, unitPriceUsd, totalUsd: Math.round(qty * unitPriceUsd * 100) / 100 };
}

interface Pick<T> {
  item: T;
  brandFallback: boolean;
  systemFallback: boolean;
}

// Narrows a pool to the chosen system type first (never mixes IP with analog
// gear), then to the chosen brand if one was locked in — falling back a step
// at a time (and flagging it) only when the strict pool would be empty.
function narrowPool<T extends { systemType: SystemType; brand: string }>(fullPool: T[], systemType: SystemType, brand: string): { pool: T[]; brandFallback: boolean; systemFallback: boolean } {
  let systemFallback = false;
  let pool = fullPool.filter((x) => x.systemType === systemType);
  if (!pool.length) {
    pool = fullPool;
    systemFallback = true;
  }

  let brandFallback = false;
  if (brand !== ANY_BRAND) {
    const brandPool = pool.filter((x) => x.brand === brand);
    if (brandPool.length) pool = brandPool;
    else brandFallback = true;
  }

  return { pool, brandFallback, systemFallback };
}

function pickCamera(catalog: CctvCatalog, point: CameraPoint, systemType: SystemType, brand: string): Pick<CatalogCamera> {
  const fullPool = catalog.cameras.length ? catalog.cameras : CAMERAS;
  const { pool, brandFallback, systemFallback } = narrowPool(fullPool, systemType, brand);

  const candidates = pool.filter((c) => c.environment === point.environment && c.resolutionMp >= point.resolutionMp && (!point.lowLight || c.lowLight));
  const sorted = candidates
    .slice()
    .sort((a, b) => (a.type === point.type ? 0 : 1) - (b.type === point.type ? 0 : 1) || a.resolutionMp - b.resolutionMp || a.priceUsd - b.priceUsd);
  if (sorted.length) return { item: sorted[0], brandFallback, systemFallback };

  const envPool = pool.filter((c) => c.environment === point.environment);
  const fallback = (envPool.length ? envPool : pool).slice().sort((a, b) => Math.abs(a.resolutionMp - point.resolutionMp) - Math.abs(b.resolutionMp - point.resolutionMp));
  return { item: fallback[0], brandFallback, systemFallback };
}

function pickNvr(catalog: CctvCatalog, cameraCount: number, systemType: SystemType, brand: string, totalPoeW: number): Pick<CatalogNvr> {
  const fullPool = catalog.nvrs.length ? catalog.nvrs : NVRS;
  const { pool, brandFallback, systemFallback } = narrowPool(fullPool, systemType, brand);

  const usePoe = systemType === 'IP';
  const eligible = pool.filter((n) => (usePoe ? n.poePorts > 0 : true));
  const base = eligible.length ? eligible : pool;
  const sorted = base.slice().sort((a, b) => a.channels - b.channels);
  const fit = sorted.find((n) => n.channels >= cameraCount && (!usePoe || n.poeBudgetW >= totalPoeW * PWM_SAFETY));
  return { item: fit ?? sorted[sorted.length - 1], brandFallback, systemFallback };
}

function cameraBitrateMbps(resolutionMp: number, frameRate: number, compression: CctvConfig['compression']): number {
  return resolutionMp * BITRATE_FACTOR[compression] * (frameRate / 30);
}

export function defaultCctvConfig(): CctvConfig {
  return {
    systemType: 'IP',
    brand: ANY_BRAND,
    frameRate: 15,
    compression: 'H265',
    recordingMode: 'CONTINUOUS',
    motionActivityPct: 25,
    retentionDays: 30,
    installBufferPct: 0.15,
    clientName: '',
    siteName: '',
    notes: '',
    accessories: [],
  };
}

export function defaultCameraPoints(): CameraPoint[] {
  return [
    { id: 'cam-1', name: 'Front entrance', type: 'DOME', environment: 'INDOOR', resolutionMp: 4, distanceFromNvrM: 15, lowLight: false },
    { id: 'cam-2', name: 'Perimeter — driveway', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 4, distanceFromNvrM: 40, lowLight: true },
  ];
}

export function computeCctvDesign(points: CameraPoint[], config: CctvConfig, catalog: CctvCatalog = DEFAULT_CCTV_CATALOG): CctvDesignResult {
  const warnings: CctvWarning[] = [];
  const cameraCount = points.length;
  const usePoe = config.systemType === 'IP';

  const cameraCounts = new Map<string, { camera: CatalogCamera; qty: number }>();
  let totalBitrateMbps = 0;
  let dailyStorageGb = 0;
  let totalPoeW = 0;
  let cameraBrandFallback = false;
  let cameraSystemFallback = false;

  for (const point of points) {
    const picked = pickCamera(catalog, point, config.systemType, config.brand);
    const camera = picked.item;
    cameraBrandFallback = cameraBrandFallback || picked.brandFallback;
    cameraSystemFallback = cameraSystemFallback || picked.systemFallback;
    const entry = cameraCounts.get(camera.id);
    if (entry) entry.qty += 1;
    else cameraCounts.set(camera.id, { camera, qty: 1 });

    const bitrate = cameraBitrateMbps(point.resolutionMp, config.frameRate, config.compression);
    totalBitrateMbps += bitrate;
    const activityFactor = config.recordingMode === 'MOTION' ? config.motionActivityPct / 100 : 1;
    dailyStorageGb += ((bitrate / 8) * 86400 / 1000) * activityFactor;
    totalPoeW += camera.poeWatts;

    if (point.distanceFromNvrM > 90 && usePoe) {
      warnings.push({
        level: 'warn',
        message: `"${point.name}" is ${point.distanceFromNvrM}m from the NVR — beyond the ~90m safe margin for PoE over Cat6 (100m spec limit). Add a PoE extender/media converter or relocate a switch closer to this camera.`,
      });
    }
  }

  if (cameraSystemFallback) {
    warnings.push({ level: 'warn', message: `No ${config.systemType === 'IP' ? 'IP' : 'analog'} cameras found in the catalog — substituted the closest available model. Ask an admin to add ${config.systemType.toLowerCase()} camera SKUs.` });
  } else if (cameraBrandFallback) {
    warnings.push({ level: 'warn', message: `No ${config.brand} camera matches one or more camera points — substituted the closest match from another brand to avoid leaving a gap. Add more ${config.brand} SKUs to the catalog, or choose "Any brand".` });
  }

  const cameraLines = Array.from(cameraCounts.values());
  const totalStorageTb = (dailyStorageGb * config.retentionDays * STORAGE_SAFETY_MARGIN) / 1000;

  const pickedNvr = pickNvr(catalog, cameraCount, config.systemType, config.brand, totalPoeW);
  const nvr = pickedNvr.item;
  if (pickedNvr.systemFallback) {
    warnings.push({ level: 'warn', message: `No ${config.systemType === 'IP' ? 'IP NVR' : 'analog DVR'} found in the catalog — substituted the closest available model.` });
  } else if (pickedNvr.brandFallback) {
    warnings.push({ level: 'warn', message: `No ${config.brand} ${config.systemType === 'IP' ? 'NVR' : 'DVR'} in the catalog — substituted another brand so the system stays complete. Add a ${config.brand} model to keep the whole system single-brand.` });
  }
  if (nvr.channels < cameraCount) {
    warnings.push({ level: 'critical', message: `No single NVR in the catalog covers ${cameraCount} channels — use multiple NVRs or a larger model.` });
  }

  const hddPool = catalog.hdds.length ? catalog.hdds : HDDS;
  const largestHdd = hddPool.slice().sort((a, b) => b.capacityTb - a.capacityTb)[0];
  const hddCount = Math.max(1, Math.ceil(totalStorageTb / largestHdd.capacityTb));
  if (hddCount > nvr.maxHddBays) {
    warnings.push({
      level: 'warn',
      message: `${hddCount} HDD(s) needed for ${config.retentionDays} days' retention exceeds the ${nvr.model}'s ${nvr.maxHddBays} bay(s) — use higher-capacity drives, shorten retention, or add external storage.`,
    });
  }

  let poeSwitch = null as CctvDesignResult['poeSwitch'];
  if (usePoe && (nvr.poePorts < cameraCount || nvr.poeBudgetW < totalPoeW * PWM_SAFETY)) {
    const pool = catalog.poeSwitches.length ? catalog.poeSwitches : POE_SWITCHES;
    const fit = pool.slice().sort((a, b) => a.ports - b.ports).find((s) => s.ports >= cameraCount && s.poeBudgetW >= totalPoeW * PWM_SAFETY);
    poeSwitch = fit ?? pool.slice().sort((a, b) => b.ports - a.ports)[0];
  }

  const cablePool = catalog.cables.length ? catalog.cables : CABLES;
  const cable = cablePool.find((c) => c.type === (usePoe ? 'CAT6' : 'COAX_POWER')) ?? cablePool[0];
  const totalCableLengthM = points.reduce((s, p) => s + Math.max(0, p.distanceFromNvrM), 0) * (1 + CABLE_SLACK_PCT);
  const cableSpoolsNeeded = cable.spoolLengthM > 0 ? Math.ceil(totalCableLengthM / cable.spoolLengthM) : 0;

  const bom: BomLine[] = [];
  for (const { camera, qty } of cameraLines) {
    bom.push(bomLine(`${camera.brand} ${camera.model}`, `${camera.type.charAt(0)}${camera.type.slice(1).toLowerCase()} · ${camera.environment.toLowerCase()}`, qty, camera.priceUsd));
  }
  bom.push(bomLine(`${nvr.brand} ${nvr.model}`, `${nvr.channels}-channel NVR/DVR`, 1, nvr.priceUsd));
  bom.push(bomLine(`${largestHdd.brand} ${largestHdd.model}`, `${config.retentionDays}-day retention storage`, hddCount, largestHdd.priceUsd));
  bom.push(bomLine(`${cable.brand} ${cable.model}`, `${cable.spoolLengthM}m spool`, cableSpoolsNeeded, cable.priceUsdPerSpool));
  bom.push(bomLine('Connectors & terminations', `${usePoe ? 'RJ45 + weatherproof boot' : 'BNC + power'} per camera run`, cameraCount, CONNECTOR_UNIT_PRICE));
  if (poeSwitch) {
    bom.push(bomLine(`${poeSwitch.brand} ${poeSwitch.model}`, `${poeSwitch.ports}-port PoE switch`, 1, poeSwitch.priceUsd));
  }

  const accessoryPool = catalog.accessories.length ? catalog.accessories : ACCESSORIES;
  const accessoryById = new Map<string, CatalogAccessory>(accessoryPool.map((a) => [a.id, a]));
  for (const sel of config.accessories) {
    if (sel.qty <= 0) continue;
    const acc = accessoryById.get(sel.id);
    if (!acc) continue;
    bom.push(bomLine(`${acc.brand} ${acc.model}`, `${ACCESSORY_CATEGORY_LABEL[acc.category]} · ${acc.spec}`, sel.qty, acc.priceUsd));
  }

  const equipmentSubtotal = bom.reduce((s, l) => s + l.totalUsd, 0);
  const bosUsd = Math.round(equipmentSubtotal * BALANCE_OF_SYSTEM_PCT * 100) / 100;
  bom.push(bomLine('Balance of system', 'Mounts, junction boxes, cable clips, labelling (est.)', 1, bosUsd));

  const equipmentTotalUsd = bom.reduce((s, l) => s + l.totalUsd, 0);
  const installBufferUsd = Math.round(equipmentTotalUsd * config.installBufferPct * 100) / 100;
  const totalUsd = equipmentTotalUsd + installBufferUsd;

  if (cameraCount === 0) {
    warnings.push({ level: 'critical', message: 'Add at least one camera point to size a system.' });
  }
  if (config.recordingMode === 'CONTINUOUS' && config.retentionDays > 60) {
    warnings.push({ level: 'info', message: 'Continuous recording with long retention drives storage cost fast — consider motion-triggered recording or H.265 to cut storage needs.' });
  }

  return {
    cameraCount,
    cameraLines,

    totalBitrateMbps,
    dailyStorageGb,
    totalStorageTb,

    nvr,
    hdd: largestHdd,
    hddCount,

    totalPoeW,
    poeSwitch,

    cable,
    totalCableLengthM,
    cableSpoolsNeeded,

    bom,
    equipmentTotalUsd,
    installBufferUsd,
    totalUsd,

    warnings,
  };
}

export { CAMERAS, NVRS, HDDS, CABLES, POE_SWITCHES, ACCESSORIES };
