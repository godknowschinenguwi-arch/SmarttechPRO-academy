import type { CatalogCable, CatalogConduit, CatalogDistributionBoard, CatalogBreaker, CatalogWiringAccessory } from './types';

// Curated, representative equipment catalog with indicative USD pricing for the
// Southern African market. Placeholders for sizing purposes, not live supplier
// quotes — ampacity figures are typical values for PVC-insulated copper
// conductor in conduit, not a substitute for a proper cable sizing calculation.

export const CABLES: CatalogCable[] = [
  { id: 'cable-1.5', brand: 'SmartTech', model: '1.5mm² Twin & Earth PVC', csaMm2: 1.5, maxCurrentA: 17.5, spoolLengthM: 100, priceUsdPerSpool: 45 },
  { id: 'cable-2.5', brand: 'SmartTech', model: '2.5mm² Twin & Earth PVC', csaMm2: 2.5, maxCurrentA: 24, spoolLengthM: 100, priceUsdPerSpool: 68 },
  { id: 'cable-4', brand: 'SmartTech', model: '4mm² Twin & Earth PVC', csaMm2: 4, maxCurrentA: 32, spoolLengthM: 100, priceUsdPerSpool: 105 },
  { id: 'cable-6', brand: 'SmartTech', model: '6mm² Twin & Earth PVC', csaMm2: 6, maxCurrentA: 41, spoolLengthM: 50, priceUsdPerSpool: 95 },
  { id: 'cable-10', brand: 'SmartTech', model: '10mm² Twin & Earth PVC', csaMm2: 10, maxCurrentA: 57, spoolLengthM: 50, priceUsdPerSpool: 155 },
];

export const CONDUITS: CatalogConduit[] = [
  { id: 'conduit-20', brand: 'SmartTech', model: '20mm PVC Conduit', diameterMm: 20, lengthM: 3, priceUsdPerLength: 2.2 },
  { id: 'conduit-25', brand: 'SmartTech', model: '25mm PVC Conduit', diameterMm: 25, lengthM: 3, priceUsdPerLength: 2.8 },
  { id: 'conduit-32', brand: 'SmartTech', model: '32mm PVC Conduit', diameterMm: 32, lengthM: 3, priceUsdPerLength: 3.6 },
];

export const BOARDS: CatalogDistributionBoard[] = [
  { id: 'db-4', brand: 'CBI', model: '4-Way Distribution Board', ways: 4, priceUsd: 28 },
  { id: 'db-6', brand: 'CBI', model: '6-Way Distribution Board', ways: 6, priceUsd: 38 },
  { id: 'db-8', brand: 'CBI', model: '8-Way Distribution Board', ways: 8, priceUsd: 48 },
  { id: 'db-12', brand: 'CBI', model: '12-Way Distribution Board', ways: 12, priceUsd: 68 },
  { id: 'db-18', brand: 'CBI', model: '18-Way Distribution Board', ways: 18, priceUsd: 95 },
  { id: 'db-24', brand: 'CBI', model: '24-Way Distribution Board', ways: 24, priceUsd: 130 },
];

export const BREAKERS: CatalogBreaker[] = [
  { id: 'mcb-10', brand: 'CBI', model: 'MCB 10A', type: 'MCB', ampRating: 10, priceUsd: 6.5 },
  { id: 'mcb-16', brand: 'CBI', model: 'MCB 16A', type: 'MCB', ampRating: 16, priceUsd: 6.5 },
  { id: 'mcb-20', brand: 'CBI', model: 'MCB 20A', type: 'MCB', ampRating: 20, priceUsd: 7 },
  { id: 'mcb-25', brand: 'CBI', model: 'MCB 25A', type: 'MCB', ampRating: 25, priceUsd: 7.5 },
  { id: 'mcb-32', brand: 'CBI', model: 'MCB 32A', type: 'MCB', ampRating: 32, priceUsd: 8.5 },
  { id: 'mcb-40', brand: 'CBI', model: 'MCB 40A', type: 'MCB', ampRating: 40, priceUsd: 10 },
  { id: 'mcb-63', brand: 'CBI', model: 'MCB 63A', type: 'MCB', ampRating: 63, priceUsd: 14 },
  { id: 'rcd-63', brand: 'CBI', model: 'RCD Earth Leakage Unit 63A/30mA', type: 'RCD', ampRating: 63, priceUsd: 32 },
  { id: 'iso-63', brand: 'CBI', model: 'Main Isolator 63A', type: 'ISOLATOR', ampRating: 63, priceUsd: 18 },
];

export const ACCESSORIES: CatalogWiringAccessory[] = [
  { id: 'sw-1lever', category: 'SWITCH', brand: 'SmartTech', model: 'Light Switch', spec: '1-lever', priceUsd: 3.2 },
  { id: 'sw-2lever', category: 'SWITCH', brand: 'SmartTech', model: 'Light Switch', spec: '2-lever', priceUsd: 4.8 },
  { id: 'sw-3lever', category: 'SWITCH', brand: 'SmartTech', model: 'Light Switch', spec: '3-lever', priceUsd: 6.5 },
  { id: 'sock-single', category: 'SOCKET_OUTLET', brand: 'SmartTech', model: 'Socket Outlet', spec: 'Single, RSA 3-pin', priceUsd: 3.8 },
  { id: 'sock-double', category: 'SOCKET_OUTLET', brand: 'SmartTech', model: 'Socket Outlet', spec: 'Double, RSA 3-pin', priceUsd: 5.5 },
  { id: 'light-batten', category: 'LIGHT_FITTING', brand: 'SmartTech', model: 'Batten Holder', spec: 'Indoor, ceiling-mount', priceUsd: 2.5 },
  { id: 'light-bulkhead', category: 'LIGHT_FITTING', brand: 'SmartTech', model: 'Bulkhead Fitting', spec: 'Outdoor, weatherproof', priceUsd: 8.5 },
  { id: 'jbox-std', category: 'JUNCTION_BOX', brand: 'SmartTech', model: 'Junction Box', spec: 'Standard PVC', priceUsd: 1.2 },
  { id: 'saddle-pack', category: 'OTHER', brand: 'SmartTech', model: 'Conduit Saddles', spec: 'Pack of 20', priceUsd: 3.5 },
  { id: 'connector-strip', category: 'OTHER', brand: 'SmartTech', model: 'Connector Strip', spec: '12-way', priceUsd: 1.8 },
  { id: 'spd-type2', category: 'OTHER', brand: 'CBI', model: 'Surge Protection Device (SPD)', spec: 'Type 2, DIN rail', priceUsd: 45 },
];
