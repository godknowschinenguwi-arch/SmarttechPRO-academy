import { PANELS, BATTERIES, INVERTERS, CONTROLLERS } from './catalog';
import { DESIGN_RULES_CONFIG, validateDesign } from './designRules';
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
  ExistingSystem,
  UpgradeResult,
  SolarCatalog,
  MountingMethod,
} from './types';

export const DEFAULT_CATALOG: SolarCatalog = { panels: PANELS, batteries: BATTERIES, inverters: INVERTERS, controllers: CONTROLLERS };

const BALANCE_OF_SYSTEM_PCT = 0.08; // mounting rails, generic DC/AC cabling, combiner box (mandatory safety items are now itemised separately)
const ARRAY_SAFETY_FACTOR = 1.25; // NEC-style safety factor for charge current sizing
const INVERTER_SAFETY_FACTOR = 1.25;

// Simplified conductor ampacity table (amps -> mm² copper, PVC insulated, indicative).
// For guidance only — final cable selection must follow local wiring regulations,
// run length / voltage-drop and a qualified installer's judgement.
const CABLE_AMPACITY: Array<[number, number]> = [
  [15, 1.5], [20, 2.5], [27, 4], [34, 6], [46, 10], [63, 16], [85, 25], [104, 35], [125, 50], [148, 70], [180, 95],
];

export function cableForCurrent(amps: number): number {
  const target = amps * 1.25;
  const match = CABLE_AMPACITY.find(([maxAmps]) => maxAmps >= target);
  return match ? match[1] : CABLE_AMPACITY[CABLE_AMPACITY.length - 1][1];
}

function performanceRatioFor(mounting: MountingMethod): number {
  const pr = DESIGN_RULES_CONFIG.pr;
  return mounting === 'FLUSH' ? pr.flush : mounting === 'GROUND' ? pr.ground : pr.standoff;
}

function cellRiseFor(mounting: MountingMethod): number {
  const t = DESIGN_RULES_CONFIG.temp;
  return mounting === 'FLUSH' ? t.cellRise_flush : mounting === 'GROUND' ? t.cellRise_ground : t.cellRise_standoff;
}

/** Temperature-corrected Voc (cold), Vmp (hot) and Isc (hot) for one panel — see Design Rules v1.0 §2. */
function tempCorrectedElectricals(panel: CatalogPanel, mounting: MountingMethod) {
  const cfg = DESIGN_RULES_CONFIG;
  const hotCellTempC = cfg.temp.designMaxAmb_C + cellRiseFor(mounting);
  const coldTempC = cfg.temp.designMin_C;

  const vocCold = panel.voc * (1 + (panel.tempCoeffVocPctPerC / 100) * (coldTempC - 25));
  const betaVmp = panel.tempCoeffPmaxPctPerC - panel.tempCoeffIscPctPerC; // gamma_Pmax - alpha_Isc, steeper than beta_Voc
  const vmpHot = panel.vmp * (1 + (betaVmp / 100) * (hotCellTempC - 25));
  const iscHot = panel.isc * (1 + (panel.tempCoeffIscPctPerC / 100) * (hotCellTempC - 25));

  return { vocCold, vmpHot, iscHot };
}

interface StringConfig {
  seriesCount: number;
  parallelStringsTotal: number;
  mpptsUsed: number;
  panelCount: number;
  arrayWpActual: number;
  vocColdV: number;
  vmpHotV: number;
  iscHotAPerMppt: number;
}

/**
 * Chooses a series/parallel string configuration for an MPPT-built-in inverter,
 * subject to the cold-Voc ceiling and hot-Vmp floor (Design Rules v1.0 §2).
 * Searches every series count in the safe voltage window and keeps the one
 * that reaches arrayWpNeeded with the least overshoot — a single long string
 * length gives fewer/lower-current parallel strings but coarser sizing
 * granularity, so the "best" length depends on how big the array actually
 * needs to be. This is the "fix the root cause" approach: it replaces a flat
 * panel count with a real string design instead of just flagging a bad one.
 */
function computeMpptStringConfig(panel: CatalogPanel, inverter: CatalogInverter, inverterCount: number, mounting: MountingMethod, arrayWpNeeded: number): StringConfig {
  const cfg = DESIGN_RULES_CONFIG;
  const { vocCold, vmpHot, iscHot } = tempCorrectedElectricals(panel, mounting);

  const vocCeilingSafe = inverter.maxDcInputVoltage * cfg.voltage.vocSafety;
  const vmpFloorSafe = inverter.mpptFullPowerVoltageMin * cfg.voltage.vmpSafety;
  const mpptCount = Math.max(1, inverter.mpptCount * Math.max(1, inverterCount));

  const nsMaxByVoc = Math.max(1, vocCold > 0 ? Math.floor(vocCeilingSafe / vocCold) : 1);
  const nsMinByVmp = Math.max(1, vmpHot > 0 ? Math.ceil(vmpFloorSafe / vmpHot) : 1);
  const feasible = nsMinByVmp <= nsMaxByVoc;

  function candidateFor(seriesCount: number): StringConfig {
    const stringWp = seriesCount * panel.wattage;
    const stringsNeeded = Math.max(mpptCount, Math.ceil(arrayWpNeeded / stringWp));
    const parallelPerMppt = Math.ceil(stringsNeeded / mpptCount);
    const parallelStringsTotal = parallelPerMppt * mpptCount;
    const panelCount = seriesCount * parallelStringsTotal;
    return {
      seriesCount,
      parallelStringsTotal,
      mpptsUsed: mpptCount,
      panelCount,
      arrayWpActual: panelCount * panel.wattage,
      vocColdV: seriesCount * vocCold,
      vmpHotV: seriesCount * vmpHot,
      iscHotAPerMppt: parallelPerMppt * iscHot,
    };
  }

  if (!feasible) {
    // No series count clears both the cold-Voc ceiling and the hot-Vmp floor —
    // pick the Vmp-floor-driven count so validateDesign reports the actual shortfall.
    return candidateFor(nsMinByVmp);
  }

  let best: StringConfig | null = null;
  for (let ns = nsMaxByVoc; ns >= nsMinByVmp; ns--) {
    const candidate = candidateFor(ns);
    if (!best || candidate.arrayWpActual < best.arrayWpActual) best = candidate;
  }
  return best!;
}

export interface EngineOptions {
  panelId?: string;
  batteryId?: string;
  inverterId?: string;
  controllerId?: string;
}

function pickPanel(catalog: SolarCatalog, id?: string): CatalogPanel {
  const pool = catalog.panels.length ? catalog.panels : PANELS;
  const byId = pool.find((p) => p.id === id);
  if (byId) return byId;
  const sorted = pool.slice().sort((a, b) => a.wattage - b.wattage);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Picks the panel model, preferring the default (median-wattage) choice, but
 * switching to a higher power-density (W/m²) panel from the catalog when the
 * default's footprint won't fit the declared roof area — feeding the roof
 * constraint back into sizing instead of only flagging ROOF-AREA after the
 * fact. Skipped when the caller pins a specific panelId.
 */
function pickPanelForRoof(catalog: SolarCatalog, site: SiteConfig, arrayWpNeeded: number, id?: string): CatalogPanel {
  const defaultPanel = pickPanel(catalog, id);
  if (id || !(site.roofAreaM2 > 0)) return defaultPanel;

  const spacing = DESIGN_RULES_CONFIG.roof.spacingFactor;
  const fits = (p: CatalogPanel) => {
    const estCount = Math.max(1, Math.ceil(arrayWpNeeded / p.wattage));
    return estCount * p.areaM2 * spacing <= site.roofAreaM2;
  };
  if (fits(defaultPanel)) return defaultPanel;

  const pool = catalog.panels.length ? catalog.panels : PANELS;
  const byDensity = pool.slice().sort((a, b) => b.wattage / b.areaM2 - a.wattage / a.areaM2);
  return byDensity.find(fits) ?? byDensity[0] ?? defaultPanel;
}

/**
 * Picks a battery model of the requested chemistry, preferring one whose
 * voltage fits the system bus with the fewest series units (ideally an exact
 * match) and, among equal fits, the highest capacity (fewest parallel units).
 * Without this, "pick the first model of this chemistry" can land on a small
 * 12V unit on a 48V bus, forcing 4x the series stack for no reason — which
 * then multiplies badly once parallel count is also scaled for current headroom.
 */
function pickBattery(catalog: SolarCatalog, chemistry: SiteConfig['batteryChemistry'], systemVoltage: number, id?: string): CatalogBattery {
  const pool = catalog.batteries.length ? catalog.batteries : BATTERIES;
  if (id) {
    const found = pool.find((b) => b.id === id);
    if (found) return found;
  }
  const matches = pool.filter((b) => b.chemistry === chemistry);
  if (!matches.length) return pool[0];

  const seriesFit = (b: CatalogBattery) => {
    const series = Math.max(1, Math.round(systemVoltage / b.voltage));
    return { series, exact: series * b.voltage === systemVoltage };
  };
  return matches.slice().sort((a, b) => {
    const fa = seriesFit(a);
    const fb = seriesFit(b);
    if (fa.exact !== fb.exact) return fa.exact ? -1 : 1;
    if (fa.series !== fb.series) return fa.series - fb.series;
    return b.ah - a.ah;
  })[0];
}
function inverterFamily(type: SiteConfig['systemType']): CatalogInverter['type'] {
  if (type === 'GRID_TIED') return 'GRID_TIE';
  return type;
}

interface InverterArrayChoice {
  inverter: CatalogInverter;
  count: number;
  panelCount: number;
  arrayWpActual: number;
  stringSeriesCount: number;
  stringParallelCount: number;
  mpptsUsed: number;
  stringVocColdV: number;
  stringVmpHotV: number;
  stringIscHotA: number;
  upsizedForDcAc: boolean;
}

/**
 * Chooses the inverter (and array/string configuration together) instead of
 * picking the inverter from peak load alone and sizing the array from energy
 * demand independently — the two used to never "talk", which is exactly what
 * let a 5.5kWp array get paired with a 12kW inverter (DC:AC 0.46). For each
 * inverter/parallel-count that clears the load requirement, this evaluates
 * the resulting design and scores it by fit: within the DC:AC hard band and
 * under the PV input cap scores best. When a load's peak power forces a
 * bigger inverter than the load's energy need alone would size an array for,
 * the array is grown to the DC:AC soft-band floor for that inverter (standard
 * installer practice — make full economic use of an inverter you're forced
 * into) rather than leaving it undersized.
 */
function chooseInverterAndArray(
  catalog: SolarCatalog,
  systemType: SiteConfig['systemType'],
  mounting: MountingMethod,
  panel: CatalogPanel,
  arrayWpNeeded: number,
  continuousWNeeded: number,
  surgeWNeeded: number,
  id?: string
): InverterArrayChoice {
  const cfg = DESIGN_RULES_CONFIG;
  const family = inverterFamily(systemType);
  const all = catalog.inverters.length ? catalog.inverters : INVERTERS;
  const pool = id ? all.filter((i) => i.id === id) : all.filter((i) => i.type === family);

  const candidates: { inverter: CatalogInverter; count: number }[] = [];
  for (const inv of pool) {
    for (let count = 1; count <= 3; count++) {
      if (inv.continuousW * count >= continuousWNeeded && inv.surgeW * count >= surgeWNeeded) {
        candidates.push({ inverter: inv, count });
        break;
      }
    }
  }
  if (!candidates.length) {
    const largest = pool.slice().sort((a, b) => b.continuousW - a.continuousW)[0] ?? all[0];
    if (largest) candidates.push({ inverter: largest, count: Math.max(1, Math.ceil(continuousWNeeded / largest.continuousW)) });
  }

  // Evaluate smallest-capacity candidates first: the smallest inverter that
  // meets the load (upsizing its array to the DC:AC soft floor if needed) is
  // preferred, since that floor-lift makes nearly any inverter "DC:AC-fit"-able
  // and would otherwise give no cost signal to prefer a cheaper unit. A
  // candidate is only skipped in favour of a bigger inverter when even the
  // floor-lifted array can't be reconciled — DC:AC over the hard max, or over
  // the inverter's absolute PV input cap.
  const evaluated = candidates
    .slice()
    .sort((a, b) => a.inverter.continuousW * a.count - b.inverter.continuousW * b.count)
    .map(({ inverter, count }) => {
      const dcAcFloorWp = inverter.mpptBuiltIn ? inverter.continuousW * count * cfg.dcac.softMin : 0;
      const targetWp = Math.max(arrayWpNeeded, dcAcFloorWp);
      const upsizedForDcAc = dcAcFloorWp > arrayWpNeeded * 1.02;

      let panelCount: number, arrayWpActual: number, stringSeriesCount: number, stringParallelCount: number,
        mpptsUsed: number, stringVocColdV: number, stringVmpHotV: number, stringIscHotA: number;

      if (inverter.mpptBuiltIn && inverter.maxDcInputVoltage > 0) {
        const sc = computeMpptStringConfig(panel, inverter, count, mounting, targetWp);
        panelCount = sc.panelCount;
        arrayWpActual = sc.arrayWpActual;
        stringSeriesCount = sc.seriesCount;
        stringParallelCount = sc.parallelStringsTotal;
        mpptsUsed = sc.mpptsUsed;
        stringVocColdV = sc.vocColdV;
        stringVmpHotV = sc.vmpHotV;
        stringIscHotA = sc.iscHotAPerMppt;
      } else {
        panelCount = Math.max(1, Math.ceil(targetWp / panel.wattage));
        arrayWpActual = panelCount * panel.wattage;
        stringSeriesCount = 1;
        stringParallelCount = panelCount;
        mpptsUsed = 1;
        const { vocCold, vmpHot, iscHot } = tempCorrectedElectricals(panel, mounting);
        stringVocColdV = vocCold;
        stringVmpHotV = vmpHot;
        stringIscHotA = iscHot;
      }

      const dcAcRatio = inverter.continuousW * count > 0 ? arrayWpActual / (inverter.continuousW * count) : 0;
      const overHardMax = inverter.mpptBuiltIn && dcAcRatio > cfg.dcac.hardMax;
      const overPvCap = inverter.maxPvInputW > 0 && arrayWpActual > inverter.maxPvInputW * count;
      const feasible = !overHardMax && !overPvCap;

      return { inverter, count, panelCount, arrayWpActual, stringSeriesCount, stringParallelCount, mpptsUsed, stringVocColdV, stringVmpHotV, stringIscHotA, upsizedForDcAc, feasible };
    });

  const best = evaluated.find((c) => c.feasible) ?? evaluated[0] ?? null;

  return best!;
}

function pickController(catalog: SolarCatalog, chargeCurrentA: number, id?: string): { controller: CatalogController; count: number } {
  const pool = catalog.controllers.length ? catalog.controllers : CONTROLLERS;
  if (id) {
    const found = pool.find((c) => c.id === id);
    if (found) return { controller: found, count: Math.max(1, Math.ceil(chargeCurrentA / found.maxAmps)) };
  }
  const fit = pool.slice().sort((a, b) => a.maxAmps - b.maxAmps).find((c) => c.maxAmps >= chargeCurrentA);
  if (fit) return { controller: fit, count: 1 };
  const largest = pool.slice().sort((a, b) => b.maxAmps - a.maxAmps)[0];
  return { controller: largest, count: Math.max(1, Math.ceil(chargeCurrentA / largest.maxAmps)) };
}

function bomLine(label: string, detail: string, qty: number, unitPriceUsd: number, tag?: string): BomLine {
  return { label, detail, qty, unitPriceUsd, totalUsd: Math.round(qty * unitPriceUsd), tag };
}

// Standard DIN-rail DC SPD Ucpv ratings and indicative pricing — used to size the
// mandatory DC surge protection device against the coldest-morning string Voc.
const DC_SPD_OPTIONS: Array<[number, number]> = [[600, 35], [750, 45], [1000, 65], [1500, 95]];

function pickDcSpd(requiredUcpvV: number): { ucpvV: number; priceUsd: number } {
  const match = DC_SPD_OPTIONS.find(([ucpv]) => ucpv >= requiredUcpvV);
  return match ? { ucpvV: match[0], priceUsd: match[1] } : { ucpvV: DC_SPD_OPTIONS[DC_SPD_OPTIONS.length - 1][0], priceUsd: DC_SPD_OPTIONS[DC_SPD_OPTIONS.length - 1][1] };
}

export function computeSystemDesign(loads: LoadItem[], site: SiteConfig, opts: EngineOptions = {}, catalog: SolarCatalog = DEFAULT_CATALOG): DesignResult {
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
  const battery = pickBattery(catalog, site.batteryChemistry, site.systemVoltage, opts.batteryId);
  const batteryRoundTripEff = isGridTied ? 1 : battery.roundTripEff;
  const systemEfficiency = site.inverterEfficiencyPct * (1 - site.wiringLossPct) * batteryRoundTripEff;
  const dailyEnergyAdjustedWh = systemEfficiency > 0 ? dailyEnergyWh / systemEfficiency : dailyEnergyWh;

  // The backup/recharge target: essential loads only for a hybrid design (grid covers
  // the rest), the full demand for an off-grid design. Reused for both battery bank
  // sizing and the worst-month recharge test below.
  const backupTargetWh = site.systemType === 'HYBRID' && essentialDailyEnergyWh > 0 ? essentialDailyEnergyWh : dailyEnergyWh;

  // --- Array target (energy-driven, floored by the worst-month recharge need) & roof-aware panel choice ---
  const performanceRatio = performanceRatioFor(site.mountingMethod);
  const otherLossDerate = Math.max(0.5, Math.min(1, site.panelDeratingPct)); // dust/soiling/mismatch only — temperature is in performanceRatio
  const worstMonthPsh = site.psh * DESIGN_RULES_CONFIG.worstMonthPshFactor;
  const energyDrivenArrayWpNeeded = site.psh > 0 ? dailyEnergyAdjustedWh / (site.psh * performanceRatio * otherLossDerate) : dailyEnergyAdjustedWh;

  // An array sized only for the ANNUAL AVERAGE daily energy need can still fail
  // the worst-month recharge test (rainy-season PSH is much lower) — so, for a
  // battery-backed design, also floor the target at what the worst month needs
  // to recharge the bank with a comfortable margin, rather than only detecting
  // the shortfall after the fact.
  let arrayWpNeeded = energyDrivenArrayWpNeeded;
  if (!isGridTied && worstMonthPsh > 0 && performanceRatio > 0) {
    const daytimeLoadWh = backupTargetWh * site.daytimeLoadFractionPct;
    const eveningLoadWh = backupTargetWh * (1 - site.daytimeLoadFractionPct);
    const requiredChargeWh = battery.roundTripEff > 0 ? eveningLoadWh / battery.roundTripEff : eveningLoadWh;
    const targetMarginMultiplier = 1 + DESIGN_RULES_CONFIG.rechargeTightMarginPct / 100;
    const minArrayWpForRecharge = (daytimeLoadWh + requiredChargeWh * targetMarginMultiplier) / (worstMonthPsh * performanceRatio);
    arrayWpNeeded = Math.max(arrayWpNeeded, minArrayWpForRecharge);
  }
  const upsizedForRecharge = arrayWpNeeded > energyDrivenArrayWpNeeded * 1.02;
  if (upsizedForRecharge) {
    warnings.push({
      level: 'info',
      message: `Array sized above the annual-average energy need to pass the worst-month (rainy-season) recharge test — the battery would not reach full charge every night in December–February otherwise.`,
    });
  }
  const panel = pickPanelForRoof(catalog, site, arrayWpNeeded, opts.panelId);

  // --- Inverter + array/string sizing, chosen together (see chooseInverterAndArray) ---
  const choice = chooseInverterAndArray(
    catalog,
    site.systemType,
    site.mountingMethod,
    panel,
    arrayWpNeeded,
    peakLoadW * INVERTER_SAFETY_FACTOR,
    surgeLoadW,
    opts.inverterId
  );
  const { inverter, count: inverterCount, panelCount, arrayWpActual, stringSeriesCount, stringParallelCount, stringVocColdV, stringVmpHotV, stringIscHotA } = choice;
  let mpptsUsed = choice.mpptsUsed;

  if (inverter.continuousW * inverterCount < peakLoadW) {
    warnings.push({ level: 'critical', message: 'Selected inverter capacity is below the calculated peak load even after paralleling available units — choose a larger model.' });
  }
  if (choice.upsizedForDcAc) {
    warnings.push({
      level: 'info',
      message: `Array sized above the calculated energy need (to ${(arrayWpActual / 1000).toFixed(2)} kWp) to keep the DC:AC ratio within the safe band for the ${inverter.model} — the peak/surge load, not the daily energy demand, drove the inverter choice.`,
    });
  }

  // --- Battery sizing ---
  let batteryBankWh = 0;
  let batteryBankAh = 0;
  let batterySeriesCount = 0;
  let batteryParallelCount = 0;
  let batteryTotalCount = 0;
  let batteryUsableKwh = 0;

  if (!isGridTied) {
    batteryBankWh = (backupTargetWh * site.autonomyDays) / battery.maxDodPct / battery.roundTripEff;
    batteryBankAh = batteryBankWh / site.systemVoltage;

    batterySeriesCount = Math.max(1, Math.round(site.systemVoltage / battery.voltage));
    if (batterySeriesCount * battery.voltage !== site.systemVoltage) {
      warnings.push({
        level: 'warn',
        message: `${battery.model} (${battery.voltage}V) does not divide evenly into a ${site.systemVoltage}V bank — choose a battery whose voltage is a clean multiple, or adjust system voltage.`,
      });
    }

    // Parallel count must satisfy energy/autonomy AND the bank's charge/discharge
    // current headroom against the array's peak DC power and the inverter's DC
    // draw — sizing by energy alone (the old behavior) is exactly what produced
    // BAT-CHG/BAT-DSCH failures the engine wasn't correcting for.
    const energyBasedParallel = Math.max(1, Math.ceil(batteryBankAh / battery.ah));
    const inverterDcDrawW = inverter.efficiencyPct > 0 ? (inverter.continuousW * inverterCount) / inverter.efficiencyPct : inverter.continuousW * inverterCount;
    const chargeBasedParallel = battery.maxChargeCurrentA > 0 ? Math.ceil((arrayWpActual * DESIGN_RULES_CONFIG.battery.minChargeHeadroom) / (battery.maxChargeCurrentA * site.systemVoltage)) : 1;
    const dischargeBasedParallel = battery.maxDischargeCurrentA > 0 ? Math.ceil((inverterDcDrawW * DESIGN_RULES_CONFIG.battery.minDischargeHeadroom) / (battery.maxDischargeCurrentA * site.systemVoltage)) : 1;
    batteryParallelCount = Math.max(energyBasedParallel, chargeBasedParallel, dischargeBasedParallel);

    if (batteryParallelCount > energyBasedParallel) {
      warnings.push({
        level: 'info',
        message: `Battery count increased beyond the energy/autonomy requirement to give the bank enough charge/discharge current headroom for this array and inverter (${battery.brand} ${battery.model} is current-limited here, not capacity-limited).`,
      });
    }

    batteryTotalCount = batterySeriesCount * batteryParallelCount;
    batteryUsableKwh = (batteryTotalCount * battery.voltage * battery.ah * battery.maxDodPct) / 1000;

    if (batteryParallelCount > 4) {
      warnings.push({ level: 'info', message: `${batteryParallelCount} parallel battery strings — consider a higher-capacity battery model or higher system voltage to simplify wiring.` });
    }
  }

  // --- Charge controller sizing (skipped when the inverter has built-in MPPT, e.g. hybrid/grid-tie) ---
  const chargeCurrentA = (arrayWpActual * ARRAY_SAFETY_FACTOR) / site.systemVoltage;
  let controller: CatalogController | null = null;
  let controllerCount = 0;
  if (!isGridTied && !inverter.mpptBuiltIn) {
    const picked = pickController(catalog, chargeCurrentA, opts.controllerId);
    controller = picked.controller;
    controllerCount = picked.count;
    mpptsUsed = controllerCount;
    if (controller.maxAmps * controllerCount < chargeCurrentA) {
      warnings.push({ level: 'warn', message: 'Array current exceeds the largest single charge controller — multiple controllers/strings required.' });
    }
    if (stringVocColdV > controller.maxPvVoltage) {
      warnings.push({ level: 'critical', message: `Panel cold-morning Voc (${stringVocColdV.toFixed(0)} V) exceeds the charge controller's max PV voltage (${controller.maxPvVoltage} V) — wire panels in a lower series count or choose a controller with a higher input window.` });
    }
  }

  // --- Cable sizing (indicative) ---
  const dcCableSizeMm2 = cableForCurrent(isGridTied ? panel.isc * panelCount : chargeCurrentA);
  const acCurrentA = (inverter.continuousW * inverterCount) / (site.systemVoltage >= 48 ? 230 : 230);
  const acCableSizeMm2 = cableForCurrent(acCurrentA);

  // --- Design Rules v1.0 derived metrics ---
  const dcAcRatio = inverter.continuousW * inverterCount > 0 ? arrayWpActual / (inverter.continuousW * inverterCount) : 0;
  const inverterLoadRatio = peakLoadW > 0 ? (inverter.continuousW * inverterCount) / peakLoadW : 0;
  const roofAreaRequiredM2 = panel.areaM2 * panelCount * DESIGN_RULES_CONFIG.roof.spacingFactor;
  const requiredDcSpdUcpvV = stringVocColdV > 0 ? stringVocColdV * DESIGN_RULES_CONFIG.dcSpdUcpvFactor : 0;

  let worstMonthMarginPct = 100;
  if (!isGridTied) {
    const worstMonthYieldWh = arrayWpActual * worstMonthPsh * performanceRatio;
    const daytimeLoadWh = backupTargetWh * site.daytimeLoadFractionPct;
    const eveningLoadWh = backupTargetWh * (1 - site.daytimeLoadFractionPct);
    const requiredChargeWh = battery.roundTripEff > 0 ? eveningLoadWh / battery.roundTripEff : eveningLoadWh;
    const netChargeAvailableWh = worstMonthYieldWh - daytimeLoadWh;
    worstMonthMarginPct = requiredChargeWh > 0 ? (netChargeAvailableWh / requiredChargeWh - 1) * 100 : 100;
  }

  let batteryChargeHeadroomRatio = 0;
  let batteryDischargeHeadroomRatio = 0;
  if (!isGridTied && batteryTotalCount > 0) {
    const batteryChargeCapacityW = batteryTotalCount * battery.maxChargeCurrentA * site.systemVoltage;
    batteryChargeHeadroomRatio = arrayWpActual > 0 ? batteryChargeCapacityW / arrayWpActual : 1;

    const inverterDcDrawW = inverter.efficiencyPct > 0 ? (inverter.continuousW * inverterCount) / inverter.efficiencyPct : inverter.continuousW * inverterCount;
    const batteryDischargeCapacityW = batteryTotalCount * battery.maxDischargeCurrentA * site.systemVoltage;
    batteryDischargeHeadroomRatio = inverterDcDrawW > 0 ? batteryDischargeCapacityW / inverterDcDrawW : 1;
  }

  // --- BOM & cost ---
  const stringDetail = stringSeriesCount > 1
    ? `Solar PV panel (${stringSeriesCount}S x ${stringParallelCount} string${stringParallelCount !== 1 ? 's' : ''} across ${mpptsUsed} MPPT${mpptsUsed !== 1 ? 's' : ''})`
    : 'Solar PV panel';
  const bom: BomLine[] = [];
  bom.push(bomLine(`${panel.brand} ${panel.model}`, stringDetail, panelCount, panel.priceUsd));
  if (!isGridTied) {
    bom.push(bomLine(`${battery.brand} ${battery.model}`, `Battery bank (${batterySeriesCount}S${batteryParallelCount}P)`, batteryTotalCount, battery.priceUsd));
  }
  bom.push(bomLine(`${inverter.brand} ${inverter.model}`, `${inverter.type.replace('_', '-')} inverter`, inverterCount, inverter.priceUsd));
  if (controller) {
    bom.push(bomLine(`${controller.brand} ${controller.model}`, `${controller.type} charge controller`, controllerCount, controller.priceUsd));
  }

  // Mandatory safety BOM (Design Rules v1.0 §7) — itemised, not folded into a lump
  // "balance of system" figure, so there's always room for a properly sized DC SPD.
  const dcSpd = pickDcSpd(requiredDcSpdUcpvV || 600);
  bom.push(bomLine('DC surge protection device', `Type 2, DIN rail, Ucpv ${dcSpd.ucpvV}V`, 1, dcSpd.priceUsd, 'dc_spd'));
  bom.push(bomLine('AC surge protection device', 'Type 2, DIN rail', 1, 35, 'ac_spd'));
  bom.push(bomLine('DC isolator', `Rated for ${Math.ceil(chargeCurrentA || panel.isc * panelCount)}A`, isGridTied ? 1 : Math.max(1, mpptsUsed), 22, 'dc_isolator'));
  bom.push(bomLine('AC isolator', `Rated for ${Math.ceil(acCurrentA)}A`, 1, 18, 'ac_isolator'));
  bom.push(bomLine('Earthing', 'Earth electrode, earth bar and conductor', 1, 40, 'earth'));
  bom.push(bomLine('Equipotential bonding', 'Array frame + DB bonding conductor', 1, 15, 'bonding'));
  bom.push(bomLine('Warning/isolation labels', 'Dual-supply and isolation point labelling set', 1, 10, 'labels'));
  bom.push(bomLine(
    isGridTied ? 'PV supply sub-distribution board' : 'Essential-loads distribution board',
    isGridTied ? 'PV isolation & monitoring sub-board' : 'Backed-up circuits, separated from non-essential loads',
    1,
    65,
    'essential_db'
  ));
  bom.push(bomLine('System monitoring', 'Cloud/Wi-Fi monitoring dongle & app access', 1, 85, 'monitoring'));

  const equipmentSubtotal = bom.reduce((s, l) => s + l.totalUsd, 0);
  const bosUsd = Math.round(equipmentSubtotal * BALANCE_OF_SYSTEM_PCT);
  bom.push(bomLine('Balance of system', 'Mounting rails, generic DC/AC cabling, combiner box (est.)', 1, bosUsd));

  const equipmentTotalUsd = bom.reduce((s, l) => s + l.totalUsd, 0);
  const installBufferUsd = Math.round(equipmentTotalUsd * site.installBufferPct);
  const totalUsd = equipmentTotalUsd + installBufferUsd;

  // --- Financials ---
  const estMonthlyProductionKwh = (arrayWpActual / 1000) * site.psh * performanceRatio * otherLossDerate * 30;
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

  const design: DesignResult = {
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

    mountingMethod: site.mountingMethod,
    performanceRatio,
    dcAcRatio,

    stringSeriesCount,
    stringParallelCount,
    mpptsUsed,
    stringVocColdV,
    stringVmpHotV,
    stringIscHotA,

    worstMonthPsh,
    worstMonthMarginPct,

    batteryChargeHeadroomRatio,
    batteryDischargeHeadroomRatio,
    inverterLoadRatio,

    roofAreaRequiredM2,
    requiredDcSpdUcpvV,

    ruleResults: [],
    hasBlockingFailures: false,
  };

  design.ruleResults = validateDesign(design, site);
  design.hasBlockingFailures = design.ruleResults.some((r) => r.severity === 'FAIL');

  return design;
}

export function defaultSiteConfig(): SiteConfig {
  return {
    locationId: 'harare',
    psh: 5.3,
    systemType: 'HYBRID',
    autonomyDays: 1,
    batteryChemistry: 'LFP',
    systemVoltage: 48,
    panelDeratingPct: 0.97,
    mountingMethod: 'STANDOFF',
    roofAreaM2: 40,
    daytimeLoadFractionPct: 0.35,
    inverterEfficiencyPct: 0.93,
    wiringLossPct: 0.03,
    installBufferPct: 0.15,
    monthlyGridBillUsd: 120,
    tariffUsdPerKwh: 0.15,
    financingEnabled: false,
    downPaymentUsd: 0,
    loanTermYears: 3,
    loanInterestRatePct: 15,
    clientName: '',
    siteName: '',
    notes: '',
  };
}

export function defaultExistingSystem(): ExistingSystem {
  return {
    arrayWp: 1800,
    batteryUsableKwh: 2.5,
    batteryChemistry: 'LFP',
    inverterContinuousW: 3000,
    inverterSurgeW: 6000,
    hasController: true,
    controllerMaxAmps: 60,
  };
}

/**
 * Compares an existing installed system against what the current load profile
 * requires, and recommends the panels/battery/inverter/controller additions
 * needed to close the gap — the "upgrade an existing system" path.
 */
export function computeUpgradeDesign(existing: ExistingSystem, loads: LoadItem[], site: SiteConfig, opts: EngineOptions = {}, catalog: SolarCatalog = DEFAULT_CATALOG): UpgradeResult {
  const target = computeSystemDesign(loads, site, opts, catalog);
  const warnings: DesignWarning[] = [];

  const gapArrayWp = Math.max(0, target.arrayWpNeeded - existing.arrayWp);
  const panel = target.panel;
  const additionalPanelCount = gapArrayWp > 0 ? Math.ceil(gapArrayWp / panel.wattage) : 0;

  const gapBatteryKwh = Math.max(0, target.batteryUsableKwh - existing.batteryUsableKwh);
  const battery = target.battery;
  const additionalBatteryCount = gapBatteryKwh > 0
    ? Math.ceil((gapBatteryKwh * 1000) / (battery.voltage * battery.ah * battery.maxDodPct))
    : 0;

  if (additionalBatteryCount > 0) {
    if (existing.batteryUsableKwh > 0 && existing.batteryChemistry !== site.batteryChemistry) {
      warnings.push({
        level: 'warn',
        message: `Adding ${battery.chemistry} batteries to an existing ${existing.batteryChemistry} bank is not recommended — different chemistries charge and age differently. Use a separate bank/charge path, or replace the existing batteries with matching ones.`,
      });
    } else if (existing.batteryUsableKwh > 0) {
      warnings.push({
        level: 'info',
        message: 'Avoid mixing new and old batteries of different age/health in the same bank — pair by condition, or isolate the addition on its own charge/discharge path.',
      });
    }
  }

  const requiredContinuousW = target.peakLoadW * INVERTER_SAFETY_FACTOR;
  const inverterOk = existing.inverterContinuousW >= requiredContinuousW && existing.inverterSurgeW >= target.surgeLoadW;
  const inverterRecommendation = inverterOk
    ? 'Existing inverter has enough capacity for the new load profile.'
    : `Existing inverter (${(existing.inverterContinuousW / 1000).toFixed(1)} kW continuous) is undersized for the new peak load (${(requiredContinuousW / 1000).toFixed(1)} kW needed, ${(target.surgeLoadW / 1000).toFixed(1)} kW surge). Replace with a unit around ${((target.inverter.continuousW * target.inverterCount) / 1000).toFixed(1)} kW such as ${target.inverter.brand} ${target.inverter.model}, or add a second compatible inverter in parallel if the model supports it.`;

  const additionalChargeCurrentA = Math.max(0, target.chargeCurrentA - (existing.hasController ? existing.controllerMaxAmps : 0));
  const controllerOk = !target.controller || additionalChargeCurrentA <= 0;
  let controllerRecommendation: string;
  if (!target.controller) {
    controllerRecommendation = 'No separate charge controller needed for the target design — the recommended inverter has MPPT built in.';
  } else if (controllerOk) {
    controllerRecommendation = 'Existing charge controller can handle the new array current.';
  } else {
    controllerRecommendation = `Add a ${target.controller.type} controller rated for at least ${additionalChargeCurrentA.toFixed(0)} A (e.g. ${target.controller.brand} ${target.controller.model}) to handle the additional panels, or upgrade the existing controller.`;
  }

  const dcCableSizeMm2 = cableForCurrent(additionalChargeCurrentA > 0 ? additionalChargeCurrentA : target.chargeCurrentA);

  const bom: BomLine[] = [];
  if (additionalPanelCount > 0) bom.push(bomLine(`${panel.brand} ${panel.model}`, 'Additional solar PV panel', additionalPanelCount, panel.priceUsd));
  if (additionalBatteryCount > 0) bom.push(bomLine(`${battery.brand} ${battery.model}`, 'Additional battery', additionalBatteryCount, battery.priceUsd));
  if (!inverterOk) bom.push(bomLine(`${target.inverter.brand} ${target.inverter.model}`, 'Replacement/additional inverter', target.inverterCount, target.inverter.priceUsd));
  if (target.controller && additionalChargeCurrentA > 0) bom.push(bomLine(`${target.controller.brand} ${target.controller.model}`, 'Additional charge controller', 1, target.controller.priceUsd));

  const equipmentSubtotal = bom.reduce((s, l) => s + l.totalUsd, 0);
  if (bom.length > 0) {
    const bosUsd = Math.round(equipmentSubtotal * 0.1);
    bom.push(bomLine('Additional wiring & connectors', 'Cabling, breakers, connectors for the addition (est.)', 1, bosUsd));
  } else {
    warnings.push({ level: 'info', message: 'Your existing system already meets the calculated requirement for this load profile — no additions needed.' });
  }

  const additionsTotalUsd = bom.reduce((s, l) => s + l.totalUsd, 0);

  return {
    target,
    existing,
    gapArrayWp,
    additionalPanelCount,
    panel,
    gapBatteryKwh,
    additionalBatteryCount,
    battery,
    inverterOk,
    inverterRecommendation,
    controllerOk,
    controllerRecommendation,
    additionalChargeCurrentA,
    dcCableSizeMm2,
    bom,
    additionsTotalUsd,
    warnings,
  };
}

// Re-exported so components can source the raw catalogs from one module.
export { PANELS, BATTERIES, INVERTERS, CONTROLLERS };
