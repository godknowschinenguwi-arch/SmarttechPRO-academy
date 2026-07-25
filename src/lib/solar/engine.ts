import { PANELS, BATTERIES, INVERTERS, CONTROLLERS } from './catalog';
import type {
  LoadItem,
  SiteConfig,
  DesignResult,
  DesignWarning,
  BomLine,
  CatalogPanel,
  CatalogBattery,
  CatalogInverter,
  CatalogController,
} from './types';

const BALANCE_OF_SYSTEM_PCT = 0.12; // mounting, DC/AC cabling, breakers, combiner box, earthing
const ARRAY_SAFETY_FACTOR = 1.25; // NEC-style safety factor for charge current sizing
const INVERTER_SAFETY_FACTOR = 1.25;

// Simplified conductor ampacity table (amps -> mm² copper, PVC insulated, indicative).
// For guidance only — final cable selection must follow local wiring regulations,
// run length / voltage-drop and a qualified installer's judgement.
const CABLE_AMPACITY: Array<[number, number]> = [
  [15, 1.5], [20, 2.5], [27, 4], [34, 6], [46, 10], [63, 16], [85, 25], [104, 35], [125, 50], [148, 70], [180, 95],
];

function cableForCurrent(amps: number): number {
  const target = amps * 1.25;
  const match = CABLE_AMPACITY.find(([maxAmps]) => maxAmps >= target);
  return match ? match[1] : CABLE_AMPACITY[CABLE_AMPACITY.length - 1][1];
}

export interface EngineOptions {
  panelId?: string;
  batteryId?: string;
  inverterId?: string;
  controllerId?: string;
}

function pickPanel(id?: string): CatalogPanel {
  return PANELS.find((p) => p.id === id) ?? PANELS[1];
}
function pickBattery(chemistry: SiteConfig['batteryChemistry'], id?: string): CatalogBattery {
  if (id) {
    const found = BATTERIES.find((b) => b.id === id);
    if (found) return found;
  }
  return BATTERIES.find((b) => b.chemistry === chemistry) ?? BATTERIES[0];
}
function inverterFamily(type: SiteConfig['systemType']): CatalogInverter['type'] {
  if (type === 'GRID_TIED') return 'GRID_TIE';
  return type;
}
function pickInverter(systemType: SiteConfig['systemType'], continuousW: number, surgeW: number, id?: string): { inverter: CatalogInverter; count: number } {
  const family = inverterFamily(systemType);
  const pool = INVERTERS.filter((i) => i.type === family);
  if (id) {
    const found = pool.find((i) => i.id === id);
    if (found) return { inverter: found, count: Math.max(1, Math.ceil(Math.max(continuousW, 1) / found.continuousW)) };
  }
  const fit = pool
    .slice()
    .sort((a, b) => a.continuousW - b.continuousW)
    .find((i) => i.continuousW >= continuousW && i.surgeW >= surgeW);
  if (fit) return { inverter: fit, count: 1 };
  const largest = pool.slice().sort((a, b) => b.continuousW - a.continuousW)[0];
  return { inverter: largest, count: Math.max(1, Math.ceil(continuousW / largest.continuousW)) };
}
function pickController(chargeCurrentA: number, id?: string): { controller: CatalogController; count: number } {
  if (id) {
    const found = CONTROLLERS.find((c) => c.id === id);
    if (found) return { controller: found, count: Math.max(1, Math.ceil(chargeCurrentA / found.maxAmps)) };
  }
  const fit = CONTROLLERS.slice().sort((a, b) => a.maxAmps - b.maxAmps).find((c) => c.maxAmps >= chargeCurrentA);
  if (fit) return { controller: fit, count: 1 };
  const largest = CONTROLLERS.slice().sort((a, b) => b.maxAmps - a.maxAmps)[0];
  return { controller: largest, count: Math.max(1, Math.ceil(chargeCurrentA / largest.maxAmps)) };
}

function bomLine(label: string, detail: string, qty: number, unitPriceUsd: number): BomLine {
  return { label, detail, qty, unitPriceUsd, totalUsd: Math.round(qty * unitPriceUsd) };
}

export function computeSystemDesign(loads: LoadItem[], site: SiteConfig, opts: EngineOptions = {}): DesignResult {
  const warnings: DesignWarning[] = [];

  const dailyEnergyWh = loads.reduce((sum, l) => sum + l.watts * l.qty * l.hours, 0);
  const essentialDailyEnergyWh = loads.filter((l) => l.essential).reduce((sum, l) => sum + l.watts * l.qty * l.hours, 0);
  const peakLoadW = loads.reduce((sum, l) => sum + l.watts * l.qty, 0);

  // Surge model: everything running steady-state, plus the single largest motor load starting.
  let surgeLoadW = peakLoadW;
  if (loads.length > 0) {
    const biggestSurge = loads.reduce((best, l) => {
      const extra = l.watts * l.qty * (l.surgeFactor - 1);
      return extra > best.extra ? { extra, running: l.watts * l.qty } : best;
    }, { extra: 0, running: 0 });
    surgeLoadW = peakLoadW + biggestSurge.extra;
  }

  const isGridTied = site.systemType === 'GRID_TIED';
  const batteryRoundTripEff = isGridTied ? 1 : pickBattery(site.batteryChemistry, opts.batteryId).roundTripEff;
  const systemEfficiency = site.inverterEfficiencyPct * (1 - site.wiringLossPct) * batteryRoundTripEff;
  const dailyEnergyAdjustedWh = systemEfficiency > 0 ? dailyEnergyWh / systemEfficiency : dailyEnergyWh;

  // --- Array sizing ---
  const derating = Math.max(0.1, site.panelDeratingPct);
  const arrayWpNeeded = site.psh > 0 ? dailyEnergyAdjustedWh / (site.psh * derating) : dailyEnergyAdjustedWh;
  const panel = pickPanel(opts.panelId);
  const panelCount = Math.max(1, Math.ceil(arrayWpNeeded / panel.wattage));
  const arrayWpActual = panelCount * panel.wattage;

  // --- Battery sizing ---
  const battery = pickBattery(site.batteryChemistry, opts.batteryId);
  let batteryBankWh = 0;
  let batteryBankAh = 0;
  let batterySeriesCount = 0;
  let batteryParallelCount = 0;
  let batteryTotalCount = 0;
  let batteryUsableKwh = 0;

  if (!isGridTied) {
    const backupTargetWh = site.systemType === 'HYBRID' && essentialDailyEnergyWh > 0 ? essentialDailyEnergyWh : dailyEnergyWh;
    batteryBankWh = (backupTargetWh * site.autonomyDays) / battery.maxDodPct / battery.roundTripEff;
    batteryBankAh = batteryBankWh / site.systemVoltage;

    batterySeriesCount = Math.max(1, Math.round(site.systemVoltage / battery.voltage));
    if (batterySeriesCount * battery.voltage !== site.systemVoltage) {
      warnings.push({
        level: 'warn',
        message: `${battery.model} (${battery.voltage}V) does not divide evenly into a ${site.systemVoltage}V bank — choose a battery whose voltage is a clean multiple, or adjust system voltage.`,
      });
    }
    batteryParallelCount = Math.max(1, Math.ceil(batteryBankAh / battery.ah));
    batteryTotalCount = batterySeriesCount * batteryParallelCount;
    batteryUsableKwh = (batteryTotalCount * battery.voltage * battery.ah * battery.maxDodPct) / 1000;

    if (batteryParallelCount > 4) {
      warnings.push({ level: 'info', message: `${batteryParallelCount} parallel battery strings — consider a higher-capacity battery model or higher system voltage to simplify wiring.` });
    }
  }

  // --- Inverter sizing ---
  const { inverter, count: inverterCount } = pickInverter(
    site.systemType,
    peakLoadW * INVERTER_SAFETY_FACTOR,
    surgeLoadW,
    opts.inverterId
  );
  if (inverter.continuousW * inverterCount < peakLoadW) {
    warnings.push({ level: 'critical', message: 'Selected inverter capacity is below the calculated peak load even after paralleling available units — choose a larger model.' });
  }

  // --- Charge controller sizing (skipped when the inverter has built-in MPPT, e.g. hybrid/grid-tie) ---
  const chargeCurrentA = (arrayWpActual * ARRAY_SAFETY_FACTOR) / site.systemVoltage;
  let controller: CatalogController | null = null;
  let controllerCount = 0;
  if (!isGridTied && !inverter.mpptBuiltIn) {
    const picked = pickController(chargeCurrentA, opts.controllerId);
    controller = picked.controller;
    controllerCount = picked.count;
    if (controller.maxAmps * controllerCount < chargeCurrentA) {
      warnings.push({ level: 'warn', message: 'Array current exceeds the largest single charge controller — multiple controllers/strings required.' });
    }
  }

  // --- Cable sizing (indicative) ---
  const dcCableSizeMm2 = cableForCurrent(isGridTied ? panel.isc * panelCount : chargeCurrentA);
  const acCurrentA = (inverter.continuousW * inverterCount) / (site.systemVoltage >= 48 ? 230 : 230);
  const acCableSizeMm2 = cableForCurrent(acCurrentA);

  // --- BOM & cost ---
  const bom: BomLine[] = [];
  bom.push(bomLine(`${panel.brand} ${panel.model}`, 'Solar PV panel', panelCount, panel.priceUsd));
  if (!isGridTied) {
    bom.push(bomLine(`${battery.brand} ${battery.model}`, `Battery bank (${batterySeriesCount}S${batteryParallelCount}P)`, batteryTotalCount, battery.priceUsd));
  }
  bom.push(bomLine(`${inverter.brand} ${inverter.model}`, `${inverter.type.replace('_', '-')} inverter`, inverterCount, inverter.priceUsd));
  if (controller) {
    bom.push(bomLine(`${controller.brand} ${controller.model}`, `${controller.type} charge controller`, controllerCount, controller.priceUsd));
  }
  const equipmentSubtotal = bom.reduce((s, l) => s + l.totalUsd, 0);
  const bosUsd = Math.round(equipmentSubtotal * BALANCE_OF_SYSTEM_PCT);
  bom.push(bomLine('Balance of system', 'Mounting, DC/AC cabling, breakers, combiner box, earthing (est.)', 1, bosUsd));

  const equipmentTotalUsd = bom.reduce((s, l) => s + l.totalUsd, 0);
  const installBufferUsd = Math.round(equipmentTotalUsd * site.installBufferPct);
  const totalUsd = equipmentTotalUsd + installBufferUsd;

  // --- Financials ---
  const estMonthlyProductionKwh = (arrayWpActual / 1000) * site.psh * derating * 30;
  const monthlyConsumptionKwh = (dailyEnergyWh / 1000) * 30;
  const offsetKwh = Math.min(estMonthlyProductionKwh, monthlyConsumptionKwh);
  const estMonthlySavingsUsd = offsetKwh * site.tariffUsdPerKwh;
  const paybackYears = estMonthlySavingsUsd > 0 ? totalUsd / (estMonthlySavingsUsd * 12) : null;

  if (arrayWpActual < arrayWpNeeded * 0.98) {
    warnings.push({ level: 'warn', message: 'Array is slightly undersized for the calculated demand — add another panel for margin.' });
  }
  if (site.systemType !== 'GRID_TIED' && batteryTotalCount === 0) {
    warnings.push({ level: 'info', message: 'No battery in this design — loads will only run while the sun is up unless grid-backed.' });
  }

  return {
    dailyEnergyWh,
    dailyEnergyAdjustedWh,
    peakLoadW,
    surgeLoadW,
    essentialDailyEnergyWh,

    arrayWpNeeded,
    panel,
    panelCount,
    arrayWpActual,

    batteryBankWh,
    batteryBankAh,
    battery,
    batterySeriesCount,
    batteryParallelCount,
    batteryTotalCount,
    batteryUsableKwh,

    inverter,
    inverterCount,

    controller,
    controllerCount,
    chargeCurrentA,

    dcCableSizeMm2,
    acCableSizeMm2,

    bom,
    equipmentTotalUsd,
    installBufferUsd,
    totalUsd,

    estMonthlyProductionKwh,
    estMonthlySavingsUsd,
    paybackYears,

    warnings,
  };
}

export function defaultSiteConfig(): SiteConfig {
  return {
    locationId: 'harare',
    psh: 5.3,
    systemType: 'HYBRID',
    autonomyDays: 1,
    batteryChemistry: 'LFP',
    systemVoltage: 48,
    panelDeratingPct: 0.8,
    inverterEfficiencyPct: 0.93,
    wiringLossPct: 0.03,
    installBufferPct: 0.15,
    monthlyGridBillUsd: 120,
    tariffUsdPerKwh: 0.15,
    clientName: '',
    siteName: '',
    notes: '',
  };
}

// Re-exported so components can source the raw catalogs from one module.
export { PANELS, BATTERIES, INVERTERS, CONTROLLERS };
