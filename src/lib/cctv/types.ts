// SmartTech CCTV Calculator — shared domain types.

export type CameraType = 'DOME' | 'BULLET' | 'TURRET' | 'PTZ';
export type Environment = 'INDOOR' | 'OUTDOOR';
export type RecordingMode = 'CONTINUOUS' | 'MOTION';
export type Compression = 'H264' | 'H265';
export type CableType = 'CAT6' | 'COAX_POWER';
export type SystemType = 'IP' | 'ANALOG';
export type AccessoryCategory = 'CABINET' | 'MONITOR' | 'HDMI_CABLE' | 'HDMI_SPLITTER' | 'OTHER';

// A brand filter of 'ANY' leaves camera/NVR selection unrestricted; any other
// value locks camera + NVR picks to that exact brand so a system never mixes
// e.g. Hikvision cameras with a Dahua NVR.
export const ANY_BRAND = 'ANY';

export interface CameraPoint {
  id: string;
  name: string;
  type: CameraType;
  environment: Environment;
  resolutionMp: number;
  distanceFromNvrM: number;
  lowLight: boolean;
}

export interface SelectedAccessory {
  id: string;
  qty: number;
}

export interface CctvConfig {
  systemType: SystemType;
  brand: string; // ANY_BRAND or an exact brand to lock cameras + NVR to
  frameRate: number;
  compression: Compression;
  recordingMode: RecordingMode;
  motionActivityPct: number;
  retentionDays: number;
  installBufferPct: number;
  clientName: string;
  siteName: string;
  notes: string;
  accessories: SelectedAccessory[];
}

export interface CatalogCamera {
  id: string;
  brand: string;
  model: string;
  systemType: SystemType;
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
  systemType: SystemType;
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

export interface CatalogAccessory {
  id: string;
  category: AccessoryCategory;
  brand: string;
  model: string;
  spec: string; // e.g. monitor size ("32\""), cabinet U-size, cable length
  priceUsd: number;
}

export interface CctvCatalog {
  cameras: CatalogCamera[];
  nvrs: CatalogNvr[];
  hdds: CatalogHdd[];
  cables: CatalogCable[];
  poeSwitches: CatalogPoeSwitch[];
  accessories: CatalogAccessory[];
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

export interface CctvScenario {
  id: string;
  name: string;
  createdAt: string;
  points: CameraPoint[];
  config: CctvConfig;
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
