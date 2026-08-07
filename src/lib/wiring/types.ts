// SmartTech House Wiring & Conduit Calculator — shared domain types.

export type CircuitType = 'LIGHTING' | 'SOCKET' | 'DEDICATED';
export type ConduitMounting = 'SURFACE' | 'CHASED';
export type WiringAccessoryCategory = 'SWITCH' | 'SOCKET_OUTLET' | 'LIGHT_FITTING' | 'JUNCTION_BOX' | 'OTHER';

export interface WiringCircuit {
  id: string;
  name: string;
  type: CircuitType;
  points: number; // light points or socket outlets fed by this circuit (ignored for DEDICATED)
  dedicatedLoadW: number; // declared appliance wattage — only used when type === 'DEDICATED'
  cableRunM: number; // cable run length from the distribution board to this circuit
}

export interface WiringConfig {
  earthLeakageEnabled: boolean;
  surgeProtectionEnabled: boolean;
  conduitMounting: ConduitMounting;
  spareDbWaysPct: number; // extra DB way capacity reserved for future circuits
  installBufferPct: number;
  clientName: string;
  siteName: string;
  notes: string;
}

export interface CatalogCable {
  id: string;
  brand: string;
  model: string;
  csaMm2: number; // conductor cross-sectional area
  maxCurrentA: number; // indicative ampacity, PVC-insulated copper in conduit
  spoolLengthM: number;
  priceUsdPerSpool: number;
}

export interface CatalogConduit {
  id: string;
  brand: string;
  model: string;
  diameterMm: number;
  lengthM: number; // per stick
  priceUsdPerLength: number;
}

export interface CatalogDistributionBoard {
  id: string;
  brand: string;
  model: string;
  ways: number;
  priceUsd: number;
}

export type BreakerType = 'MCB' | 'RCD' | 'ISOLATOR';

export interface CatalogBreaker {
  id: string;
  brand: string;
  model: string;
  type: BreakerType;
  ampRating: number;
  priceUsd: number;
}

export interface CatalogWiringAccessory {
  id: string;
  category: WiringAccessoryCategory;
  brand: string;
  model: string;
  spec: string;
  priceUsd: number;
}

export interface WiringCatalog {
  cables: CatalogCable[];
  conduits: CatalogConduit[];
  boards: CatalogDistributionBoard[];
  breakers: CatalogBreaker[];
  accessories: CatalogWiringAccessory[];
}

export interface BomLine {
  label: string;
  detail: string;
  qty: number;
  unitPriceUsd: number;
  totalUsd: number;
}

export interface WiringWarning {
  level: 'info' | 'warn' | 'critical';
  message: string;
}

export interface WiringScenario {
  id: string;
  name: string;
  createdAt: string;
  circuits: WiringCircuit[];
  config: WiringConfig;
}

export interface CircuitDesignLine {
  circuit: WiringCircuit;
  cable: CatalogCable;
  breaker: CatalogBreaker;
  cableLengthM: number;
  requiredCurrentA: number;
}

export interface WiringDesignResult {
  circuitCount: number;
  circuitLines: CircuitDesignLine[];

  totalDbWays: number;
  board: CatalogDistributionBoard;

  totalCableLengthM: number;
  cableSpoolsBySize: { cable: CatalogCable; spoolsNeeded: number; lengthM: number }[];

  totalConduitLengthM: number;
  conduit: CatalogConduit;
  conduitSticksNeeded: number;

  switchCount: number;
  socketOutletCount: number;
  lightFittingCount: number;
  junctionBoxCount: number;

  earthLeakage: CatalogBreaker | null;
  mainIsolator: CatalogBreaker | null;

  bom: BomLine[];
  equipmentTotalUsd: number;
  installBufferUsd: number;
  totalUsd: number;

  warnings: WiringWarning[];
}
