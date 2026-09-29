// SmartTech Solar — Design Rules v1.0 safety & commercial validation.
//
// Every threshold lives in DESIGN_RULES_CONFIG below — change it there and
// nowhere else, so one place holds the company standard. validateDesign()
// runs against an already-computed DesignResult (engine.ts owns the physics;
// this module only judges the numbers against the company's rules) and
// returns one DesignRuleResult per check. A FAIL blocks the PDF proposal
// (see /api/solar/pdf); a WARN is shown in the app only, never on the
// client-facing PDF ("prints on the internal sheet only").
import type { DesignResult, DesignRuleResult, SiteConfig } from './types';

export const DESIGN_RULES_CONFIG = {
  dcac: {
    hardMin: 0.9,
    softMin: 1.05,
    softMax: 1.3,
    hardMax: 1.45,
  },
  temp: {
    designMin_C: 2,
    designMaxAmb_C: 38,
    cellRise_flush: 32,
    cellRise_standoff: 25,
    cellRise_ground: 22,
  },
  voltage: {
    vocSafety: 0.95, // effective Voc ceiling = maxDcInputVoltage * vocSafety
    vmpSafety: 1.05, // effective Vmp floor = mpptFullPowerVoltageMin * vmpSafety
    iscSafety: 1.25, // effective Isc ceiling = maxInputCurrentPerMpptA / iscSafety
  },
  worstMonthPshFactor: 0.72,
  rechargeTightMarginPct: 15, // RCH-TIGHT — minimum margin before it's only a warning
  pr: {
    flush: 0.7,
    standoff: 0.78,
    ground: 0.8,
  },
  battery: {
    autonomyDaysHybrid: 1.0,
    autonomyDaysOffGrid: 2.0,
    minChargeHeadroom: 1.0,
    minDischargeHeadroom: 1.0,
  },
  inverterLoad: {
    minHeadroom: 1.15,
    maxOversize: 2.0,
  },
  roof: {
    spacingFactor: 1.15,
  },
  mandatoryBom: ['dc_spd', 'ac_spd', 'dc_isolator', 'ac_isolator', 'earth', 'bonding', 'labels', 'essential_db', 'monitoring'] as const,
  dcSpdUcpvFactor: 1.2, // BOM-SPD-UCPV
};

const MANDATORY_BOM_LABELS: Record<string, string> = {
  dc_spd: 'DC surge protection device',
  ac_spd: 'AC surge protection device',
  dc_isolator: 'DC isolator',
  ac_isolator: 'AC isolator',
  earth: 'Earthing',
  bonding: 'Equipotential bonding',
  labels: 'Warning/isolation labels',
  essential_db: 'Essential-loads distribution board',
  monitoring: 'System monitoring',
};

function r(id: string, severity: DesignRuleResult['severity'], message: string): DesignRuleResult {
  return { id, severity, message };
}

export function validateDesign(design: DesignResult, site: SiteConfig): DesignRuleResult[] {
  const cfg = DESIGN_RULES_CONFIG;
  const out: DesignRuleResult[] = [];
  const isGridTied = site.systemType === 'GRID_TIED';

  // --- 0. Required inputs ---
  if (design.dailyEnergyWh <= 0) {
    out.push(r('IN', 'FAIL', 'No daily energy demand — add at least one appliance/load before sizing a system.'));
  }
  if (site.roofAreaM2 <= 0) {
    out.push(r('IN', 'FAIL', 'Usable roof area is required to check the array will physically fit.'));
  }
  if (site.psh <= 0) {
    out.push(r('IN', 'FAIL', 'Annual peak sun hours (PSH) is required to size the array.'));
  }

  // --- 1. DC:AC ratio ---
  // Only meaningful when the array feeds the inverter directly through built-in
  // MPPT (hybrid/grid-tie) — an external-charge-controller off-grid system buffers
  // the array through the battery, so a bigger array doesn't "clip" the same way.
  if (design.inverter.mpptBuiltIn && design.dcAcRatio > 0) {
    if (design.dcAcRatio < cfg.dcac.hardMin) {
      out.push(r('DCAC-LOW', 'FAIL', `DC:AC ratio is ${design.dcAcRatio.toFixed(2)} — below the ${cfg.dcac.hardMin.toFixed(2)} hard minimum. The client is paying for inverter capacity they can never use.`));
    } else if (design.dcAcRatio < cfg.dcac.softMin) {
      out.push(r('DCAC-SOFT', 'WARN', `DC:AC ratio is ${design.dcAcRatio.toFixed(2)} — below the preferred ${cfg.dcac.softMin.toFixed(2)}–${cfg.dcac.softMax.toFixed(2)} band.`));
    } else if (design.dcAcRatio > cfg.dcac.hardMax) {
      out.push(r('DCAC-HIGH', 'FAIL', `DC:AC ratio is ${design.dcAcRatio.toFixed(2)} — above the ${cfg.dcac.hardMax.toFixed(2)} hard maximum. A real part of every clear midday will be clipped.`));
    } else if (design.dcAcRatio > cfg.dcac.softMax) {
      out.push(r('DCAC-SOFT', 'WARN', `DC:AC ratio is ${design.dcAcRatio.toFixed(2)} — above the preferred ${cfg.dcac.softMin.toFixed(2)}–${cfg.dcac.softMax.toFixed(2)} band.`));
    }
    const maxPvInputTotalW = design.inverter.maxPvInputW * design.inverterCount;
    if (maxPvInputTotalW > 0 && design.arrayWpActual > maxPvInputTotalW) {
      out.push(r('DCAC-MAXPV', 'FAIL', `Array (${(design.arrayWpActual / 1000).toFixed(2)} kWp) exceeds the inverter's hard PV input limit of ${(maxPvInputTotalW / 1000).toFixed(1)} kW.`));
    }
  }

  // --- 2. String voltage against temperature (only meaningful once a string exists) ---
  if (design.stringSeriesCount > 0) {
    const vocCeiling = design.inverter.mpptBuiltIn
      ? design.inverter.maxDcInputVoltage * cfg.voltage.vocSafety
      : 0; // controller-fed systems are checked against controller.maxPvVoltage in engine.ts before this point
    if (vocCeiling > 0 && design.stringVocColdV > vocCeiling) {
      out.push(r('STR-VOC', 'FAIL', `Coldest-morning string Voc is ${design.stringVocColdV.toFixed(0)} V — above the safe ceiling of ${vocCeiling.toFixed(0)} V (${(design.inverter.maxDcInputVoltage).toFixed(0)} V max DC input x ${cfg.voltage.vocSafety}).`));
    }
    const vmpFloor = design.inverter.mpptBuiltIn ? design.inverter.mpptFullPowerVoltageMin * cfg.voltage.vmpSafety : 0;
    if (vmpFloor > 0 && design.stringVmpHotV < vmpFloor) {
      out.push(r('STR-VMP', 'FAIL', `Hot-afternoon string Vmp is only ${design.stringVmpHotV.toFixed(0)} V — below the MPPT full-power floor of ${vmpFloor.toFixed(0)} V. The inverter will fall out of MPPT tracking on hot afternoons.`));
    }
    const iscCeiling = design.inverter.mpptBuiltIn ? design.inverter.maxInputCurrentPerMpptA / cfg.voltage.iscSafety : 0;
    if (iscCeiling > 0 && design.stringIscHotA > iscCeiling) {
      out.push(r('STR-ISC', 'FAIL', `Hot-afternoon string Isc x ${cfg.voltage.iscSafety} is ${(design.stringIscHotA * cfg.voltage.iscSafety).toFixed(1)} A — above the ${(design.inverter.maxInputCurrentPerMpptA).toFixed(0)} A per-MPPT current limit.`));
    }
  } else if (!isGridTied || design.panelCount > 0) {
    out.push(r('STR-NONE', 'FAIL', 'No valid series-string configuration found for this array/inverter combination — modules-per-string could not be determined.'));
  }

  // --- 3. Worst-month recharge test ---
  if (!isGridTied) {
    if (design.worstMonthMarginPct < 0) {
      out.push(r('RCH-SHORT', 'FAIL', `Worst-month recharge only reaches ${(100 + design.worstMonthMarginPct).toFixed(0)}% of what the battery needs — it will not reach full charge through the rainy season and the client will run out most nights.`));
    } else if (design.worstMonthMarginPct < cfg.rechargeTightMarginPct) {
      out.push(r('RCH-TIGHT', 'WARN', `Worst-month recharge margin is only ${design.worstMonthMarginPct.toFixed(0)}% — below the ${cfg.rechargeTightMarginPct}% comfort margin.`));
    }
  }

  // --- 4. Performance ratio disclosure + battery checks ---
  if (!isGridTied) {
    const minAutonomy = site.systemType === 'HYBRID' ? cfg.battery.autonomyDaysHybrid : cfg.battery.autonomyDaysOffGrid;
    if (site.autonomyDays < minAutonomy) {
      out.push(r('BAT-SMALL', 'WARN', `Autonomy is set to ${site.autonomyDays} day(s) — below the ${minAutonomy} day company minimum for a ${site.systemType.replace('_', '-').toLowerCase()} design.`));
    }
    if (design.batteryChargeHeadroomRatio > 0 && design.batteryChargeHeadroomRatio < cfg.battery.minChargeHeadroom) {
      out.push(r('BAT-CHG', 'FAIL', `Battery charge acceptance covers only ${(design.batteryChargeHeadroomRatio * 100).toFixed(0)}% of the array's peak DC power — the BMS will throttle at noon and that energy is lost.`));
    }
    if (design.batteryDischargeHeadroomRatio > 0 && design.batteryDischargeHeadroomRatio < cfg.battery.minDischargeHeadroom) {
      out.push(r('BAT-DSCH', 'FAIL', `Battery discharge capability covers only ${(design.batteryDischargeHeadroomRatio * 100).toFixed(0)}% of what the inverter needs at full output — the BMS will current-limit before the inverter reaches its rating.`));
    }
  }

  // --- 5. Inverter vs load ---
  if (design.inverterLoadRatio > 0) {
    if (design.inverterLoadRatio < cfg.inverterLoad.minHeadroom) {
      out.push(r('INV-SMALL', 'FAIL', `Inverter capacity is only ${design.inverterLoadRatio.toFixed(2)}x the peak load — below the ${cfg.inverterLoad.minHeadroom}x minimum. Motor starting (fridge, pump, AC) can trip it.`));
    } else if (design.inverterLoadRatio > cfg.inverterLoad.maxOversize) {
      out.push(r('INV-BIG', 'WARN', `Inverter capacity is ${design.inverterLoadRatio.toFixed(2)}x the peak load — above the ${cfg.inverterLoad.maxOversize}x company guideline. The client is paying for capacity they won't use.`));
    }
  }

  // --- 6. Roof area ---
  if (site.roofAreaM2 > 0 && design.roofAreaRequiredM2 > site.roofAreaM2) {
    out.push(r('ROOF-AREA', 'FAIL', `The array needs ~${design.roofAreaRequiredM2.toFixed(1)} m² (with walkway/edge spacing) but only ${site.roofAreaM2.toFixed(1)} m² of roof is available.`));
  }

  // --- 7. Mandatory bill of materials ---
  const presentTags = new Set(design.bom.map((l) => l.tag).filter(Boolean) as string[]);
  const missing = cfg.mandatoryBom.filter((tag) => !presentTags.has(tag));
  if (missing.length > 0) {
    out.push(r('BOM', 'FAIL', `Missing mandatory BOM item(s): ${missing.map((t) => MANDATORY_BOM_LABELS[t] ?? t).join(', ')}.`));
  }
  if (design.requiredDcSpdUcpvV > 0) {
    const dcSpdLine = design.bom.find((l) => l.tag === 'dc_spd');
    const specifiedUcpv = dcSpdLine ? Number((dcSpdLine.detail.match(/(\d+)\s*V/) ?? [])[1]) : 0;
    if (!specifiedUcpv || specifiedUcpv < design.requiredDcSpdUcpvV) {
      out.push(r('BOM-SPD-UCPV', 'FAIL', `DC SPD Ucpv must be at least ${design.requiredDcSpdUcpvV.toFixed(0)} V (1.2x the coldest-morning string Voc of ${design.stringVocColdV.toFixed(0)} V).`));
    } else {
      out.push(r('BOM-SPD-UCPV', 'PASS', `DC SPD rated ${specifiedUcpv} V Ucpv clears the ${design.requiredDcSpdUcpvV.toFixed(0)} V minimum.`));
    }
  }

  return out;
}
