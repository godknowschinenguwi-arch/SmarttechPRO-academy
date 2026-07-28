// SmartTech Electric Fence Calculator — shared domain types.

export type PowerSource = 'MAINS' | 'MAINS_WITH_BACKUP' | 'SOLAR';
export type PostMaterial = 'STEEL' | 'TIMBER' | 'CONCRETE';
export type WireType = 'HT_WIRE' | 'BRAIDED_WIRE';

export interface FenceZone {
  id: string;
  name: string;
  lengthM: number;
  corners: number;
}

export interface FenceConfig {
  strandCount: number;
  wireType: WireType;
  postSpacingM: number;
  postMaterial: PostMaterial;
  gateCount: number;
  powerSource: PowerSource;
  backupHours: number;
  monitoringEnabled: boolean;
  gsmAlertEnabled: boolean;
  installBufferPct: number;
  clientName: string;
  siteName: string;
  notes: string;
}

export interface CatalogEnergizer {
  id: string;
  brand: string;
  model: string;
  joulesOutput: number;
  maxFenceKm: number;
  currentDrawA: number;
  voltageOptions: Array<12 | 24>;
  priceUsd: number;
}

export interface CatalogWire {
  id: string;
  brand: string;
  model: string;
  type: WireType;
  ohmsPerKm: number;
  spoolLengthM: number;
  priceUsdPerSpool: number;
}

export interface CatalogPost {
  id: string;
  brand: string;
  model: string;
  material: PostMaterial;
  heightM: number;
  priceUsd: number;
}

export interface CatalogMonitor {
  id: string;
  brand: string;
  model: string;
  maxZones: number;
  gsmCapable: boolean;
  priceUsd: number;
}

export interface CatalogBackupBattery {
  id: string;
  brand: string;
  model: string;
  voltage: 12 | 24;
  ah: number;
  priceUsd: number;
}

export interface FenceCatalog {
  energizers: CatalogEnergizer[];
  wires: CatalogWire[];
  posts: CatalogPost[];
  monitors: CatalogMonitor[];
  batteries: CatalogBackupBattery[];
}

export interface BomLine {
  label: string;
  detail: string;
  qty: number;
  unitPriceUsd: number;
  totalUsd: number;
}

export interface FenceWarning {
  level: 'info' | 'warn' | 'critical';
  message: string;
}

export interface FenceDesignResult {
  totalPerimeterM: number;
  totalCorners: number;
  totalWireLengthM: number;

  energizer: CatalogEnergizer;
  energizerCount: number;
  effectiveFenceKm: number;

  wire: CatalogWire;
  wireSpoolsNeeded: number;

  post: CatalogPost;
  postCount: number;
  insulatorCount: number;
  earthStakeCount: number;

  battery: CatalogBackupBattery | null;
  batteryCount: number;

  monitor: CatalogMonitor | null;

  bom: BomLine[];
  equipmentTotalUsd: number;
  installBufferUsd: number;
  totalUsd: number;

  warnings: FenceWarning[];
}

export interface FenceScenario {
  id: string;
  name: string;
  createdAt: string;
  zones: FenceZone[];
  config: FenceConfig;
}
