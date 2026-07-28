import type { CatalogCamera, CatalogNvr, CatalogHdd, CatalogCable, CatalogPoeSwitch } from './types';

// Curated, representative equipment catalog with indicative USD pricing for the
// Southern African market. Placeholders for sizing purposes, not live supplier quotes.

export const CAMERAS: CatalogCamera[] = [
  { id: 'cam-dome-2mp', brand: 'Hikvision', model: 'DS-2CD1123G0 Dome 2MP', type: 'DOME', environment: 'INDOOR', resolutionMp: 2, lowLight: false, poeWatts: 6, priceUsd: 38 },
  { id: 'cam-dome-4mp', brand: 'Hikvision', model: 'DS-2CD1143G0 Dome 4MP', type: 'DOME', environment: 'INDOOR', resolutionMp: 4, lowLight: false, poeWatts: 7, priceUsd: 52 },
  { id: 'cam-turret-4mp', brand: 'Dahua', model: 'IPC-HDW2439 Turret 4MP', type: 'TURRET', environment: 'OUTDOOR', resolutionMp: 4, lowLight: false, poeWatts: 7, priceUsd: 55 },
  { id: 'cam-bullet-4mp', brand: 'Dahua', model: 'IPC-HFW2439 Bullet 4MP', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 4, lowLight: false, poeWatts: 8, priceUsd: 58 },
  { id: 'cam-bullet-4mp-ll', brand: 'Dahua', model: 'IPC-HFW2439S Starlight 4MP', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 4, lowLight: true, poeWatts: 9, priceUsd: 78 },
  { id: 'cam-bullet-8mp', brand: 'Hikvision', model: 'DS-2CD2T87 Bullet 8MP (4K)', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 8, lowLight: false, poeWatts: 10, priceUsd: 110 },
  { id: 'cam-ptz-4mp', brand: 'Hikvision', model: 'DS-2DE4425 PTZ 4MP', type: 'PTZ', environment: 'OUTDOOR', resolutionMp: 4, lowLight: false, poeWatts: 30, priceUsd: 420 },
];

export const NVRS: CatalogNvr[] = [
  { id: 'nvr-4ch', brand: 'Hikvision', model: 'DS-7604NI-K1 4CH PoE', channels: 4, poePorts: 4, poeBudgetW: 48, maxHddBays: 1, priceUsd: 95 },
  { id: 'nvr-8ch', brand: 'Hikvision', model: 'DS-7608NI-K2 8CH PoE', channels: 8, poePorts: 8, poeBudgetW: 96, maxHddBays: 2, priceUsd: 175 },
  { id: 'nvr-16ch', brand: 'Dahua', model: 'NVR4216-16P 16CH PoE', channels: 16, poePorts: 16, poeBudgetW: 150, maxHddBays: 2, priceUsd: 320 },
  { id: 'nvr-32ch', brand: 'Dahua', model: 'NVR5432-16P 32CH', channels: 32, poePorts: 16, poeBudgetW: 200, maxHddBays: 4, priceUsd: 650 },
  { id: 'dvr-4ch', brand: 'Dahua', model: 'XVR1B04 4CH Analog', channels: 4, poePorts: 0, poeBudgetW: 0, maxHddBays: 1, priceUsd: 65 },
  { id: 'dvr-8ch', brand: 'Dahua', model: 'XVR1B08 8CH Analog', channels: 8, poePorts: 0, poeBudgetW: 0, maxHddBays: 1, priceUsd: 110 },
];

export const HDDS: CatalogHdd[] = [
  { id: 'hdd-1tb', brand: 'Seagate SkyHawk', model: '1TB Surveillance', capacityTb: 1, priceUsd: 48 },
  { id: 'hdd-2tb', brand: 'Seagate SkyHawk', model: '2TB Surveillance', capacityTb: 2, priceUsd: 65 },
  { id: 'hdd-4tb', brand: 'Seagate SkyHawk', model: '4TB Surveillance', capacityTb: 4, priceUsd: 110 },
  { id: 'hdd-8tb', brand: 'Seagate SkyHawk', model: '8TB Surveillance', capacityTb: 8, priceUsd: 195 },
];

export const CABLES: CatalogCable[] = [
  { id: 'cable-cat6', brand: 'SmartTech', model: 'Cat6 UTP Outdoor', type: 'CAT6', spoolLengthM: 305, priceUsdPerSpool: 75 },
  { id: 'cable-coax', brand: 'SmartTech', model: 'RG59 Coax + Power (Siamese)', type: 'COAX_POWER', spoolLengthM: 305, priceUsdPerSpool: 95 },
];

export const POE_SWITCHES: CatalogPoeSwitch[] = [
  { id: 'poe-sw-8', brand: 'TP-Link', model: 'TL-SG1008P 8-Port PoE', ports: 8, poeBudgetW: 124, priceUsd: 85 },
  { id: 'poe-sw-16', brand: 'TP-Link', model: 'TL-SG1016PE 16-Port PoE', ports: 16, poeBudgetW: 150, priceUsd: 180 },
  { id: 'poe-sw-24', brand: 'Ubiquiti', model: 'USW-24-PoE 24-Port', ports: 24, poeBudgetW: 400, priceUsd: 420 },
];
