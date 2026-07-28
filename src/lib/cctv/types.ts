// SmartTech CCTV Calculator — shared domain types.

export type CameraType = 'DOME' | 'BULLET' | 'TURRET' | 'PTZ';
export type Environment = 'INDOOR' | 'OUTDOOR';
export type RecordingMode = 'CONTINUOUS' | 'MOTION';
export type Compression = 'H264' | 'H265';
export type CableType = 'CAT6' | 'COAX_POWER';

export interface CameraPoint {
  id: string;
  name: string;
  type: CameraType;
  environment: Environment;
  resolutionMp: number;
  distanceFromNvrM: number;
  lowLight: boolean;
}

export interface CctvConfig {
  frameRate: number;
  compression: Compression;
  recordingMode: RecordingMode;
  motionActivityPct: number;
  retentionDays: number;
  usePoe: boolean;
  installBufferPct: number;
  clientName: string;
  siteName: string;
  notes: string;
}

export interface CatalogCamera {
  id: string;
  brand: string;
  model: string;
  type: CameraType;
  environment: Environment;
  resolutionMp: number;
  lowLight: boolean;
  poeWatts: number;
  priceUsd: number;
}

export interface CatalogNvr {
  id: string;
  brand: string;
  model: string;
  channels: number;
  poePorts: number;
  poeBudgetW: number;
  maxHddBays: number;
  priceUsd: number;
}

export interface CatalogHdd {
  id: string;
  brand: string;
  model: string;
  capacityTb: number;
  priceUsd: number;
}

export interface CatalogCable {
  id: string;
  brand: string;
  model: string;
  type: CableType;
  spoolLengthM: number;
  priceUsdPerSpool: number;
}

export interface CatalogPoeSwitch {
  id: string;
  brand: string;
  model: string;
  ports: number;
  poeBudgetW: number;
  priceUsd: number;
}

export interface CctvCatalog {
  cameras: CatalogCamera[];
  nvrs: CatalogNvr[];
  hdds: CatalogHdd[];
  cables: CatalogCable[];
  poeSwitches: CatalogPoeSwitch[];
}

export interface BomLine {
  label: string;
  detail: string;
  qty: number;
  unitPriceUsd: number;
  totalUsd: number;
}

export interface CctvWarning {
  level: 'info' | 'warn' | 'critical';
  message: string;
}

export interface CctvDesignResult {
  cameraCount: number;
  cameraLines: { camera: CatalogCamera; qty: number }[];

  totalBitrateMbps: number;
  dailyStorageGb: number;
  totalStorageTb: number;

  nvr: CatalogNvr;
  hdd: CatalogHdd;
  hddCount: number;

  totalPoeW: number;
  poeSwitch: CatalogPoeSwitch | null;

  cable: CatalogCable;
  totalCableLengthM: number;
  cableSpoolsNeeded: number;

  bom: BomLine[];
  equipmentTotalUsd: number;
  installBufferUsd: number;
  totalUsd: number;

  warnings: CctvWarning[];
}
