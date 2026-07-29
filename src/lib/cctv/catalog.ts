import type { CatalogCamera, CatalogNvr, CatalogHdd, CatalogCable, CatalogPoeSwitch, CatalogAccessory } from './types';

// Curated, representative equipment catalog with indicative USD pricing for the
// Southern African market. Placeholders for sizing purposes, not live supplier quotes.

export const CAMERAS: CatalogCamera[] = [
  // IP cameras (PoE, NVR)
  { id: 'cam-dome-2mp', brand: 'Hikvision', model: 'DS-2CD1123G0 Dome 2MP', systemType: 'IP', type: 'DOME', environment: 'INDOOR', resolutionMp: 2, lowLight: false, poeWatts: 6, priceUsd: 38 },
  { id: 'cam-dome-4mp', brand: 'Hikvision', model: 'DS-2CD1143G0 Dome 4MP', systemType: 'IP', type: 'DOME', environment: 'INDOOR', resolutionMp: 4, lowLight: false, poeWatts: 7, priceUsd: 52 },
  { id: 'cam-bullet-8mp', brand: 'Hikvision', model: 'DS-2CD2T87 Bullet 8MP (4K)', systemType: 'IP', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 8, lowLight: false, poeWatts: 10, priceUsd: 110 },
  { id: 'cam-ptz-4mp', brand: 'Hikvision', model: 'DS-2DE4425 PTZ 4MP', systemType: 'IP', type: 'PTZ', environment: 'OUTDOOR', resolutionMp: 4, lowLight: false, poeWatts: 30, priceUsd: 420 },
  { id: 'cam-turret-4mp', brand: 'Dahua', model: 'IPC-HDW2439 Turret 4MP', systemType: 'IP', type: 'TURRET', environment: 'OUTDOOR', resolutionMp: 4, lowLight: false, poeWatts: 7, priceUsd: 55 },
  { id: 'cam-bullet-4mp', brand: 'Dahua', model: 'IPC-HFW2439 Bullet 4MP', systemType: 'IP', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 4, lowLight: false, poeWatts: 8, priceUsd: 58 },
  { id: 'cam-bullet-4mp-ll', brand: 'Dahua', model: 'IPC-HFW2439S Starlight 4MP', systemType: 'IP', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 4, lowLight: true, poeWatts: 9, priceUsd: 78 },

  // Analog cameras (Turbo HD / HDCVI over coax, DVR)
  { id: 'cam-an-dome-2mp', brand: 'Hikvision', model: 'DS-2CE56D0T Turbo HD Dome 2MP', systemType: 'ANALOG', type: 'DOME', environment: 'INDOOR', resolutionMp: 2, lowLight: false, poeWatts: 0, priceUsd: 22 },
  { id: 'cam-an-bullet-2mp', brand: 'Hikvision', model: 'DS-2CE16D0T Turbo HD Bullet 2MP', systemType: 'ANALOG', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 2, lowLight: false, poeWatts: 0, priceUsd: 26 },
  { id: 'cam-an-bullet-5mp', brand: 'Hikvision', model: 'DS-2CE16H0T Turbo HD Bullet 5MP', systemType: 'ANALOG', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 5, lowLight: true, poeWatts: 0, priceUsd: 40 },
  { id: 'cam-an-dome-2mp-dahua', brand: 'Dahua', model: 'HAC-HDW1200 HDCVI Dome 2MP', systemType: 'ANALOG', type: 'DOME', environment: 'INDOOR', resolutionMp: 2, lowLight: false, poeWatts: 0, priceUsd: 20 },
  { id: 'cam-an-bullet-2mp-dahua', brand: 'Dahua', model: 'HAC-HFW1200 HDCVI Bullet 2MP', systemType: 'ANALOG', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 2, lowLight: false, poeWatts: 0, priceUsd: 24 },
  { id: 'cam-an-bullet-5mp-dahua', brand: 'Dahua', model: 'HAC-HFW1500 HDCVI Bullet 5MP Starlight', systemType: 'ANALOG', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 5, lowLight: true, poeWatts: 0, priceUsd: 42 },
];

export const NVRS: CatalogNvr[] = [
  // IP NVRs (PoE)
  { id: 'nvr-4ch', brand: 'Hikvision', model: 'DS-7604NI-K1 4CH PoE NVR', systemType: 'IP', channels: 4, poePorts: 4, poeBudgetW: 48, maxHddBays: 1, priceUsd: 95 },
  { id: 'nvr-8ch', brand: 'Hikvision', model: 'DS-7608NI-K2 8CH PoE NVR', systemType: 'IP', channels: 8, poePorts: 8, poeBudgetW: 96, maxHddBays: 2, priceUsd: 175 },
  { id: 'nvr-16ch', brand: 'Dahua', model: 'NVR4216-16P 16CH PoE NVR', systemType: 'IP', channels: 16, poePorts: 16, poeBudgetW: 150, maxHddBays: 2, priceUsd: 320 },
  { id: 'nvr-32ch', brand: 'Dahua', model: 'NVR5432-16P 32CH NVR', systemType: 'IP', channels: 32, poePorts: 16, poeBudgetW: 200, maxHddBays: 4, priceUsd: 650 },

  // Analog DVRs
  { id: 'dvr-4ch-hik', brand: 'Hikvision', model: 'DS-7204HUHI 4CH Turbo HD DVR', systemType: 'ANALOG', channels: 4, poePorts: 0, poeBudgetW: 0, maxHddBays: 1, priceUsd: 70 },
  { id: 'dvr-8ch-hik', brand: 'Hikvision', model: 'DS-7208HUHI 8CH Turbo HD DVR', systemType: 'ANALOG', channels: 8, poePorts: 0, poeBudgetW: 0, maxHddBays: 1, priceUsd: 115 },
  { id: 'dvr-4ch', brand: 'Dahua', model: 'XVR1B04 4CH Analog', systemType: 'ANALOG', channels: 4, poePorts: 0, poeBudgetW: 0, maxHddBays: 1, priceUsd: 65 },
  { id: 'dvr-8ch', brand: 'Dahua', model: 'XVR1B08 8CH Analog', systemType: 'ANALOG', channels: 8, poePorts: 0, poeBudgetW: 0, maxHddBays: 1, priceUsd: 110 },
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

export const ACCESSORIES: CatalogAccessory[] = [
  { id: 'acc-cabinet-6u', category: 'CABINET', brand: 'SmartTech', model: 'Wall-mount Network Cabinet', spec: '6U', priceUsd: 65 },
  { id: 'acc-cabinet-9u', category: 'CABINET', brand: 'SmartTech', model: 'Wall-mount Network Cabinet', spec: '9U', priceUsd: 85 },
  { id: 'acc-cabinet-12u', category: 'CABINET', brand: 'SmartTech', model: 'Floor-standing Network Cabinet', spec: '12U', priceUsd: 150 },
  { id: 'acc-cabinet-22u', category: 'CABINET', brand: 'SmartTech', model: 'Floor-standing Network Cabinet', spec: '22U', priceUsd: 260 },

  { id: 'acc-monitor-19', category: 'MONITOR', brand: 'Hikvision', model: 'LED Monitor', spec: '19"', priceUsd: 75 },
  { id: 'acc-monitor-24', category: 'MONITOR', brand: 'Hikvision', model: 'LED Monitor', spec: '24"', priceUsd: 110 },
  { id: 'acc-monitor-32', category: 'MONITOR', brand: 'Samsung', model: 'LED Monitor', spec: '32"', priceUsd: 180 },
  { id: 'acc-monitor-43', category: 'MONITOR', brand: 'Samsung', model: 'LED TV/Monitor', spec: '43"', priceUsd: 320 },
  { id: 'acc-monitor-55', category: 'MONITOR', brand: 'LG', model: 'LED TV/Monitor', spec: '55"', priceUsd: 480 },
  { id: 'acc-monitor-65', category: 'MONITOR', brand: 'LG', model: 'LED TV/Monitor', spec: '65"', priceUsd: 650 },
  { id: 'acc-monitor-75', category: 'MONITOR', brand: 'LG', model: 'LED Video Wall Display', spec: '75"', priceUsd: 950 },
  { id: 'acc-monitor-80', category: 'MONITOR', brand: 'LG', model: 'LED Video Wall Display', spec: '80"', priceUsd: 1150 },

  { id: 'acc-hdmi-3m', category: 'HDMI_CABLE', brand: 'SmartTech', model: 'HDMI Cable', spec: '3m', priceUsd: 6 },
  { id: 'acc-hdmi-5m', category: 'HDMI_CABLE', brand: 'SmartTech', model: 'HDMI Cable', spec: '5m', priceUsd: 9 },
  { id: 'acc-hdmi-10m', category: 'HDMI_CABLE', brand: 'SmartTech', model: 'HDMI Cable', spec: '10m', priceUsd: 16 },

  { id: 'acc-hdmi-split-2', category: 'HDMI_SPLITTER', brand: 'SmartTech', model: 'HDMI Splitter', spec: '2-port', priceUsd: 18 },
  { id: 'acc-hdmi-split-4', category: 'HDMI_SPLITTER', brand: 'SmartTech', model: 'HDMI Splitter', spec: '4-port', priceUsd: 32 },
  { id: 'acc-hdmi-split-8', category: 'HDMI_SPLITTER', brand: 'SmartTech', model: 'HDMI Splitter', spec: '8-port', priceUsd: 58 },

  { id: 'acc-ups', category: 'OTHER', brand: 'SmartTech', model: 'UPS Backup Unit', spec: '650VA', priceUsd: 55 },
  { id: 'acc-surge', category: 'OTHER', brand: 'SmartTech', model: 'Surge Protector', spec: '4-way', priceUsd: 15 },
];
