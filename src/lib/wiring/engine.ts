import { CABLES, CONDUITS, BOARDS, BREAKERS, ACCESSORIES } from './catalog';
import type {
  WiringCircuit,
  WiringConfig,
  WiringCatalog,
  WiringDesignResult,
  WiringWarning,
  BomLine,
  CatalogCable,
  CatalogBreaker,
  CircuitDesignLine,
} from './types';

export const DEFAULT_WIRING_CATALOG: WiringCatalog = { cables: CABLES, conduits: CONDUITS, boards: BOARDS, breakers: BREAKERS, accessories: ACCESSORIES };

const MAINS_VOLTAGE = 230; // single-phase residential
const CURRENT_SAFETY_MARGIN = 1.25; // headroom for dedicated-circuit breaker sizing
const CABLE_WASTAGE_PCT = 0.1; // routing slack, terminations
const POINT_SPACING_M = 3; // assumed average run between successive points on the same circuit
const JUNCTION_BOX_PER_POINTS = 6;
const SADDLE_COVERAGE_M = 15; // one pack of saddles per ~15m of surface conduit
const BALANCE_OF_SYSTEM_PCT = 0.08; // conduit bends/tees, glue, tape, cable ties, labels

const LIGHTING_DESIGN_CURRENT_A = 10;
const SOCKET_DESIGN_CURRENT_A = 20;

function bomLine(label: string, detail: string, qty: number, unitPriceUsd: number): BomLine {
  return { label, detail, qty, unitPriceUsd, totalUsd: Math.round(qty * unitPriceUsd * 100) / 100 };
}

function findAccessory(catalog: WiringCatalog, id: string) {
  const pool = catalog.accessories.length ? catalog.accessories : ACCESSORIES;
  return pool.find((a) => a.id === id) ?? pool[0];
}

// Route length for a circuit: the DB-to-first-point run, plus an assumed
// spacing allowance for looping through any additional points on the same
// circuit. Used for both cable and conduit quantity — they share the route.
function circuitRouteLengthM(circuit: WiringCircuit): number {
  const loopAllowance = circuit.type === 'DEDICATED' ? 0 : Math.max(0, circuit.points - 1) * POINT_SPACING_M;
  return Math.max(0, circuit.cableRunM) + loopAllowance;
}

function pickCableForCircuit(catalog: WiringCatalog, circuit: WiringCircuit): { cable: CatalogCable; requiredCurrentA: number } {
  const pool = catalog.cables.length ? catalog.cables : CABLES;
  const requiredCurrentA =
    circuit.type === 'DEDICATED'
      ? Math.max(1, (circuit.dedicatedLoadW / MAINS_VOLTAGE) * CURRENT_SAFETY_MARGIN)
      : circuit.type === 'SOCKET'
        ? SOCKET_DESIGN_CURRENT_A
        : LIGHTING_DESIGN_CURRENT_A;

  const sorted = pool.slice().sort((a, b) => a.csaMm2 - b.csaMm2);
  const fit = sorted.find((c) => c.maxCurrentA >= requiredCurrentA);
  return { cable: fit ?? sorted[sorted.length - 1], requiredCurrentA };
}

function pickBreakerForCircuit(catalog: WiringCatalog, requiredCurrentA: number): CatalogBreaker {
  const pool = (catalog.breakers.length ? catalog.breakers : BREAKERS).filter((b) => b.type === 'MCB');
  const sorted = pool.slice().sort((a, b) => a.ampRating - b.ampRating);
  const fit = sorted.find((b) => b.ampRating >= requiredCurrentA);
  return fit ?? sorted[sorted.length - 1];
}

export function defaultWiringConfig(): WiringConfig {
  return {
    earthLeakageEnabled: true,
    surgeProtectionEnabled: false,
    conduitMounting: 'CHASED',
    spareDbWaysPct: 0.2,
    installBufferPct: 0.15,
    clientName: '',
    siteName: '',
    notes: '',
  };
}

export function defaultWiringCircuits(): WiringCircuit[] {
  return [
    { id: 'ckt-1', name: 'Lounge & passage lights', type: 'LIGHTING', points: 6, dedicatedLoadW: 0, cableRunM: 12 },
    { id: 'ckt-2', name: 'Bedroom lights', type: 'LIGHTING', points: 5, dedicatedLoadW: 0, cableRunM: 15 },
    { id: 'ckt-3', name: 'Kitchen sockets', type: 'SOCKET', points: 6, dedicatedLoadW: 0, cableRunM: 10 },
    { id: 'ckt-4', name: 'Lounge & bedroom sockets', type: 'SOCKET', points: 8, dedicatedLoadW: 0, cableRunM: 14 },
    { id: 'ckt-5', name: 'Stove', type: 'DEDICATED', points: 1, dedicatedLoadW: 4000, cableRunM: 6 },
    { id: 'ckt-6', name: 'Geyser', type: 'DEDICATED', points: 1, dedicatedLoadW: 3000, cableRunM: 8 },
  ];
}

export function computeWiringDesign(circuits: WiringCircuit[], config: WiringConfig, catalog: WiringCatalog = DEFAULT_WIRING_CATALOG): WiringDesignResult {
  const warnings: WiringWarning[] = [];
  const circuitCount = circuits.length;

  const largestCableCsa = Math.max(...(catalog.cables.length ? catalog.cables : CABLES).map((c) => c.csaMm2));

  const circuitLines: CircuitDesignLine[] = circuits.map((circuit) => {
    const { cable, requiredCurrentA } = pickCableForCircuit(catalog, circuit);
    const breaker = pickBreakerForCircuit(catalog, requiredCurrentA);
    const cableLengthM = circuitRouteLengthM(circuit) * (1 + CABLE_WASTAGE_PCT);

    if (circuit.type === 'DEDICATED' && cable.csaMm2 >= largestCableCsa && requiredCurrentA > cable.maxCurrentA) {
      warnings.push({
        level: 'critical',
        message: `"${circuit.name}" needs ${requiredCurrentA.toFixed(1)}A, beyond the largest cataloged cable (${cable.model}, ${cable.maxCurrentA}A) — verify with a qualified electrician; may need a heavier cable, a dedicated sub-board, or splitting the load.`,
      });
    }

    return { circuit, cable, breaker, cableLengthM, requiredCurrentA };
  });

  const baseWays = circuitCount;
  const spareWays = Math.ceil(baseWays * Math.max(0, config.spareDbWaysPct));
  const totalDbWays = baseWays + spareWays;

  const boardPool = catalog.boards.length ? catalog.boards : BOARDS;
  const board = boardPool.slice().sort((a, b) => a.ways - b.ways).find((b) => b.ways >= totalDbWays) ?? boardPool.slice().sort((a, b) => b.ways - a.ways)[0];
  if (board.ways < totalDbWays) {
    warnings.push({
      level: 'warn',
      message: `${totalDbWays} DB ways needed (incl. ${spareWays} spare) exceeds the largest cataloged board's ${board.ways} ways — use multiple boards or a larger enclosure.`,
    });
  }

  const totalCableLengthM = circuitLines.reduce((s, l) => s + l.cableLengthM, 0);
  const cableGroups = new Map<string, { cable: CatalogCable; lengthM: number }>();
  for (const line of circuitLines) {
    const entry = cableGroups.get(line.cable.id);
    if (entry) entry.lengthM += line.cableLengthM;
    else cableGroups.set(line.cable.id, { cable: line.cable, lengthM: line.cableLengthM });
  }
  const cableSpoolsBySize = Array.from(cableGroups.values())
    .sort((a, b) => a.cable.csaMm2 - b.cable.csaMm2)
    .map(({ cable, lengthM }) => ({ cable, lengthM, spoolsNeeded: cable.spoolLengthM > 0 ? Math.ceil(lengthM / cable.spoolLengthM) : 0 }));

  const totalConduitLengthM = circuits.reduce((s, c) => s + circuitRouteLengthM(c), 0) * (1 + CABLE_WASTAGE_PCT);
  const conduitPool = catalog.conduits.length ? catalog.conduits : CONDUITS;
  const conduit = conduitPool.slice().sort((a, b) => a.diameterMm - b.diameterMm)[0];
  const conduitSticksNeeded = conduit.lengthM > 0 ? Math.ceil(totalConduitLengthM / conduit.lengthM) : 0;

  const lightingCircuits = circuits.filter((c) => c.type === 'LIGHTING');
  const socketCircuits = circuits.filter((c) => c.type === 'SOCKET');
  const switchCount = lightingCircuits.reduce((s, c) => s + Math.max(0, c.points), 0);
  const lightFittingCount = switchCount;
  const socketOutletCount = socketCircuits.reduce((s, c) => s + Math.max(0, c.points), 0);
  const junctionBoxCount = Math.max(1, Math.ceil((switchCount + socketOutletCount) / JUNCTION_BOX_PER_POINTS));

  const earthLeakage = config.earthLeakageEnabled
    ? (catalog.breakers.length ? catalog.breakers : BREAKERS).find((b) => b.type === 'RCD') ?? null
    : null;
  const mainIsolator = (catalog.breakers.length ? catalog.breakers : BREAKERS).find((b) => b.type === 'ISOLATOR') ?? null;

  const bom: BomLine[] = [];
  for (const { cable, lengthM, spoolsNeeded } of cableSpoolsBySize) {
    bom.push(bomLine(`${cable.brand} ${cable.model}`, `${lengthM.toFixed(0)}m required, ${cable.spoolLengthM}m spool`, spoolsNeeded, cable.priceUsdPerSpool));
  }
  bom.push(bomLine(`${conduit.brand} ${conduit.model}`, `${config.conduitMounting === 'SURFACE' ? 'Surface-mounted' : 'Chased into wall'}, ${conduit.lengthM}m lengths`, conduitSticksNeeded, conduit.priceUsdPerLength));
  bom.push(bomLine(`${board.brand} ${board.model}`, `${totalDbWays} ways needed (incl. ${spareWays} spare)`, 1, board.priceUsd));

  const breakerGroups = new Map<string, { breaker: CatalogBreaker; qty: number }>();
  for (const line of circuitLines) {
    const entry = breakerGroups.get(line.breaker.id);
    if (entry) entry.qty += 1;
    else breakerGroups.set(line.breaker.id, { breaker: line.breaker, qty: 1 });
  }
  for (const { breaker, qty } of Array.from(breakerGroups.values())) {
    bom.push(bomLine(`${breaker.brand} ${breaker.model}`, 'Circuit breaker', qty, breaker.priceUsd));
  }

  if (earthLeakage) bom.push(bomLine(`${earthLeakage.brand} ${earthLeakage.model}`, 'Main incomer earth leakage protection', 1, earthLeakage.priceUsd));
  if (mainIsolator) bom.push(bomLine(`${mainIsolator.brand} ${mainIsolator.model}`, 'Main isolator / disconnect switch', 1, mainIsolator.priceUsd));
  if (config.surgeProtectionEnabled) {
    const spd = findAccessory(catalog, 'spd-type2');
    bom.push(bomLine(`${spd.brand} ${spd.model}`, spd.spec, 1, spd.priceUsd));
  }

  if (switchCount > 0) {
    const sw = findAccessory(catalog, 'sw-1lever');
    bom.push(bomLine(`${sw.brand} ${sw.model}`, sw.spec, switchCount, sw.priceUsd));
  }
  if (lightFittingCount > 0) {
    const fitting = findAccessory(catalog, 'light-batten');
    bom.push(bomLine(`${fitting.brand} ${fitting.model}`, fitting.spec, lightFittingCount, fitting.priceUsd));
  }
  if (socketOutletCount > 0) {
    const sock = findAccessory(catalog, 'sock-double');
    bom.push(bomLine(`${sock.brand} ${sock.model}`, sock.spec, socketOutletCount, sock.priceUsd));
  }
  if (junctionBoxCount > 0) {
    const jbox = findAccessory(catalog, 'jbox-std');
    bom.push(bomLine(`${jbox.brand} ${jbox.model}`, jbox.spec, junctionBoxCount, jbox.priceUsd));
  }
  if (config.conduitMounting === 'SURFACE') {
    const saddles = findAccessory(catalog, 'saddle-pack');
    const packsNeeded = Math.max(1, Math.ceil(totalConduitLengthM / SADDLE_COVERAGE_M));
    bom.push(bomLine(`${saddles.brand} ${saddles.model}`, saddles.spec, packsNeeded, saddles.priceUsd));
  }

  const equipmentSubtotal = bom.reduce((s, l) => s + l.totalUsd, 0);
  const bosUsd = Math.round(equipmentSubtotal * BALANCE_OF_SYSTEM_PCT * 100) / 100;
  bom.push(bomLine('Balance of system', 'Conduit bends/tees, glue, tape, cable ties, labelling (est.)', 1, bosUsd));

  const equipmentTotalUsd = bom.reduce((s, l) => s + l.totalUsd, 0);
  const installBufferUsd = Math.round(equipmentTotalUsd * config.installBufferPct * 100) / 100;
  const totalUsd = equipmentTotalUsd + installBufferUsd;

  if (circuitCount === 0) {
    warnings.push({ level: 'critical', message: 'Add at least one circuit to size a system.' });
  }

  return {
    circuitCount,
    circuitLines,

    totalDbWays,
    board,

    totalCableLengthM,
    cableSpoolsBySize,

    totalConduitLengthM,
    conduit,
    conduitSticksNeeded,

    switchCount,
    socketOutletCount,
    lightFittingCount,
    junctionBoxCount,

    earthLeakage,
    mainIsolator,

    bom,
    equipmentTotalUsd,
    installBufferUsd,
    totalUsd,

    warnings,
  };
}

export { CABLES, CONDUITS, BOARDS, BREAKERS, ACCESSORIES };
