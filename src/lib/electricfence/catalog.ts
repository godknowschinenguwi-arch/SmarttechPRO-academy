import type { CatalogEnergizer, CatalogWire, CatalogPost, CatalogMonitor, CatalogBackupBattery } from './types';

// Curated, representative equipment catalog with indicative USD pricing for the
// Southern African security-fencing market. Placeholders for sizing purposes,
// not live supplier quotes.

export const ENERGIZERS: CatalogEnergizer[] = [
  { id: 'nrg-1j', brand: 'Nemtek', model: 'Alpha AS1000 (1J)', joulesOutput: 1, maxFenceKm: 4, currentDrawA: 0.1, voltageOptions: [12], priceUsd: 75 },
  { id: 'nrg-3j', brand: 'Nemtek', model: 'AS3000 (3J)', joulesOutput: 3, maxFenceKm: 10, currentDrawA: 0.15, voltageOptions: [12], priceUsd: 145 },
  { id: 'nrg-6j', brand: 'Stafix', model: 'X6 (6J)', joulesOutput: 6, maxFenceKm: 20, currentDrawA: 0.2, voltageOptions: [12], priceUsd: 260 },
  { id: 'nrg-10j', brand: 'Nemtek', model: 'AS10000 (10J)', joulesOutput: 10, maxFenceKm: 30, currentDrawA: 0.28, voltageOptions: [12, 24], priceUsd: 420 },
  { id: 'nrg-15j', brand: 'Stafix', model: 'XM10 (15J)', joulesOutput: 15, maxFenceKm: 45, currentDrawA: 0.35, voltageOptions: [12, 24], priceUsd: 650 },
];

export const WIRES: CatalogWire[] = [
  { id: 'wire-ht', brand: 'Cyclone', model: '2.5mm Galvanised High-Tensile', type: 'HT_WIRE', ohmsPerKm: 2.0, spoolLengthM: 500, priceUsdPerSpool: 45 },
  { id: 'wire-braid', brand: 'Nemtek', model: '6-Strand Conductive Braid', type: 'BRAIDED_WIRE', ohmsPerKm: 15, spoolLengthM: 200, priceUsdPerSpool: 38 },
];

export const POSTS: CatalogPost[] = [
  { id: 'post-steel', brand: 'SmartTech', model: 'Steel Y-Standard 1.8m', material: 'STEEL', heightM: 1.8, priceUsd: 6.5 },
  { id: 'post-timber', brand: 'SmartTech', model: 'Treated Gum Pole 2.1m', material: 'TIMBER', heightM: 2.1, priceUsd: 4.2 },
  { id: 'post-concrete', brand: 'SmartTech', model: 'Precast Concrete 2.1m', material: 'CONCRETE', heightM: 2.1, priceUsd: 9.8 },
];

export const MONITORS: CatalogMonitor[] = [
  { id: 'mon-4z', brand: 'Nemtek', model: '4-Zone LCD Monitor', maxZones: 4, gsmCapable: false, priceUsd: 180 },
  { id: 'mon-8z', brand: 'Nemtek', model: '8-Zone LCD Monitor + GSM', maxZones: 8, gsmCapable: true, priceUsd: 340 },
  { id: 'mon-16z', brand: 'Stafix', model: '16-Zone Monitor + GSM + Siren', maxZones: 16, gsmCapable: true, priceUsd: 520 },
];

export const BATTERIES: CatalogBackupBattery[] = [
  { id: 'batt-7', brand: 'SmartTech Power', model: 'SLA 12V 7Ah', voltage: 12, ah: 7, priceUsd: 22 },
  { id: 'batt-18', brand: 'SmartTech Power', model: 'SLA 12V 18Ah', voltage: 12, ah: 18, priceUsd: 42 },
  { id: 'batt-38', brand: 'SmartTech Power', model: 'SLA 12V 38Ah', voltage: 12, ah: 38, priceUsd: 78 },
];
