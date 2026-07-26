// Derives the data needed for a single-line electrical diagram (SLD) from an
// already-computed system design. Purely presentational/indicative — string
// voltage limits, breaker sizes and disconnect placement are simplified
// approximations for planning purposes, not a substitute for a licensed
// electrical engineer's stamped drawing checked against the actual equipment
// datasheets and local wiring code.
import type { DesignResult, SiteConfig } from './types';

// Common IEC-style breaker/fuse ratings (amps).
const STANDARD_BREAKERS = [2, 4, 6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 300, 350, 400, 500];

export function nextStandardBreaker(amps: number): number {
  const match = STANDARD_BREAKERS.find((b) => b >= amps);
  return match ?? STANDARD_BREAKERS[STANDARD_BREAKERS.length - 1];
}

export interface ArrayStringConfig {
  seriesCount: number;
  parallelStrings: number;
  stringVoc: number;
  stringVmp: number;
  assumedMaxVoltage: number;
  maxVoltageSource: 'controller' | 'assumed';
}

export interface SldData {
  arrayConfig: ArrayStringConfig;
  dcArrayBreakerA: number;
  dcBatteryBreakerA: number;
  acMainBreakerA: number;
  dcCableSizeMm2: number;
  acCableSizeMm2: number;
  hasBattery: boolean;
  hasController: boolean;
  hasGrid: boolean;
}

export function computeSldData(design: DesignResult, site: SiteConfig): SldData {
  const panel = design.panel;
  const isGridTied = site.systemType === 'GRID_TIED';

  const maxVoltageSource: ArrayStringConfig['maxVoltageSource'] = design.controller ? 'controller' : 'assumed';
  const assumedMaxVoltage = design.controller ? design.controller.maxPvVoltage : isGridTied ? 500 : 150;

  const seriesCount = Math.max(1, Math.min(design.panelCount, Math.floor((assumedMaxVoltage * 0.9) / panel.voc)));
  const parallelStrings = Math.max(1, Math.ceil(design.panelCount / seriesCount));

  const arrayConfig: ArrayStringConfig = {
    seriesCount,
    parallelStrings,
    stringVoc: seriesCount * panel.voc,
    stringVmp: seriesCount * panel.vmp,
    assumedMaxVoltage,
    maxVoltageSource,
  };

  const dcArrayBreakerA = nextStandardBreaker(design.chargeCurrentA);

  const inverterDcContinuousA = design.batteryTotalCount > 0 ? (design.inverter.continuousW * design.inverterCount * 1.25) / site.systemVoltage : 0;
  const dcBatteryBreakerA = design.batteryTotalCount > 0 ? nextStandardBreaker(inverterDcContinuousA) : 0;

  const acCurrentA = (design.inverter.continuousW * design.inverterCount * 1.25) / 230;
  const acMainBreakerA = nextStandardBreaker(acCurrentA);

  return {
    arrayConfig,
    dcArrayBreakerA,
    dcBatteryBreakerA,
    acMainBreakerA,
    dcCableSizeMm2: design.dcCableSizeMm2,
    acCableSizeMm2: design.acCableSizeMm2,
    hasBattery: design.batteryTotalCount > 0,
    hasController: !!design.controller,
    hasGrid: site.systemType !== 'OFF_GRID',
  };
}
