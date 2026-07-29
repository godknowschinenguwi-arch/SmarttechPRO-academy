import { ENERGIZERS, WIRES, POSTS, MONITORS, BATTERIES, FENCE_ACCESSORIES } from './catalog';
import type {
  FenceZone,
  FenceConfig,
  FenceDesignResult,
  FenceWarning,
  BomLine,
  CatalogEnergizer,
  CatalogWire,
  CatalogPost,
  CatalogFenceAccessory,
  FenceAccessoryCategory,
  FenceCatalog,
} from './types';

export const DEFAULT_FENCE_CATALOG: FenceCatalog = { energizers: ENERGIZERS, wires: WIRES, posts: POSTS, monitors: MONITORS, batteries: BATTERIES, accessories: FENCE_ACCESSORIES };

const WIRE_WASTAGE_PCT = 0.05; // tension takeup, corner wraps, joins
const BRAIDED_RANGE_DERATE = 1.6; // higher resistance than HT wire shortens an energizer's effective rated range
const SAFETY_MARGIN = 1.15; // vegetation growth, corrosion, imperfect insulation over the fence's life
const INSULATOR_UNIT_PRICE = 0.35;
const EARTH_STAKE_UNIT_PRICE = 4.5;
const CORNER_STAY_UNIT_PRICE = 3.2;
const GATE_BREAKER_UNIT_PRICE = 28;
const BALANCE_OF_SYSTEM_PCT = 0.1; // strainers, joiners, warning signs, cable ties, connectors
const BACKUP_BATTERY_DOD = 0.5; // sealed lead-acid, conservative

const FENCE_ACCESSORY_CATEGORY_LABEL: Record<FenceAccessoryCategory, string> = {
  COMPRESSION_SPRING: 'Compression spring',
  HOOK: 'Hook',
  COPPER_FERRULE: 'Copper ferrule',
  FENCE_LIGHT: 'Fence light',
  LIGHTNING_DIVERTER: 'Lightning diverter',
  OTHER: 'Accessory',
};

function bomLine(label: string, detail: string, qty: number, unitPriceUsd: number): BomLine {
  return { label, detail, qty, unitPriceUsd, totalUsd: Math.round(qty * unitPriceUsd * 100) / 100 };
}

function pickEnergizer(catalog: FenceCatalog, effectiveFenceKm: number): CatalogEnergizer {
  const pool = catalog.energizers.length ? catalog.energizers : ENERGIZERS;
  const fit = pool.slice().sort((a, b) => a.maxFenceKm - b.maxFenceKm).find((e) => e.maxFenceKm >= effectiveFenceKm);
  return fit ?? pool.slice().sort((a, b) => b.maxFenceKm - a.maxFenceKm)[0];
}

function pickWire(catalog: FenceCatalog, type: FenceConfig['wireType']): CatalogWire {
  const pool = catalog.wires.length ? catalog.wires : WIRES;
  return pool.find((w) => w.type === type) ?? pool[0];
}

// Prefers an exact material+shape match (e.g. square-tube bend posts for
// corners); falls back to any post of the chosen material, then to the pool,
// so an incomplete catalog never crashes the calculator.
function pickPost(catalog: FenceCatalog, material: FenceConfig['postMaterial'], shape: FenceConfig['postShape']): CatalogPost {
  const pool = catalog.posts.length ? catalog.posts : POSTS;
  const exact = pool.find((p) => p.material === material && p.shape === shape);
  if (exact) return exact;
  return pool.find((p) => p.material === material) ?? pool[0];
}

export function defaultFenceConfig(): FenceConfig {
  return {
    strandCount: 8,
    wireType: 'HT_WIRE',
    postSpacingM: 3,
    postMaterial: 'STEEL',
    postShape: 'STANDARD',
    cornerStaysPerCorner: 2,
    gateCount: 1,
    powerSource: 'MAINS_WITH_BACKUP',
    backupHours: 8,
    monitoringEnabled: true,
    gsmAlertEnabled: false,
    installBufferPct: 0.15,
    clientName: '',
    siteName: '',
    notes: '',
    accessories: [],
  };
}

export function defaultFenceZones(): FenceZone[] {
  return [{ id: 'zone-1', name: 'Perimeter', lengthM: 200, corners: 4 }];
}

export function computeFenceDesign(zones: FenceZone[], config: FenceConfig, catalog: FenceCatalog = DEFAULT_FENCE_CATALOG): FenceDesignResult {
  const warnings: FenceWarning[] = [];

  const totalPerimeterM = zones.reduce((s, z) => s + Math.max(0, z.lengthM), 0);
  const totalCorners = zones.reduce((s, z) => s + Math.max(0, z.corners), 0) + zones.length;
  const strandCount = Math.max(1, config.strandCount);

  const totalWireLengthM = totalPerimeterM * strandCount * (1 + WIRE_WASTAGE_PCT);

  const wire = pickWire(catalog, config.wireType);
  const wireSpoolsNeeded = wire.spoolLengthM > 0 ? Math.ceil(totalWireLengthM / wire.spoolLengthM) : 0;

  const rangeDerate = config.wireType === 'BRAIDED_WIRE' ? BRAIDED_RANGE_DERATE : 1;
  const effectiveFenceKm = ((totalPerimeterM * strandCount) / 1000) * rangeDerate * SAFETY_MARGIN;

  const energizer = pickEnergizer(catalog, effectiveFenceKm);
  const energizerCount = energizer.maxFenceKm > 0 ? Math.max(1, Math.ceil(effectiveFenceKm / energizer.maxFenceKm)) : 1;
  if (energizerCount > 1) {
    warnings.push({
      level: 'warn',
      message: `Effective fence length (${effectiveFenceKm.toFixed(1)}km) exceeds a single ${energizer.model}'s rated range — split into ${energizerCount} independently energized sections, or upgrade to a higher-joule energizer.`,
    });
  }

  const post = pickPost(catalog, config.postMaterial, config.postShape);
  const postCount = Math.max(1, Math.ceil(totalPerimeterM / Math.max(0.5, config.postSpacingM))) + totalCorners;
  const insulatorCount = post.insulatorsIncluded ? 0 : postCount * strandCount;
  const earthStakeCount = Math.max(3, Math.ceil((energizer.joulesOutput * energizerCount) / 3));
  const cornerStayCount = totalCorners * Math.max(0, config.cornerStaysPerCorner);

  // Every energizer ships with its own bundled backup battery — only size
  // additional batteries for the backup hours that bundle can't cover.
  let battery = null as FenceDesignResult['battery'];
  let batteryCount = 0;
  if (config.powerSource !== 'MAINS') {
    const requiredAh = (energizer.currentDrawA * energizerCount * config.backupHours) / BACKUP_BATTERY_DOD;
    const coveredAh = energizer.bundledBatteryAh * energizerCount;
    const additionalAh = Math.max(0, requiredAh - coveredAh);
    if (additionalAh > 0) {
      const pool = catalog.batteries.length ? catalog.batteries : BATTERIES;
      const fit = pool.slice().sort((a, b) => a.ah - b.ah).find((b) => b.ah >= additionalAh) ?? pool.slice().sort((a, b) => b.ah - a.ah)[0];
      battery = fit;
      batteryCount = fit.ah > 0 ? Math.max(1, Math.ceil(additionalAh / fit.ah)) : 1;
    }
  }

  const monitor = config.monitoringEnabled
    ? (() => {
        const pool = catalog.monitors.length ? catalog.monitors : MONITORS;
        const eligible = config.gsmAlertEnabled ? pool.filter((m) => m.gsmCapable) : pool;
        const fit = (eligible.length ? eligible : pool).slice().sort((a, b) => a.maxZones - b.maxZones).find((m) => m.maxZones >= zones.length);
        return fit ?? (eligible.length ? eligible : pool).slice().sort((a, b) => b.maxZones - a.maxZones)[0];
      })()
    : null;

  const bundledParts = [energizer.bundledBatteryAh > 0 ? `${energizer.bundledBatteryAh}Ah battery` : '', energizer.bundledSiren ? 'siren' : ''].filter(Boolean);
  const energizerDetail = bundledParts.length ? `Fence energizer (incl. ${bundledParts.join(' + ')})` : 'Fence energizer';
  const postDetail = `${post.material.toLowerCase()} post, ${config.postSpacingM}m spacing${post.insulatorsIncluded ? ' — bobbin insulators pre-fitted' : ''}`;

  const bom: BomLine[] = [];
  bom.push(bomLine(`${energizer.brand} ${energizer.model}`, energizerDetail, energizerCount, energizer.priceUsd));
  bom.push(bomLine(`${wire.brand} ${wire.model}`, `${wire.spoolLengthM}m spool`, wireSpoolsNeeded, wire.priceUsdPerSpool));
  bom.push(bomLine(`${post.brand} ${post.model}`, postDetail, postCount, post.priceUsd));
  if (insulatorCount > 0) {
    bom.push(bomLine('Line insulators', `${strandCount} strands × ${postCount} posts`, insulatorCount, INSULATOR_UNIT_PRICE));
  }
  bom.push(bomLine('Earth stakes', 'Galvanised earth rod + clamp', earthStakeCount, EARTH_STAKE_UNIT_PRICE));
  if (cornerStayCount > 0) {
    bom.push(bomLine('Corner stays', `${config.cornerStaysPerCorner} per corner × ${totalCorners} corners`, cornerStayCount, CORNER_STAY_UNIT_PRICE));
  }
  if (config.gateCount > 0) {
    bom.push(bomLine('Gate breaker kit', 'Spring-loaded gate handle + insulated hook', config.gateCount, GATE_BREAKER_UNIT_PRICE));
  }
  if (battery && batteryCount > 0) {
    bom.push(bomLine(`${battery.brand} ${battery.model}`, `Additional backup battery beyond the energizer's bundled ${energizer.bundledBatteryAh}Ah (${config.backupHours}h autonomy)`, batteryCount, battery.priceUsd));
  }
  if (monitor) {
    bom.push(bomLine(`${monitor.brand} ${monitor.model}`, `${zones.length}-zone monitoring${config.gsmAlertEnabled ? ' + GSM alert' : ''}`, 1, monitor.priceUsd));
  }

  const accessoryPool = catalog.accessories.length ? catalog.accessories : FENCE_ACCESSORIES;
  const accessoryById = new Map<string, CatalogFenceAccessory>(accessoryPool.map((a) => [a.id, a]));
  for (const sel of config.accessories) {
    if (sel.qty <= 0) continue;
    const acc = accessoryById.get(sel.id);
    if (!acc) continue;
    bom.push(bomLine(`${acc.brand} ${acc.model}`, `${FENCE_ACCESSORY_CATEGORY_LABEL[acc.category]} · ${acc.spec}`, sel.qty, acc.priceUsd));
  }

  const equipmentSubtotal = bom.reduce((s, l) => s + l.totalUsd, 0);
  const bosUsd = Math.round(equipmentSubtotal * BALANCE_OF_SYSTEM_PCT * 100) / 100;
  bom.push(bomLine('Balance of system', 'Strainers, joiners, warning signs, cable ties, connectors (est.)', 1, bosUsd));

  const equipmentTotalUsd = bom.reduce((s, l) => s + l.totalUsd, 0);
  const installBufferUsd = Math.round(equipmentTotalUsd * config.installBufferPct * 100) / 100;
  const totalUsd = equipmentTotalUsd + installBufferUsd;

  if (totalPerimeterM === 0) {
    warnings.push({ level: 'critical', message: 'Add at least one zone with a perimeter length to size a system.' });
  }
  if (config.wireType === 'BRAIDED_WIRE' && strandCount > 4) {
    warnings.push({ level: 'info', message: 'Braided conductive rope is typically used for fewer, more visible strands (2–4) rather than dense multi-strand security fencing — confirm this matches the intended fence style.' });
  }
  if (config.postSpacingM > 4) {
    warnings.push({ level: 'warn', message: 'Post spacing over 4m risks excessive wire sag between posts — 2.5–3.5m is typical for security fencing.' });
  }

  return {
    totalPerimeterM,
    totalCorners,
    totalWireLengthM,

    energizer,
    energizerCount,
    effectiveFenceKm,

    wire,
    wireSpoolsNeeded,

    post,
    postCount,
    cornerStayCount,
    insulatorCount,
    earthStakeCount,

    battery,
    batteryCount,

    monitor,

    bom,
    equipmentTotalUsd,
    installBufferUsd,
    totalUsd,

    warnings,
  };
}

export { ENERGIZERS, WIRES, POSTS, MONITORS, BATTERIES, FENCE_ACCESSORIES };
