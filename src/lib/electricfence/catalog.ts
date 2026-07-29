import type { CatalogEnergizer, CatalogWire, CatalogPost, CatalogMonitor, CatalogBackupBattery, CatalogFenceAccessory } from './types';

// Curated, representative equipment catalog with indicative USD pricing for the
// Southern African security-fencing market. Placeholders for sizing purposes,
// not live supplier quotes.

// Energizers ship standard with a 12V 7Ah backup battery and built-in siren.
export const ENERGIZERS: CatalogEnergizer[] = [
  { id: 'nrg-1j', brand: 'Nemtek', model: 'Alpha AS1000 (1J)', joulesOutput: 1, maxFenceKm: 4, currentDrawA: 0.1, voltageOptions: [12], bundledBatteryAh: 7, bundledSiren: true, priceUsd: 75 },
  { id: 'nrg-3j', brand: 'Nemtek', model: 'AS3000 (3J)', joulesOutput: 3, maxFenceKm: 10, currentDrawA: 0.15, voltageOptions: [12], bundledBatteryAh: 7, bundledSiren: true, priceUsd: 145 },
  { id: 'nrg-wizard-j4', brand: 'Nemtek', model: 'Wizard J4 (4J)', joulesOutput: 4, maxFenceKm: 12, currentDrawA: 0.18, voltageOptions: [12], bundledBatteryAh: 7, bundledSiren: true, priceUsd: 185 },
  { id: 'nrg-6j', brand: 'Stafix', model: 'X6 (6J)', joulesOutput: 6, maxFenceKm: 20, currentDrawA: 0.2, voltageOptions: [12], bundledBatteryAh: 7, bundledSiren: true, priceUsd: 260 },
  { id: 'nrg-wizard-j8', brand: 'Nemtek', model: 'Wizard J8 (8J)', joulesOutput: 8, maxFenceKm: 24, currentDrawA: 0.25, voltageOptions: [12], bundledBatteryAh: 7, bundledSiren: true, priceUsd: 340 },
  { id: 'nrg-10j', brand: 'Nemtek', model: 'AS10000 (10J)', joulesOutput: 10, maxFenceKm: 30, currentDrawA: 0.28, voltageOptions: [12, 24], bundledBatteryAh: 7, bundledSiren: true, priceUsd: 420 },
  { id: 'nrg-15j', brand: 'Stafix', model: 'XM10 (15J)', joulesOutput: 15, maxFenceKm: 45, currentDrawA: 0.35, voltageOptions: [12, 24], bundledBatteryAh: 7, bundledSiren: true, priceUsd: 650 },
];

export const WIRES: CatalogWire[] = [
  { id: 'wire-ht', brand: 'Cyclone', model: '2.5mm Galvanised High-Tensile', type: 'HT_WIRE', ohmsPerKm: 2.0, spoolLengthM: 500, priceUsdPerSpool: 45 },
  { id: 'wire-braid', brand: 'Nemtek', model: '6-Strand Conductive Braid', type: 'BRAIDED_WIRE', ohmsPerKm: 15, spoolLengthM: 200, priceUsdPerSpool: 38 },
];

export const POSTS: CatalogPost[] = [
  { id: 'post-steel', brand: 'SmartTech', model: 'Steel Y-Standard 1.8m', material: 'STEEL', shape: 'STANDARD', heightM: 1.8, insulatorsIncluded: false, priceUsd: 6.5 },
  { id: 'post-square-straight', brand: 'SmartTech', model: 'Square Tube Post — Straight 1.8m (bobbins fitted)', material: 'STEEL', shape: 'SQUARE_STRAIGHT', heightM: 1.8, insulatorsIncluded: true, priceUsd: 8.9 },
  { id: 'post-square-bend', brand: 'SmartTech', model: 'Square Tube Post — Bend 1.8m (bobbins fitted)', material: 'STEEL', shape: 'SQUARE_BEND', heightM: 1.8, insulatorsIncluded: true, priceUsd: 9.8 },
  { id: 'post-timber', brand: 'SmartTech', model: 'Treated Gum Pole 2.1m', material: 'TIMBER', shape: 'STANDARD', heightM: 2.1, insulatorsIncluded: false, priceUsd: 4.2 },
  { id: 'post-concrete', brand: 'SmartTech', model: 'Precast Concrete 2.1m', material: 'CONCRETE', shape: 'STANDARD', heightM: 2.1, insulatorsIncluded: false, priceUsd: 9.8 },
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

export const FENCE_ACCESSORIES: CatalogFenceAccessory[] = [
  { id: 'acc-spring-light', category: 'COMPRESSION_SPRING', brand: 'Nemtek', model: 'Compression Spring', spec: 'Light-duty', priceUsd: 1.8 },
  { id: 'acc-spring-heavy', category: 'COMPRESSION_SPRING', brand: 'Nemtek', model: 'Compression Spring', spec: 'Heavy-duty', priceUsd: 2.6 },
  { id: 'acc-hook-line', category: 'HOOK', brand: 'Nemtek', model: 'Line Hook', spec: 'Standard', priceUsd: 0.6 },
  { id: 'acc-hook-gate', category: 'HOOK', brand: 'Nemtek', model: 'Insulated Gate Hook', spec: 'Spring-loaded', priceUsd: 3.5 },
  { id: 'acc-ferrule-copper', category: 'COPPER_FERRULE', brand: 'Nemtek', model: 'Copper Ferrule', spec: '2.5mm wire', priceUsd: 0.25 },
  { id: 'acc-light-solar', category: 'FENCE_LIGHT', brand: 'Nemtek', model: 'Solar Fence Light', spec: 'Flashing, dusk-to-dawn', priceUsd: 14 },
  { id: 'acc-light-strobe', category: 'FENCE_LIGHT', brand: 'Nemtek', model: 'Strobe Warning Light', spec: '12V, energizer-triggered', priceUsd: 22 },
  { id: 'acc-diverter-basic', category: 'LIGHTNING_DIVERTER', brand: 'Nemtek', model: 'Lightning Diverter', spec: 'Standard, single fence line', priceUsd: 18 },
  { id: 'acc-diverter-heavy', category: 'LIGHTNING_DIVERTER', brand: 'Nemtek', model: 'Lightning Diverter', spec: 'Heavy-duty, multi-strand', priceUsd: 28 },
  { id: 'acc-warning-sign', category: 'OTHER', brand: 'SmartTech', model: 'Electric Fence Warning Sign', spec: 'Regulatory, weatherproof', priceUsd: 2.2 },
];
