import type { CatalogPanel, CatalogBattery, CatalogInverter, CatalogController } from './types';

// Curated, representative equipment catalog with indicative USD pricing for the
// Southern African market. Swap for a live/admin-managed catalog in production —
// prices here are placeholders for sizing purposes, not live supplier quotes.

export const PANELS: CatalogPanel[] = [
  { id: 'panel-330', brand: 'Longi', model: 'LR4-330M (330W)', wattage: 330, vmp: 33.4, imp: 9.88, voc: 40.4, isc: 10.5, priceUsd: 95 },
  { id: 'panel-450', brand: 'Jinko', model: 'Tiger Pro 450W', wattage: 450, vmp: 41.7, imp: 10.8, voc: 49.8, isc: 11.4, priceUsd: 118 },
  { id: 'panel-550', brand: 'Canadian Solar', model: 'HiKu6 550W', wattage: 550, vmp: 41.7, imp: 13.2, voc: 49.9, isc: 13.9, priceUsd: 138 },
  { id: 'panel-585', brand: 'Jinko', model: 'Tiger Neo N-Type 585W', wattage: 585, vmp: 43.9, imp: 13.3, voc: 52.1, isc: 14.1, priceUsd: 149 },
];

export const BATTERIES: CatalogBattery[] = [
  { id: 'batt-lfp-100', brand: 'SmartTech Power', model: 'LiFePO4 12V 100Ah', chemistry: 'LFP', voltage: 12, ah: 100, maxDodPct: 0.9, roundTripEff: 0.96, cycleLife: 6000, priceUsd: 380 },
  { id: 'batt-lfp-200-24', brand: 'SmartTech Power', model: 'LiFePO4 24V 200Ah', chemistry: 'LFP', voltage: 24, ah: 200, maxDodPct: 0.9, roundTripEff: 0.96, cycleLife: 6000, priceUsd: 1350 },
  { id: 'batt-lfp-100-48', brand: 'Pylontech', model: 'US5000 48V 100Ah (5.12kWh)', chemistry: 'LFP', voltage: 48, ah: 100, maxDodPct: 0.9, roundTripEff: 0.96, cycleLife: 6000, priceUsd: 1450 },
  { id: 'batt-agm-200', brand: 'Trojan', model: 'AGM 12V 200Ah', chemistry: 'AGM', voltage: 12, ah: 200, maxDodPct: 0.5, roundTripEff: 0.85, cycleLife: 900, priceUsd: 320 },
  { id: 'batt-gel-200', brand: 'Victron', model: 'Gel 12V 200Ah', chemistry: 'GEL', voltage: 12, ah: 200, maxDodPct: 0.5, roundTripEff: 0.85, cycleLife: 1200, priceUsd: 360 },
  { id: 'batt-flooded-220', brand: 'Exide', model: 'Flooded 12V 220Ah', chemistry: 'FLOODED', voltage: 12, ah: 220, maxDodPct: 0.5, roundTripEff: 0.8, cycleLife: 500, priceUsd: 210 },
];

export const INVERTERS: CatalogInverter[] = [
  { id: 'inv-og-1k-12', brand: 'Growatt', model: 'Off-grid 1kVA 12V', type: 'OFF_GRID', continuousW: 1000, surgeW: 2000, voltageOptions: [12], mpptBuiltIn: false, efficiencyPct: 0.9, priceUsd: 160 },
  { id: 'inv-og-3k-24', brand: 'Growatt', model: 'Off-grid 3kVA 24V', type: 'OFF_GRID', continuousW: 3000, surgeW: 6000, voltageOptions: [24], mpptBuiltIn: false, efficiencyPct: 0.92, priceUsd: 420 },
  { id: 'inv-hyb-5k-48', brand: 'Deye', model: 'Hybrid 5kW 48V (built-in MPPT)', type: 'HYBRID', continuousW: 5000, surgeW: 10000, voltageOptions: [48], mpptBuiltIn: true, efficiencyPct: 0.97, priceUsd: 1150 },
  { id: 'inv-hyb-8k-48', brand: 'Deye', model: 'Hybrid 8kW 48V (built-in MPPT)', type: 'HYBRID', continuousW: 8000, surgeW: 16000, voltageOptions: [48], mpptBuiltIn: true, efficiencyPct: 0.97, priceUsd: 1650 },
  { id: 'inv-hyb-12k-48', brand: 'Deye', model: 'Hybrid 12kW 48V (built-in MPPT)', type: 'HYBRID', continuousW: 12000, surgeW: 24000, voltageOptions: [48], mpptBuiltIn: true, efficiencyPct: 0.97, priceUsd: 2350 },
  { id: 'inv-gt-5k', brand: 'Huawei', model: 'SUN2000 Grid-Tie 5kW', type: 'GRID_TIE', continuousW: 5000, surgeW: 5500, voltageOptions: [48], mpptBuiltIn: true, efficiencyPct: 0.98, priceUsd: 980 },
  { id: 'inv-gt-10k', brand: 'Huawei', model: 'SUN2000 Grid-Tie 10kW', type: 'GRID_TIE', continuousW: 10000, surgeW: 11000, voltageOptions: [48], mpptBuiltIn: true, efficiencyPct: 0.98, priceUsd: 1780 },
];

export const CONTROLLERS: CatalogController[] = [
  { id: 'ctrl-pwm-30', brand: 'EPever', model: 'PWM 30A', type: 'PWM', maxAmps: 30, maxPvVoltage: 50, priceUsd: 35 },
  { id: 'ctrl-mppt-40', brand: 'Victron', model: 'SmartSolar MPPT 100/40', type: 'MPPT', maxAmps: 40, maxPvVoltage: 100, priceUsd: 210 },
  { id: 'ctrl-mppt-60', brand: 'Victron', model: 'SmartSolar MPPT 150/60', type: 'MPPT', maxAmps: 60, maxPvVoltage: 150, priceUsd: 340 },
  { id: 'ctrl-mppt-100', brand: 'Victron', model: 'SmartSolar MPPT 150/100', type: 'MPPT', maxAmps: 100, maxPvVoltage: 150, priceUsd: 560 },
];
