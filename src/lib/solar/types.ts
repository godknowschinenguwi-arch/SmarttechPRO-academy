// SmartTech Solar Calculator — shared domain types.

export type SystemType = 'OFF_GRID' | 'HYBRID' | 'GRID_TIED';
export type BatteryChemistry = 'LFP' | 'AGM' | 'GEL' | 'FLOODED';
export type SystemVoltage = 12 | 24 | 48;

export interface ApplianceDef {
  id: string;
  name: string;
  category: string;
  icon: string;
  watts: number;
  /** Inrush/surge multiplier applied on top of running watts (motors, compressors, pumps). */
  surgeFactor: number;
  defaultHours: number;
  defaultQty: number;
}

export interface LoadItem {
  id: string;
  applianceId: string;
  name: string;
  category: string;
  icon: string;
  watts: number;
  qty: number;
  hours: number;
  surgeFactor: number;
  /** Essential loads are the subset kept on battery backup in a HYBRID design. */
  essential: boolean;
}

export interface LocationDef {
  id: string;
  name: string;
  country: string;
  /** Average peak sun hours per day (annual average, kWh/m²/day). */
  psh: number;
}

export interface CatalogPanel {
  id: string;
  brand: string;
  model: string;
  wattage: number;
  vmp: number;
  imp: number;
  voc: number;
  isc: number;
  priceUsd: number;
}

export interface CatalogBattery {
  id: string;
  brand: string;
  model: string;
  chemistry: BatteryChemistry;
  voltage: number;
  ah: number;
  maxDodPct: number;
  roundTripEff: number;
  cycleLife: number;
  priceUsd: number;
}

export interface CatalogInverter {
  id: string;
  brand: string;
  model: string;
  type: 'OFF_GRID' | 'HYBRID' | 'GRID_TIE';
  continuousW: number;
  surgeW: number;
  voltageOptions: SystemVoltage[];
  mpptBuiltIn: boolean;
  efficiencyPct: number;
  priceUsd: number;
}

export interface CatalogController {
  id: string;
  brand: string;
  model: string;
  type: 'MPPT' | 'PWM';
  maxAmps: number;
  maxPvVoltage: number;
  priceUsd: number;
}

export interface SiteConfig {
  locationId: string;
  psh: number;
  systemType: SystemType;
  autonomyDays: number;
  batteryChemistry: BatteryChemistry;
  systemVoltage: SystemVoltage;
  panelDeratingPct: number; // dust/temp/wiring losses on the array, 0-1 (kept as fraction)
  inverterEfficiencyPct: number; // 0-1
  wiringLossPct: number; // 0-1
  installBufferPct: number; // 0-1, labour + misc BOM buffer
  monthlyGridBillUsd: number;
  tariffUsdPerKwh: number;
  clientName: string;
  siteName: string;
  notes: string;
}

export interface BomLine {
  label: string;
  detail: string;
  qty: number;
  unitPriceUsd: number;
  totalUsd: number;
}

export interface DesignWarning {
  level: 'info' | 'warn' | 'critical';
  message: string;
}

export interface DesignResult {
  dailyEnergyWh: number;
  dailyEnergyAdjustedWh: number;
  peakLoadW: number;
  surgeLoadW: number;
  essentialDailyEnergyWh: number;

  arrayWpNeeded: number;
  panel: CatalogPanel;
  panelCount: number;
  arrayWpActual: number;

  batteryBankWh: number;
  batteryBankAh: number;
  battery: CatalogBattery;
  batterySeriesCount: number;
  batteryParallelCount: number;
  batteryTotalCount: number;
  batteryUsableKwh: number;

  inverter: CatalogInverter;
  inverterCount: number;

  controller: CatalogController | null;
  controllerCount: number;
  chargeCurrentA: number;

  dcCableSizeMm2: number;
  acCableSizeMm2: number;

  bom: BomLine[];
  equipmentTotalUsd: number;
  installBufferUsd: number;
  totalUsd: number;

  estMonthlyProductionKwh: number;
  estMonthlySavingsUsd: number;
  paybackYears: number | null;

  warnings: DesignWarning[];
}

export interface ExistingSystem {
  arrayWp: number;
  batteryUsableKwh: number;
  batteryChemistry: BatteryChemistry;
  inverterContinuousW: number;
  inverterSurgeW: number;
  hasController: boolean;
  controllerMaxAmps: number;
}

export interface UpgradeResult {
  target: DesignResult;
  existing: ExistingSystem;

  gapArrayWp: number;
  additionalPanelCount: number;
  panel: CatalogPanel;

  gapBatteryKwh: number;
  additionalBatteryCount: number;
  battery: CatalogBattery;

  inverterOk: boolean;
  inverterRecommendation: string;

  controllerOk: boolean;
  controllerRecommendation: string;
  additionalChargeCurrentA: number;
  dcCableSizeMm2: number;

  bom: BomLine[];
  additionsTotalUsd: number;

  warnings: DesignWarning[];
}

export interface Scenario {
  id: string;
  name: string;
  createdAt: string;
  loads: LoadItem[];
  site: SiteConfig;
}
