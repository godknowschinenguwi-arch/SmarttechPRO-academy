// SmartTech Solar Calculator — shared domain types.

export type SystemType = 'OFF_GRID' | 'HYBRID' | 'GRID_TIED';
export type BatteryChemistry = 'LFP' | 'AGM' | 'GEL' | 'FLOODED';
export type SystemVoltage = 12 | 24 | 48;
/** Roof-mounting method — drives the array's performance ratio (cell-temperature losses differ a lot by mount). */
export type MountingMethod = 'FLUSH' | 'STANDOFF' | 'GROUND';

export type RuleSeverity = 'FAIL' | 'WARN' | 'PASS';

/** One line of the Design Rules v1.0 safety/commercial validation report. */
export interface DesignRuleResult {
  id: string; // e.g. 'DCAC-LOW', 'STR-VMP', 'BOM'
  severity: RuleSeverity;
  message: string;
}

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
  /** Module area, m² — used for the roof-area check. TODO: confirm against datasheet per model. */
  areaM2: number;
  /** Temperature coefficient of Pmax, %/°C (negative). TODO: confirm against datasheet per model. */
  tempCoeffPmaxPctPerC: number;
  /** Temperature coefficient of Voc, %/°C (negative). TODO: confirm against datasheet per model. */
  tempCoeffVocPctPerC: number;
  /** Temperature coefficient of Isc, %/°C (positive). TODO: confirm against datasheet per model. */
  tempCoeffIscPctPerC: number;
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
  /** Max continuous charge current per unit, A. TODO: confirm against datasheet/BMS spec per model. */
  maxChargeCurrentA: number;
  /** Max continuous discharge current per unit, A. TODO: confirm against datasheet/BMS spec per model. */
  maxDischargeCurrentA: number;
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
  /** Absolute max DC input (PV) voltage, V. Only meaningful when mpptBuiltIn. TODO: confirm per exact model/firmware. */
  maxDcInputVoltage: number;
  /** MPPT full-power voltage floor, V — string Vmp must clear this at worst-case heat. TODO: confirm per exact model/firmware. */
  mpptFullPowerVoltageMin: number;
  /** Max total PV input power, W (hard inverter limit, not soft). TODO: confirm per exact model/firmware. */
  maxPvInputW: number;
  /** Max input current per MPPT tracker, A. TODO: confirm per exact model/firmware. */
  maxInputCurrentPerMpptA: number;
  /** Number of independent MPPT trackers (0 when PV is fed through a separate charge controller instead). */
  mpptCount: number;
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
  panelDeratingPct: number; // dust/wiring losses only now — temperature is handled by mountingMethod's performance ratio, 0-1
  mountingMethod: MountingMethod;
  roofAreaM2: number; // usable roof area available for the array
  daytimeLoadFractionPct: number; // 0-1, fraction of daily energy consumed while the sun is up
  inverterEfficiencyPct: number; // 0-1
  wiringLossPct: number; // 0-1
  installBufferPct: number; // 0-1, labour + misc BOM buffer
  monthlyGridBillUsd: number;
  tariffUsdPerKwh: number;
  financingEnabled: boolean;
  downPaymentUsd: number;
  loanTermYears: number;
  loanInterestRatePct: number; // annual, percent
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
  /** Mandatory-BOM safety tag (dc_spd, ac_spd, dc_isolator, ac_isolator, earth, bonding, labels, essential_db, monitoring). */
  tag?: string;
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

  // --- Design Rules v1.0 safety/commercial modelling ---
  mountingMethod: MountingMethod;
  performanceRatio: number; // pr.flush / pr.standoff / pr.ground, applied to array output instead of a flat derating
  dcAcRatio: number; // arrayWpActual / (inverter.continuousW * inverterCount)

  /** Modules per string (series count). */
  stringSeriesCount: number;
  /** Number of parallel strings across all MPPTs/controller inputs. */
  stringParallelCount: number;
  /** MPPT trackers (or controller inputs) actually used. */
  mpptsUsed: number;
  /** Coldest-morning string Voc, V — must clear the inverter/controller's max DC input voltage. */
  stringVocColdV: number;
  /** Hottest-afternoon string Vmp, V — must clear the MPPT full-power floor. */
  stringVmpHotV: number;
  /** Hottest-afternoon string Isc, V — must stay under the per-MPPT/controller current limit. */
  stringIscHotA: number;

  /** Rainy-season (worst-month) PSH used for the recharge test. */
  worstMonthPsh: number;
  /** Worst-month recharge margin, % — negative means the battery never reaches full. */
  worstMonthMarginPct: number;

  /** Battery bank charge-acceptance vs array peak DC power. */
  batteryChargeHeadroomRatio: number;
  /** Battery bank discharge capability vs inverter's full-output DC draw. */
  batteryDischargeHeadroomRatio: number;
  /** Inverter capacity vs peak load. */
  inverterLoadRatio: number;

  /** Roof area actually required by the array (module area x count x spacing factor), m². */
  roofAreaRequiredM2: number;
  /** Minimum DC SPD Ucpv rating required for the longest string, V. */
  requiredDcSpdUcpvV: number;

  /** Design Rules v1.0 validation report. */
  ruleResults: DesignRuleResult[];
  /** True when any rule in ruleResults is a FAIL — blocks PDF proposal generation. */
  hasBlockingFailures: boolean;
}

export interface SolarCatalog {
  panels: CatalogPanel[];
  batteries: CatalogBattery[];
  inverters: CatalogInverter[];
  controllers: CatalogController[];
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
