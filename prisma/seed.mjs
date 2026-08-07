// SmartTech Academy — seed script (applies DDL, then seeds demo data if empty).
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { LESSON_CONTENT, QUIZ_QUESTIONS, ASSIGNMENT_BRIEFS } from './content.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
// Seeds DATABASE_URL if set (e.g. a remote Turso database on first deploy), else the local dev file.
// Idempotent: skips entirely when users already exist.
const db = createClient({
  url: process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:./')
    ? process.env.DATABASE_URL
    : `file:${path.join(here, 'dev.db')}`,
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
});
const J = JSON.stringify;

async function ins(table, data) {
  const id = data.id ?? randomUUID();
  const row = { id, ...data };
  const keys = Object.keys(row);
  const vals = keys.map((k) => {
    const v = row[k];
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (v instanceof Date) return v.toISOString();
    return v;
  });
  await db.execute({
    sql: `INSERT INTO ${table} (${keys.map((k) => `"${k}"`).join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
    args: vals,
  });
  return id;
}

// Course cover images — backfilled on every run so existing (already-seeded)
// databases pick up new/updated covers. Swap these paths for real job photos anytime.
const COVERS = {
  'cctv-installation-technician': '/covers/cctv-installation-technician.svg',
  'solar-installation-professional': '/covers/solar-installation-professional.svg',
  'networking-for-technicians': '/covers/networking-for-technicians.svg',
  'electric-fence-installation': '/covers/electric-fence-installation.svg',
  'plc-programming-fundamentals': '/covers/plc-programming-fundamentals.svg',
  'ai-cctv-computer-vision': '/covers/ai-cctv-computer-vision.svg',
  'technician-business-startup': '/covers/technician-business-startup.svg',
};

async function backfillCovers() {
  for (const [slug, url] of Object.entries(COVERS)) {
    await db.execute({ sql: 'UPDATE Course SET imageUrl = ? WHERE slug = ?', args: [url, slug] });
  }
  console.log('Course covers backfilled.');
}

// Courses without a finished curriculum yet — flagged coming soon so they stay
// visible in the catalogue but aren't open for enrollment. Runs unconditionally
// (like backfillCovers() above) so it also fixes up an already-seeded database.
const COMING_SOON_SLUGS = [
  'solar-installation-professional',
  'networking-for-technicians',
  'electric-fence-installation',
  'plc-programming-fundamentals',
  'ai-cctv-computer-vision',
  'technician-business-startup',
];

async function backfillComingSoon() {
  await db.execute('UPDATE Course SET comingSoon = 0');
  for (const slug of COMING_SOON_SLUGS) {
    await db.execute({ sql: 'UPDATE Course SET comingSoon = 1 WHERE slug = ?', args: [slug] });
  }
  console.log('Coming-soon flags backfilled.');
}

// Solar Calculator equipment catalog — seeded once with a curated default set.
// Runs unconditionally but only inserts when the table is empty, so admin
// edits/deletes made afterwards are never overwritten by a redeploy.
const SOLAR_PANELS = [
  { brand: 'Longi', model: 'LR4-330M (330W)', wattage: 330, vmp: 33.4, imp: 9.88, voc: 40.4, isc: 10.5, priceUsd: 95 },
  { brand: 'Jinko', model: 'Tiger Pro 450W', wattage: 450, vmp: 41.7, imp: 10.8, voc: 49.8, isc: 11.4, priceUsd: 118 },
  { brand: 'Canadian Solar', model: 'HiKu6 550W', wattage: 550, vmp: 41.7, imp: 13.2, voc: 49.9, isc: 13.9, priceUsd: 138 },
  { brand: 'Jinko', model: 'Tiger Neo N-Type 585W', wattage: 585, vmp: 43.9, imp: 13.3, voc: 52.1, isc: 14.1, priceUsd: 149 },
];
const SOLAR_BATTERIES = [
  { brand: 'SmartTech Power', model: 'LiFePO4 12V 100Ah', chemistry: 'LFP', voltage: 12, ah: 100, maxDodPct: 0.9, roundTripEff: 0.96, cycleLife: 6000, priceUsd: 380 },
  { brand: 'SmartTech Power', model: 'LiFePO4 24V 200Ah', chemistry: 'LFP', voltage: 24, ah: 200, maxDodPct: 0.9, roundTripEff: 0.96, cycleLife: 6000, priceUsd: 1350 },
  { brand: 'Pylontech', model: 'US5000 48V 100Ah (5.12kWh)', chemistry: 'LFP', voltage: 48, ah: 100, maxDodPct: 0.9, roundTripEff: 0.96, cycleLife: 6000, priceUsd: 1450 },
  { brand: 'Trojan', model: 'AGM 12V 200Ah', chemistry: 'AGM', voltage: 12, ah: 200, maxDodPct: 0.5, roundTripEff: 0.85, cycleLife: 900, priceUsd: 320 },
  { brand: 'Victron', model: 'Gel 12V 200Ah', chemistry: 'GEL', voltage: 12, ah: 200, maxDodPct: 0.5, roundTripEff: 0.85, cycleLife: 1200, priceUsd: 360 },
  { brand: 'Exide', model: 'Flooded 12V 220Ah', chemistry: 'FLOODED', voltage: 12, ah: 220, maxDodPct: 0.5, roundTripEff: 0.8, cycleLife: 500, priceUsd: 210 },
];
const SOLAR_INVERTERS = [
  { brand: 'Growatt', model: 'Off-grid 1kVA 12V', type: 'OFF_GRID', continuousW: 1000, surgeW: 2000, voltageOptions: J([12]), mpptBuiltIn: false, efficiencyPct: 0.9, priceUsd: 160 },
  { brand: 'Growatt', model: 'Off-grid 3kVA 24V', type: 'OFF_GRID', continuousW: 3000, surgeW: 6000, voltageOptions: J([24]), mpptBuiltIn: false, efficiencyPct: 0.92, priceUsd: 420 },
  { brand: 'Deye', model: 'Hybrid 5kW 48V (built-in MPPT)', type: 'HYBRID', continuousW: 5000, surgeW: 10000, voltageOptions: J([48]), mpptBuiltIn: true, efficiencyPct: 0.97, priceUsd: 1150 },
  { brand: 'Deye', model: 'Hybrid 8kW 48V (built-in MPPT)', type: 'HYBRID', continuousW: 8000, surgeW: 16000, voltageOptions: J([48]), mpptBuiltIn: true, efficiencyPct: 0.97, priceUsd: 1650 },
  { brand: 'Deye', model: 'Hybrid 12kW 48V (built-in MPPT)', type: 'HYBRID', continuousW: 12000, surgeW: 24000, voltageOptions: J([48]), mpptBuiltIn: true, efficiencyPct: 0.97, priceUsd: 2350 },
  { brand: 'Huawei', model: 'SUN2000 Grid-Tie 5kW', type: 'GRID_TIE', continuousW: 5000, surgeW: 5500, voltageOptions: J([48]), mpptBuiltIn: true, efficiencyPct: 0.98, priceUsd: 980 },
  { brand: 'Huawei', model: 'SUN2000 Grid-Tie 10kW', type: 'GRID_TIE', continuousW: 10000, surgeW: 11000, voltageOptions: J([48]), mpptBuiltIn: true, efficiencyPct: 0.98, priceUsd: 1780 },
];
const SOLAR_CONTROLLERS = [
  { brand: 'EPever', model: 'PWM 30A', type: 'PWM', maxAmps: 30, maxPvVoltage: 50, priceUsd: 35 },
  { brand: 'Victron', model: 'SmartSolar MPPT 100/40', type: 'MPPT', maxAmps: 40, maxPvVoltage: 100, priceUsd: 210 },
  { brand: 'Victron', model: 'SmartSolar MPPT 150/60', type: 'MPPT', maxAmps: 60, maxPvVoltage: 150, priceUsd: 340 },
  { brand: 'Victron', model: 'SmartSolar MPPT 150/100', type: 'MPPT', maxAmps: 100, maxPvVoltage: 150, priceUsd: 560 },
];

async function backfillSolarCatalog() {
  const tables = [
    ['SolarPanel', SOLAR_PANELS],
    ['SolarBattery', SOLAR_BATTERIES],
    ['SolarInverter', SOLAR_INVERTERS],
    ['SolarController', SOLAR_CONTROLLERS],
  ];
  for (const [table, rows] of tables) {
    const existing = await db.execute(`SELECT COUNT(*) AS n FROM ${table}`);
    if (Number(existing.rows[0].n) > 0) continue;
    for (const row of rows) await ins(table, { ...row, active: true });
  }
  console.log('Solar equipment catalog seeded.');
}

// Electric Fence Calculator equipment catalog — same seed-once-if-empty pattern.
// Energizers ship standard with a 12V 7Ah backup battery and built-in siren.
const FENCE_ENERGIZERS_BASE = [
  { brand: 'Nemtek', model: 'Alpha AS1000 (1J)', joulesOutput: 1, maxFenceKm: 4, currentDrawA: 0.1, voltageOptions: J([12]), bundledBatteryAh: 7, bundledSiren: true, priceUsd: 75 },
  { brand: 'Nemtek', model: 'AS3000 (3J)', joulesOutput: 3, maxFenceKm: 10, currentDrawA: 0.15, voltageOptions: J([12]), bundledBatteryAh: 7, bundledSiren: true, priceUsd: 145 },
  { brand: 'Stafix', model: 'X6 (6J)', joulesOutput: 6, maxFenceKm: 20, currentDrawA: 0.2, voltageOptions: J([12]), bundledBatteryAh: 7, bundledSiren: true, priceUsd: 260 },
  { brand: 'Nemtek', model: 'AS10000 (10J)', joulesOutput: 10, maxFenceKm: 30, currentDrawA: 0.28, voltageOptions: J([12, 24]), bundledBatteryAh: 7, bundledSiren: true, priceUsd: 420 },
  { brand: 'Stafix', model: 'XM10 (15J)', joulesOutput: 15, maxFenceKm: 45, currentDrawA: 0.35, voltageOptions: J([12, 24]), bundledBatteryAh: 7, bundledSiren: true, priceUsd: 650 },
];
const FENCE_ENERGIZERS_WIZARD = [
  { brand: 'Nemtek', model: 'Wizard J4 (4J)', joulesOutput: 4, maxFenceKm: 12, currentDrawA: 0.18, voltageOptions: J([12]), bundledBatteryAh: 7, bundledSiren: true, priceUsd: 185 },
  { brand: 'Nemtek', model: 'Wizard J8 (8J)', joulesOutput: 8, maxFenceKm: 24, currentDrawA: 0.25, voltageOptions: J([12]), bundledBatteryAh: 7, bundledSiren: true, priceUsd: 340 },
];
const FENCE_ENERGIZERS = [...FENCE_ENERGIZERS_BASE, ...FENCE_ENERGIZERS_WIZARD];

const FENCE_WIRES = [
  { brand: 'Cyclone', model: '2.5mm Galvanised High-Tensile', type: 'HT_WIRE', ohmsPerKm: 2.0, spoolLengthM: 500, priceUsdPerSpool: 45 },
  { brand: 'Nemtek', model: '6-Strand Conductive Braid', type: 'BRAIDED_WIRE', ohmsPerKm: 15, spoolLengthM: 200, priceUsdPerSpool: 38 },
];

const FENCE_POSTS_BASE = [
  { brand: 'SmartTech', model: 'Steel Y-Standard 1.8m', material: 'STEEL', shape: 'STANDARD', heightM: 1.8, insulatorsIncluded: false, priceUsd: 6.5 },
  { brand: 'SmartTech', model: 'Treated Gum Pole 2.1m', material: 'TIMBER', shape: 'STANDARD', heightM: 2.1, insulatorsIncluded: false, priceUsd: 4.2 },
  { brand: 'SmartTech', model: 'Precast Concrete 2.1m', material: 'CONCRETE', shape: 'STANDARD', heightM: 2.1, insulatorsIncluded: false, priceUsd: 9.8 },
];
const FENCE_POSTS_SQUARE_TUBE = [
  { brand: 'SmartTech', model: 'Square Tube Post — Straight 1.8m (bobbins fitted)', material: 'STEEL', shape: 'SQUARE_STRAIGHT', heightM: 1.8, insulatorsIncluded: true, priceUsd: 8.9 },
  { brand: 'SmartTech', model: 'Square Tube Post — Bend 1.8m (bobbins fitted)', material: 'STEEL', shape: 'SQUARE_BEND', heightM: 1.8, insulatorsIncluded: true, priceUsd: 9.8 },
];
const FENCE_POSTS = [...FENCE_POSTS_BASE, ...FENCE_POSTS_SQUARE_TUBE];

const FENCE_MONITORS = [
  { brand: 'Nemtek', model: '4-Zone LCD Monitor', maxZones: 4, gsmCapable: false, priceUsd: 180 },
  { brand: 'Nemtek', model: '8-Zone LCD Monitor + GSM', maxZones: 8, gsmCapable: true, priceUsd: 340 },
  { brand: 'Stafix', model: '16-Zone Monitor + GSM + Siren', maxZones: 16, gsmCapable: true, priceUsd: 520 },
];
const FENCE_BATTERIES = [
  { brand: 'SmartTech Power', model: 'SLA 12V 7Ah', voltage: 12, ah: 7, priceUsd: 22 },
  { brand: 'SmartTech Power', model: 'SLA 12V 18Ah', voltage: 12, ah: 18, priceUsd: 42 },
  { brand: 'SmartTech Power', model: 'SLA 12V 38Ah', voltage: 12, ah: 38, priceUsd: 78 },
];
const FENCE_ACCESSORIES = [
  { category: 'COMPRESSION_SPRING', brand: 'Nemtek', model: 'Compression Spring', spec: 'Light-duty', priceUsd: 1.8 },
  { category: 'COMPRESSION_SPRING', brand: 'Nemtek', model: 'Compression Spring', spec: 'Heavy-duty', priceUsd: 2.6 },
  { category: 'HOOK', brand: 'Nemtek', model: 'Line Hook', spec: 'Standard', priceUsd: 0.6 },
  { category: 'HOOK', brand: 'Nemtek', model: 'Insulated Gate Hook', spec: 'Spring-loaded', priceUsd: 3.5 },
  { category: 'COPPER_FERRULE', brand: 'Nemtek', model: 'Copper Ferrule', spec: '2.5mm wire', priceUsd: 0.25 },
  { category: 'FENCE_LIGHT', brand: 'Nemtek', model: 'Solar Fence Light', spec: 'Flashing, dusk-to-dawn', priceUsd: 14 },
  { category: 'FENCE_LIGHT', brand: 'Nemtek', model: 'Strobe Warning Light', spec: '12V, energizer-triggered', priceUsd: 22 },
  { category: 'LIGHTNING_DIVERTER', brand: 'Nemtek', model: 'Lightning Diverter', spec: 'Standard, single fence line', priceUsd: 18 },
  { category: 'LIGHTNING_DIVERTER', brand: 'Nemtek', model: 'Lightning Diverter', spec: 'Heavy-duty, multi-strand', priceUsd: 28 },
  { category: 'OTHER', brand: 'SmartTech', model: 'Electric Fence Warning Sign', spec: 'Regulatory, weatherproof', priceUsd: 2.2 },
];

async function backfillFenceCatalog() {
  const tables = [
    ['FenceEnergizer', FENCE_ENERGIZERS],
    ['FenceWire', FENCE_WIRES],
    ['FencePost', FENCE_POSTS],
    ['FenceMonitor', FENCE_MONITORS],
    ['FenceBattery', FENCE_BATTERIES],
    ['FenceAccessory', FENCE_ACCESSORIES],
  ];
  for (const [table, rows] of tables) {
    const existing = await db.execute(`SELECT COUNT(*) AS n FROM ${table}`);
    if (Number(existing.rows[0].n) > 0) continue;
    for (const row of rows) await ins(table, { ...row, active: true });
  }
  console.log('Electric fence equipment catalog seeded.');
}

// Migrates a fence catalog seeded before post shape/insulatorsIncluded and
// accessories existed (bundledBatteryAh/bundledSiren need no correction —
// the ALTER TABLE default of 7Ah + siren is already correct for every
// pre-existing energizer row): inserts any new Wizard energizer, square-tube
// post and accessory rows a pre-existing catalog is missing. Matches by
// brand+model so it's safe to re-run on every boot.
async function migrateFenceCatalog() {
  async function insertIfMissing(table, row) {
    const existing = await db.execute({ sql: `SELECT id FROM ${table} WHERE brand = ? AND model = ?`, args: [row.brand, row.model] });
    if (existing.rows.length > 0) return;
    await ins(table, { ...row, active: true });
  }

  for (const row of FENCE_ENERGIZERS_WIZARD) await insertIfMissing('FenceEnergizer', row);
  for (const row of FENCE_POSTS_SQUARE_TUBE) await insertIfMissing('FencePost', row);
  for (const row of FENCE_ACCESSORIES) await insertIfMissing('FenceAccessory', row);
  console.log('Electric fence catalog migration + accessories backfilled.');
}

// CCTV Calculator equipment catalog — same seed-once-if-empty pattern.
const CCTV_CAMERAS_IP = [
  { brand: 'Hikvision', model: 'DS-2CD1123G0 Dome 2MP', systemType: 'IP', type: 'DOME', environment: 'INDOOR', resolutionMp: 2, lowLight: false, poeWatts: 6, priceUsd: 38 },
  { brand: 'Hikvision', model: 'DS-2CD1143G0 Dome 4MP', systemType: 'IP', type: 'DOME', environment: 'INDOOR', resolutionMp: 4, lowLight: false, poeWatts: 7, priceUsd: 52 },
  { brand: 'Hikvision', model: 'DS-2CD2T87 Bullet 8MP (4K)', systemType: 'IP', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 8, lowLight: false, poeWatts: 10, priceUsd: 110 },
  { brand: 'Hikvision', model: 'DS-2DE4425 PTZ 4MP', systemType: 'IP', type: 'PTZ', environment: 'OUTDOOR', resolutionMp: 4, lowLight: false, poeWatts: 30, priceUsd: 420 },
  { brand: 'Dahua', model: 'IPC-HDW2439 Turret 4MP', systemType: 'IP', type: 'TURRET', environment: 'OUTDOOR', resolutionMp: 4, lowLight: false, poeWatts: 7, priceUsd: 55 },
  { brand: 'Dahua', model: 'IPC-HFW2439 Bullet 4MP', systemType: 'IP', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 4, lowLight: false, poeWatts: 8, priceUsd: 58 },
  { brand: 'Dahua', model: 'IPC-HFW2439S Starlight 4MP', systemType: 'IP', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 4, lowLight: true, poeWatts: 9, priceUsd: 78 },
];
const CCTV_CAMERAS_ANALOG = [
  { brand: 'Hikvision', model: 'DS-2CE56D0T Turbo HD Dome 2MP', systemType: 'ANALOG', type: 'DOME', environment: 'INDOOR', resolutionMp: 2, lowLight: false, poeWatts: 0, priceUsd: 22 },
  { brand: 'Hikvision', model: 'DS-2CE16D0T Turbo HD Bullet 2MP', systemType: 'ANALOG', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 2, lowLight: false, poeWatts: 0, priceUsd: 26 },
  { brand: 'Hikvision', model: 'DS-2CE16H0T Turbo HD Bullet 5MP', systemType: 'ANALOG', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 5, lowLight: true, poeWatts: 0, priceUsd: 40 },
  { brand: 'Dahua', model: 'HAC-HDW1200 HDCVI Dome 2MP', systemType: 'ANALOG', type: 'DOME', environment: 'INDOOR', resolutionMp: 2, lowLight: false, poeWatts: 0, priceUsd: 20 },
  { brand: 'Dahua', model: 'HAC-HFW1200 HDCVI Bullet 2MP', systemType: 'ANALOG', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 2, lowLight: false, poeWatts: 0, priceUsd: 24 },
  { brand: 'Dahua', model: 'HAC-HFW1500 HDCVI Bullet 5MP Starlight', systemType: 'ANALOG', type: 'BULLET', environment: 'OUTDOOR', resolutionMp: 5, lowLight: true, poeWatts: 0, priceUsd: 42 },
];
const CCTV_CAMERAS = [...CCTV_CAMERAS_IP, ...CCTV_CAMERAS_ANALOG];

const CCTV_NVRS_IP = [
  { brand: 'Hikvision', model: 'DS-7604NI-K1 4CH PoE NVR', systemType: 'IP', channels: 4, poePorts: 4, poeBudgetW: 48, maxHddBays: 1, priceUsd: 95 },
  { brand: 'Hikvision', model: 'DS-7608NI-K2 8CH PoE NVR', systemType: 'IP', channels: 8, poePorts: 8, poeBudgetW: 96, maxHddBays: 2, priceUsd: 175 },
  { brand: 'Dahua', model: 'NVR4216-16P 16CH PoE NVR', systemType: 'IP', channels: 16, poePorts: 16, poeBudgetW: 150, maxHddBays: 2, priceUsd: 320 },
  { brand: 'Dahua', model: 'NVR5432-16P 32CH NVR', systemType: 'IP', channels: 32, poePorts: 16, poeBudgetW: 200, maxHddBays: 4, priceUsd: 650 },
];
const CCTV_NVRS_ANALOG = [
  { brand: 'Hikvision', model: 'DS-7204HUHI 4CH Turbo HD DVR', systemType: 'ANALOG', channels: 4, poePorts: 0, poeBudgetW: 0, maxHddBays: 1, priceUsd: 70 },
  { brand: 'Hikvision', model: 'DS-7208HUHI 8CH Turbo HD DVR', systemType: 'ANALOG', channels: 8, poePorts: 0, poeBudgetW: 0, maxHddBays: 1, priceUsd: 115 },
  { brand: 'Dahua', model: 'XVR1B04 4CH Analog', systemType: 'ANALOG', channels: 4, poePorts: 0, poeBudgetW: 0, maxHddBays: 1, priceUsd: 65 },
  { brand: 'Dahua', model: 'XVR1B08 8CH Analog', systemType: 'ANALOG', channels: 8, poePorts: 0, poeBudgetW: 0, maxHddBays: 1, priceUsd: 110 },
];
const CCTV_NVRS = [...CCTV_NVRS_IP, ...CCTV_NVRS_ANALOG];

const CCTV_HDDS = [
  { brand: 'Seagate SkyHawk', model: '1TB Surveillance', capacityTb: 1, priceUsd: 48 },
  { brand: 'Seagate SkyHawk', model: '2TB Surveillance', capacityTb: 2, priceUsd: 65 },
  { brand: 'Seagate SkyHawk', model: '4TB Surveillance', capacityTb: 4, priceUsd: 110 },
  { brand: 'Seagate SkyHawk', model: '8TB Surveillance', capacityTb: 8, priceUsd: 195 },
];
const CCTV_CABLES = [
  { brand: 'SmartTech', model: 'Cat6 UTP Outdoor', type: 'CAT6', spoolLengthM: 305, priceUsdPerSpool: 75 },
  { brand: 'SmartTech', model: 'RG59 Coax + Power (Siamese)', type: 'COAX_POWER', spoolLengthM: 305, priceUsdPerSpool: 95 },
];
const CCTV_POE_SWITCHES = [
  { brand: 'TP-Link', model: 'TL-SG1008P 8-Port PoE', ports: 8, poeBudgetW: 124, priceUsd: 85 },
  { brand: 'TP-Link', model: 'TL-SG1016PE 16-Port PoE', ports: 16, poeBudgetW: 150, priceUsd: 180 },
  { brand: 'Ubiquiti', model: 'USW-24-PoE 24-Port', ports: 24, poeBudgetW: 400, priceUsd: 420 },
];
const CCTV_ACCESSORIES = [
  { category: 'CABINET', brand: 'SmartTech', model: 'Wall-mount Network Cabinet', spec: '6U', priceUsd: 65 },
  { category: 'CABINET', brand: 'SmartTech', model: 'Wall-mount Network Cabinet', spec: '9U', priceUsd: 85 },
  { category: 'CABINET', brand: 'SmartTech', model: 'Floor-standing Network Cabinet', spec: '12U', priceUsd: 150 },
  { category: 'CABINET', brand: 'SmartTech', model: 'Floor-standing Network Cabinet', spec: '22U', priceUsd: 260 },
  { category: 'MONITOR', brand: 'Hikvision', model: 'LED Monitor', spec: '19"', priceUsd: 75 },
  { category: 'MONITOR', brand: 'Hikvision', model: 'LED Monitor', spec: '24"', priceUsd: 110 },
  { category: 'MONITOR', brand: 'Samsung', model: 'LED Monitor', spec: '32"', priceUsd: 180 },
  { category: 'MONITOR', brand: 'Samsung', model: 'LED TV/Monitor', spec: '43"', priceUsd: 320 },
  { category: 'MONITOR', brand: 'LG', model: 'LED TV/Monitor', spec: '55"', priceUsd: 480 },
  { category: 'MONITOR', brand: 'LG', model: 'LED TV/Monitor', spec: '65"', priceUsd: 650 },
  { category: 'MONITOR', brand: 'LG', model: 'LED Video Wall Display', spec: '75"', priceUsd: 950 },
  { category: 'MONITOR', brand: 'LG', model: 'LED Video Wall Display', spec: '80"', priceUsd: 1150 },
  { category: 'HDMI_CABLE', brand: 'SmartTech', model: 'HDMI Cable', spec: '3m', priceUsd: 6 },
  { category: 'HDMI_CABLE', brand: 'SmartTech', model: 'HDMI Cable', spec: '5m', priceUsd: 9 },
  { category: 'HDMI_CABLE', brand: 'SmartTech', model: 'HDMI Cable', spec: '10m', priceUsd: 16 },
  { category: 'HDMI_SPLITTER', brand: 'SmartTech', model: 'HDMI Splitter', spec: '2-port', priceUsd: 18 },
  { category: 'HDMI_SPLITTER', brand: 'SmartTech', model: 'HDMI Splitter', spec: '4-port', priceUsd: 32 },
  { category: 'HDMI_SPLITTER', brand: 'SmartTech', model: 'HDMI Splitter', spec: '8-port', priceUsd: 58 },
  { category: 'OTHER', brand: 'SmartTech', model: 'UPS Backup Unit', spec: '650VA', priceUsd: 55 },
  { category: 'OTHER', brand: 'SmartTech', model: 'Surge Protector', spec: '4-way', priceUsd: 15 },
];

async function backfillCctvCatalog() {
  const tables = [
    ['CctvCamera', CCTV_CAMERAS],
    ['CctvNvr', CCTV_NVRS],
    ['CctvHdd', CCTV_HDDS],
    ['CctvCable', CCTV_CABLES],
    ['CctvPoeSwitch', CCTV_POE_SWITCHES],
    ['CctvAccessory', CCTV_ACCESSORIES],
  ];
  for (const [table, rows] of tables) {
    const existing = await db.execute(`SELECT COUNT(*) AS n FROM ${table}`);
    if (Number(existing.rows[0].n) > 0) continue;
    for (const row of rows) await ins(table, { ...row, active: true });
  }
  console.log('CCTV equipment catalog seeded.');
}

// Migrates a CCTV catalog seeded before systemType/accessories existed: fixes
// systemType on already-seeded analog DVR rows (they defaulted to 'IP' via
// the ALTER TABLE column addition), and inserts any new analog camera/DVR
// SKUs and accessories that a pre-existing, non-empty catalog is missing.
// Matches by brand+model so it's safe to re-run on every boot.
async function migrateCctvSystemTypesAndAccessories() {
  await db.execute(`UPDATE CctvNvr SET systemType = 'ANALOG' WHERE poePorts = 0 AND systemType != 'ANALOG'`);

  async function insertIfMissing(table, row) {
    const existing = await db.execute({ sql: `SELECT id FROM ${table} WHERE brand = ? AND model = ?`, args: [row.brand, row.model] });
    if (existing.rows.length > 0) return;
    await ins(table, { ...row, active: true });
  }

  for (const row of CCTV_CAMERAS_ANALOG) await insertIfMissing('CctvCamera', row);
  for (const row of CCTV_NVRS_ANALOG) await insertIfMissing('CctvNvr', row);
  for (const row of CCTV_ACCESSORIES) await insertIfMissing('CctvAccessory', row);
  console.log('CCTV system-type migration + accessories backfilled.');
}

// House Wiring Calculator equipment catalog — same seed-once-if-empty pattern.
const WIRING_CABLES = [
  { brand: 'SmartTech', model: '1.5mm² Twin & Earth PVC', csaMm2: 1.5, maxCurrentA: 17.5, spoolLengthM: 100, priceUsdPerSpool: 45 },
  { brand: 'SmartTech', model: '2.5mm² Twin & Earth PVC', csaMm2: 2.5, maxCurrentA: 24, spoolLengthM: 100, priceUsdPerSpool: 68 },
  { brand: 'SmartTech', model: '4mm² Twin & Earth PVC', csaMm2: 4, maxCurrentA: 32, spoolLengthM: 100, priceUsdPerSpool: 105 },
  { brand: 'SmartTech', model: '6mm² Twin & Earth PVC', csaMm2: 6, maxCurrentA: 41, spoolLengthM: 50, priceUsdPerSpool: 95 },
  { brand: 'SmartTech', model: '10mm² Twin & Earth PVC', csaMm2: 10, maxCurrentA: 57, spoolLengthM: 50, priceUsdPerSpool: 155 },
];
const WIRING_CONDUITS = [
  { brand: 'SmartTech', model: '20mm PVC Conduit', diameterMm: 20, lengthM: 3, priceUsdPerLength: 2.2 },
  { brand: 'SmartTech', model: '25mm PVC Conduit', diameterMm: 25, lengthM: 3, priceUsdPerLength: 2.8 },
  { brand: 'SmartTech', model: '32mm PVC Conduit', diameterMm: 32, lengthM: 3, priceUsdPerLength: 3.6 },
];
const WIRING_BOARDS = [
  { brand: 'CBI', model: '4-Way Distribution Board', ways: 4, priceUsd: 28 },
  { brand: 'CBI', model: '6-Way Distribution Board', ways: 6, priceUsd: 38 },
  { brand: 'CBI', model: '8-Way Distribution Board', ways: 8, priceUsd: 48 },
  { brand: 'CBI', model: '12-Way Distribution Board', ways: 12, priceUsd: 68 },
  { brand: 'CBI', model: '18-Way Distribution Board', ways: 18, priceUsd: 95 },
  { brand: 'CBI', model: '24-Way Distribution Board', ways: 24, priceUsd: 130 },
];
const WIRING_BREAKERS = [
  { brand: 'CBI', model: 'MCB 10A', type: 'MCB', ampRating: 10, priceUsd: 6.5 },
  { brand: 'CBI', model: 'MCB 16A', type: 'MCB', ampRating: 16, priceUsd: 6.5 },
  { brand: 'CBI', model: 'MCB 20A', type: 'MCB', ampRating: 20, priceUsd: 7 },
  { brand: 'CBI', model: 'MCB 25A', type: 'MCB', ampRating: 25, priceUsd: 7.5 },
  { brand: 'CBI', model: 'MCB 32A', type: 'MCB', ampRating: 32, priceUsd: 8.5 },
  { brand: 'CBI', model: 'MCB 40A', type: 'MCB', ampRating: 40, priceUsd: 10 },
  { brand: 'CBI', model: 'MCB 63A', type: 'MCB', ampRating: 63, priceUsd: 14 },
  { brand: 'CBI', model: 'RCD Earth Leakage Unit 63A/30mA', type: 'RCD', ampRating: 63, priceUsd: 32 },
  { brand: 'CBI', model: 'Main Isolator 63A', type: 'ISOLATOR', ampRating: 63, priceUsd: 18 },
];
const WIRING_ACCESSORIES = [
  { category: 'SWITCH', brand: 'SmartTech', model: 'Light Switch', spec: '1-lever', priceUsd: 3.2 },
  { category: 'SWITCH', brand: 'SmartTech', model: 'Light Switch', spec: '2-lever', priceUsd: 4.8 },
  { category: 'SWITCH', brand: 'SmartTech', model: 'Light Switch', spec: '3-lever', priceUsd: 6.5 },
  { category: 'SOCKET_OUTLET', brand: 'SmartTech', model: 'Socket Outlet', spec: 'Single, RSA 3-pin', priceUsd: 3.8 },
  { category: 'SOCKET_OUTLET', brand: 'SmartTech', model: 'Socket Outlet', spec: 'Double, RSA 3-pin', priceUsd: 5.5 },
  { category: 'LIGHT_FITTING', brand: 'SmartTech', model: 'Batten Holder', spec: 'Indoor, ceiling-mount', priceUsd: 2.5 },
  { category: 'LIGHT_FITTING', brand: 'SmartTech', model: 'Bulkhead Fitting', spec: 'Outdoor, weatherproof', priceUsd: 8.5 },
  { category: 'JUNCTION_BOX', brand: 'SmartTech', model: 'Junction Box', spec: 'Standard PVC', priceUsd: 1.2 },
  { category: 'OTHER', brand: 'SmartTech', model: 'Conduit Saddles', spec: 'Pack of 20', priceUsd: 3.5 },
  { category: 'OTHER', brand: 'SmartTech', model: 'Connector Strip', spec: '12-way', priceUsd: 1.8 },
  { category: 'OTHER', brand: 'CBI', model: 'Surge Protection Device (SPD)', spec: 'Type 2, DIN rail', priceUsd: 45 },
];

async function backfillWiringCatalog() {
  const tables = [
    ['WiringCable', WIRING_CABLES],
    ['WiringConduit', WIRING_CONDUITS],
    ['WiringBoard', WIRING_BOARDS],
    ['WiringBreaker', WIRING_BREAKERS],
    ['WiringAccessory', WIRING_ACCESSORIES],
  ];
  for (const [table, rows] of tables) {
    const existing = await db.execute(`SELECT COUNT(*) AS n FROM ${table}`);
    if (Number(existing.rows[0].n) > 0) continue;
    for (const row of rows) await ins(table, { ...row, active: true });
  }
  console.log('House wiring equipment catalog seeded.');
}

// Replaces placeholder lesson content, quiz questions and assignment briefs
// with the real material from the companion book (see prisma/content.mjs).
// Runs unconditionally — like backfillCovers() above — so it safely updates
// an already-seeded database (including the live one) without touching
// Users, Enrollments, Payments or any other student data. Matches purely by
// title, so it's safe to re-run any number of times.
async function backfillLessonContent() {
  let lessonsUpdated = 0;
  for (const [title, html] of Object.entries(LESSON_CONTENT)) {
    const res = await db.execute({ sql: 'UPDATE Lesson SET contentHtml = ? WHERE title = ?', args: [html.trim(), title] });
    lessonsUpdated += res.rowsAffected ?? 0;
  }

  let quizzesUpdated = 0;
  for (const [quizTitle, qs] of Object.entries(QUIZ_QUESTIONS)) {
    const quiz = await db.execute({ sql: 'SELECT id FROM Quiz WHERE title = ?', args: [quizTitle] });
    const quizId = quiz.rows[0]?.id;
    if (!quizId) continue;
    await db.execute({ sql: 'DELETE FROM Question WHERE quizId = ?', args: [quizId] });
    for (let q = 0; q < qs.length; q++) {
      await ins('Question', { quizId, order: q + 1, kind: qs[q][0], prompt: qs[q][1], options: J(qs[q][2]), answer: J(qs[q][3]) });
    }
    quizzesUpdated += 1;
  }

  let assignmentsUpdated = 0;
  for (const [assignTitle, brief] of Object.entries(ASSIGNMENT_BRIEFS)) {
    const res = await db.execute({ sql: 'UPDATE Assignment SET brief = ? WHERE title = ?', args: [brief, assignTitle] });
    assignmentsUpdated += res.rowsAffected ?? 0;
  }

  console.log(`Lesson content backfilled — ${lessonsUpdated} lessons, ${quizzesUpdated} quizzes (questions replaced), ${assignmentsUpdated} assignments.`);
}

async function main() {
  const ddl = readFileSync(path.join(here, 'schema.sql'), 'utf8');
  for (const s of ddl.split(';').map((x) => x.trim()).filter(Boolean)) {
    try {
      await db.execute(s);
    } catch (err) {
      // ALTER TABLE ... ADD COLUMN migrations re-run on every seed; ignore
      // "already applied" errors on databases that already have the column.
      if (!/duplicate column name/i.test(err?.message ?? '')) throw err;
    }
  }

  await backfillCovers();
  await backfillComingSoon();
  await backfillSolarCatalog();
  await backfillFenceCatalog();
  await migrateFenceCatalog();
  await backfillCctvCatalog();
  await migrateCctvSystemTypesAndAccessories();
  await backfillWiringCatalog();

  const existing = await db.execute('SELECT COUNT(*) AS n FROM User');
  if (Number(existing.rows[0].n) > 0) {
    console.log('Seed skipped — database already populated.');
    // Content backfills still run on an already-seeded (including the live)
    // database — that's the whole point of keeping them separate from the
    // one-time demo-data seed below, which must never re-run once users exist.
    await backfillLessonContent();
    return;
  }

  const hash = await bcrypt.hash('Password123!', 10);

  // ---- Users ----
  await ins('User', { email: 'admin@smarttech.academy', passwordHash: hash, name: 'Admin', role: 'ADMIN', country: 'Zimbabwe', city: 'Harare' });
  const tapiwa = await ins('User', {
    email: 'tapiwa@smarttech.academy', passwordHash: hash, name: 'Eng. Tapiwa Moyo', role: 'INSTRUCTOR',
    headline: 'Security Systems Engineer · 12 yrs field experience', city: 'Harare', country: 'Zimbabwe',
    bio: 'Tapiwa has installed and commissioned over 900 CCTV systems across Southern Africa, from retail sites to industrial plants. He leads SmartTech Academy’s security systems faculty.',
  });
  const rudo = await ins('User', {
    email: 'rudo@smarttech.academy', passwordHash: hash, name: 'Rudo Ncube', role: 'INSTRUCTOR',
    headline: 'Solar PV Designer · 2,000+ installers trained', city: 'Bulawayo', country: 'Zimbabwe',
    bio: 'Rudo designs off-grid and hybrid solar systems and leads the renewable energy faculty.',
  });
  const student = await ins('User', {
    email: 'student@smarttech.academy', passwordHash: hash, name: 'Godknows Chinenguwi', role: 'STUDENT',
    city: 'Harare', country: 'Zimbabwe', xp: 1240, level: 3, streakDays: 6, headline: 'Trainee Technician',
  });

  // ---- Categories ----
  const cats = {};
  for (const [name, slug, icon] of [
    ['Security Systems', 'security-systems', '🎥'],
    ['Networking', 'networking', '🌐'],
    ['Solar', 'solar', '☀️'],
    ['Electrical', 'electrical', '⚡'],
    ['Automation', 'automation', '🤖'],
    ['Artificial Intelligence', 'artificial-intelligence', '🧠'],
    ['Industrial Automation', 'industrial-automation', '🏭'],
    ['Business Skills', 'business-skills', '💼'],
  ]) cats[slug] = await ins('Category', { name, slug, icon });

  // ---- Flagship CCTV course ----
  const cctv = await ins('Course', {
    slug: 'cctv-installation-technician',
    title: 'Certified CCTV Installation Technician',
    subtitle: 'From first camera to full commercial installations — analogue, IP, AI and solar-powered CCTV.',
    description: 'A complete, job-ready programme covering everything a professional CCTV installer needs: camera technology, DVR/NVR configuration, structured cabling, IP networking, remote viewing, AI analytics, solar-powered systems, troubleshooting and how to run your installation business. Finish with an optional hands-on practical assessment in your city and earn a verifiable certificate.',
    objectives: J([
      'Select the right cameras, recorders and storage for any site',
      'Run, terminate and test coax and Cat6 cabling to professional standards',
      'Configure DVR/NVR systems and remote viewing on phones and PCs',
      'Design solar-powered CCTV for off-grid sites',
      'Deploy AI analytics: line crossing, intrusion, face and plate detection',
      'Diagnose and repair common faults quickly',
      'Quote, invoice and win installation contracts',
    ]),
    requirements: J(['No prior experience required', 'A smartphone or computer with internet', 'Hand tools recommended for practice (crimper, tester, screwdrivers)']),
    resources: J(['42 HD video lessons', '13 downloadable PDF manuals', 'Quotation & maintenance contract templates', 'Cable sizing charts', 'Installation checklists', 'Certificate of completion', 'Optional hands-on practical day']),
    difficulty: 'BEGINNER', durationHours: 32, priceCents: 14900, practicalFeeCents: 6000,
    isPublished: true, categoryId: cats['security-systems'], instructorId: tapiwa,
  });

  const moduleDefs = [
    ['Introduction', 'Welcome, how the course works, tools of the trade.'],
    ['CCTV Fundamentals', 'How surveillance systems work end-to-end.'],
    ['Camera Types', 'Dome, bullet, PTZ, turret; analogue vs IP; resolution and lenses.'],
    ['DVR & NVR', 'Recorders, storage sizing, RAID, configuration.'],
    ['Cabling', 'Coax, Cat6, connectors, termination, testing.'],
    ['Installation', 'Site survey, mounting, powering, weatherproofing.'],
    ['Networking', 'IP addressing, switches, PoE, port forwarding basics.'],
    ['Remote Viewing', 'Mobile apps, P2P, DDNS, secure remote access.'],
    ['AI CCTV', 'Smart analytics: intrusion, line-cross, face & plate recognition.'],
    ['Solar CCTV', 'Panel and battery sizing for off-grid camera systems.'],
    ['Troubleshooting', 'Systematic fault-finding and preventative maintenance.'],
    ['Business Skills', 'Quoting, contracts, marketing your installation business.'],
    ['Final Practical Assessment', 'Final exam and hands-on assessment briefing.'],
  ];
  const lessonTitles = [
    ['Welcome to the course', 'Your toolkit as an installer', 'How certification works'],
    ['What is a CCTV system?', 'Signal flow: camera to screen', 'Quiz: Fundamentals'],
    ['Camera form factors explained', 'Analogue vs IP cameras', 'Resolution, lenses & IR', 'Quiz: Camera types'],
    ['DVR vs NVR', 'Hard drive & storage sizing', 'Recorder setup walkthrough', 'Assignment: Storage plan'],
    ['Coaxial cable & BNC termination', 'Cat6 & RJ45 termination', 'Cable testing', 'Quiz: Cabling'],
    ['Site survey & camera placement', 'Mounting & powering cameras', 'Weatherproofing & finishing', 'Assignment: Site survey'],
    ['IP addressing for installers', 'Switches & PoE budgets', 'Quiz: Networking'],
    ['Mobile viewing apps', 'P2P, DDNS & static IPs', 'Securing remote access'],
    ['AI analytics overview', 'Configuring smart events', 'Face & plate recognition'],
    ['Solar sizing for CCTV', 'Batteries & charge controllers', 'Assignment: Solar CCTV design'],
    ['Fault-finding methodology', 'Top 12 faults & fixes', 'Quiz: Troubleshooting'],
    ['Pricing & quotations', 'Maintenance contracts', 'Winning clients'],
    ['Final exam', 'Practical assessment briefing', 'Course summary & next steps'],
  ];

  const cctvLessonIds = [];
  for (let m = 0; m < moduleDefs.length; m++) {
    const mod = await ins('Module', { courseId: cctv, order: m + 1, title: `Module ${m + 1} — ${moduleDefs[m][0]}`, summary: moduleDefs[m][1] });
    for (let l = 0; l < lessonTitles[m].length; l++) {
      const t = lessonTitles[m][l];
      const isQuiz = t.startsWith('Quiz') || t === 'Final exam';
      const isAssign = t.startsWith('Assignment');
      const lessonId = await ins('Lesson', {
        moduleId: mod, order: l + 1, title: t,
        kind: isQuiz ? 'QUIZ' : isAssign ? 'ASSIGNMENT' : m === 12 && l === 2 ? 'SUMMARY' : 'VIDEO',
        estMinutes: isQuiz ? 15 : 12, isFreePreview: m === 0,
        contentHtml: `<p>${moduleDefs[m][1]}</p><p>Watch the video, download the notes below, then mark the lesson complete. Use the discussion tab if anything is unclear — your instructor replies within 24 hours.</p>`,
        videoUrl: isQuiz || isAssign ? null : 'https://videos.smarttech.academy/placeholder.mp4',
      });
      cctvLessonIds.push(lessonId);
      if (!isQuiz && !isAssign) {
        await ins('LessonAttachment', { lessonId, name: `${moduleDefs[m][0]} — Notes.pdf`, kind: 'PDF', fileUrl: '/files/notes.pdf', sizeKb: 840 });
        if (l === 0) await ins('LessonAttachment', { lessonId, name: `${moduleDefs[m][0]} — Slides.pptx`, kind: 'PPTX', fileUrl: '/files/slides.pptx', sizeKb: 2300 });
      }
      if (isQuiz) {
        const quizId = await ins('Quiz', { lessonId, title: t, passMarkPct: 70, isFinalExam: t === 'Final exam', timeLimitMin: t === 'Final exam' ? 60 : null });
        const qs = [
          ['MCQ', 'Which cable is standard for analogue HD cameras?', ['Cat6', 'RG59 coaxial', 'Fibre optic', 'Speaker wire'], [1]],
          ['TRUE_FALSE', 'An NVR records footage from IP cameras.', ['True', 'False'], [0]],
          ['MCQ', 'PoE stands for…', ['Power over Ethernet', 'Point of Entry', 'Power on Edge', 'Passive optical Ethernet'], [0]],
          ['FILL_BLANK', 'A camera’s field of view is determined mainly by its ____ .', [], ['lens', 'lens focal length', 'focal length']],
        ];
        for (let q = 0; q < qs.length; q++) {
          await ins('Question', { quizId, order: q + 1, kind: qs[q][0], prompt: qs[q][1], options: J(qs[q][2]), answer: J(qs[q][3]) });
        }
      }
      if (isAssign) {
        await ins('Assignment', { lessonId, title: t.replace('Assignment: ', ''), brief: 'Complete the task described in the lesson and upload photos or a PDF of your work. Your instructor will grade it and leave feedback.' });
      }
    }
  }

  // ---- Additional courses ----
  const extras = [
    ['solar-installation-professional', 'Professional Solar Installation', 'Design and install residential & commercial solar PV systems.', 'solar', rudo, 'INTERMEDIATE', 28, 17900],
    ['networking-for-technicians', 'Networking for Field Technicians', 'IP networks, switches, Wi-Fi and fibre basics for installers.', 'networking', tapiwa, 'BEGINNER', 18, 9900],
    ['electric-fence-installation', 'Electric Fence Installation', 'Energizers, zones, compliance and commissioning.', 'security-systems', tapiwa, 'BEGINNER', 14, 11900],
    ['plc-programming-fundamentals', 'PLC Programming Fundamentals', 'Ladder logic, sensors and industrial control with hands-on labs.', 'industrial-automation', rudo, 'INTERMEDIATE', 24, 19900],
    ['ai-cctv-computer-vision', 'AI CCTV & Computer Vision', 'Deploy AI analytics and NVIDIA Jetson-based smart surveillance.', 'artificial-intelligence', tapiwa, 'ADVANCED', 20, 24900],
    ['technician-business-startup', 'Start & Grow Your Technician Business', 'Pricing, quotes, marketing and contracts for trade businesses.', 'business-skills', rudo, 'BEGINNER', 10, 7900],
  ];
  const extraIds = [];
  for (const [slug, title, subtitle, cat, instr, diff, hrs, price] of extras) {
    const c = await ins('Course', {
      slug, title, subtitle,
      description: subtitle + ' A practical, project-based programme with downloadable templates, quizzes and a verifiable certificate.',
      objectives: J(['Master the core skills through real projects', 'Work with professional templates and checklists', 'Earn a verifiable certificate']),
      requirements: J(['No prior experience required']),
      resources: J(['HD video lessons', 'Downloadable notes & templates', 'Quizzes & assignments', 'Certificate of completion']),
      difficulty: diff, durationHours: hrs, priceCents: price, practicalFeeCents: 5000,
      isPublished: true, categoryId: cats[cat], instructorId: instr,
    });
    extraIds.push(c);
    const mod = await ins('Module', { courseId: c, order: 1, title: 'Module 1 — Getting Started', summary: 'Orientation and fundamentals.' });
    const firstLesson = await ins('Lesson', { moduleId: mod, order: 1, title: 'Welcome & course roadmap', kind: 'VIDEO', isFreePreview: true, estMinutes: 8, contentHtml: '<p>Welcome! Here’s how the course is structured and what you’ll build.</p>', videoUrl: 'https://videos.smarttech.academy/placeholder.mp4' });
    if (slug === 'networking-for-technicians') {
      await ins('LessonProgress', { userId: student, lessonId: firstLesson, completed: true, completedAt: new Date(Date.now() - 21 * 86400000) });
    }
  }

  // ---- Reviews ----
  await ins('Review', { userId: student, courseId: cctv, rating: 5, comment: 'Best money I’ve spent on my career. I did the Harare practical day and got hired two weeks later.' });
  for (const [name, rating, comment] of [
    ['Blessing M.', 5, 'Very practical. The cabling module alone paid for the course — my terminations are now perfect.'],
    ['Nyasha K.', 4, 'Clear videos and great templates. I use the quotation template with every client.'],
    ['Thabo D.', 5, 'Booked the Joburg practical session. Hands-on assessment gave me real confidence on site.'],
  ]) {
    const u = await ins('User', { email: `${name.split(' ')[0].toLowerCase()}@example.com`, passwordHash: hash, name, role: 'STUDENT' });
    await ins('Review', { userId: u, courseId: cctv, rating, comment });
  }

  // ---- Practical sessions ----
  const now = Date.now();
  const day = 86400000;
  const sess = [];
  for (const [courseId, city, venue, country, inDays, price] of [
    [cctv, 'Harare', 'SmartTech Training Centre, 12 Samora Machel Ave', 'Zimbabwe', 14, 6000],
    [cctv, 'Bulawayo', 'NUST Innovation Hub', 'Zimbabwe', 28, 6000],
    [cctv, 'Johannesburg', 'Midrand Technical Campus', 'South Africa', 35, 9000],
    [extraIds[0], 'Harare', 'SmartTech Training Centre, 12 Samora Machel Ave', 'Zimbabwe', 21, 8000],
  ]) {
    sess.push(await ins('PracticalSession', {
      courseId, city, venue, country,
      startsAt: new Date(now + inDays * day), endsAt: new Date(now + inDays * day + 8 * 3600000),
      capacity: 12, priceCents: price,
    }));
  }

  // ---- Demo student state ----
  await ins('Enrollment', { userId: student, courseId: cctv, progressPct: 38 });
  await ins('Enrollment', { userId: student, courseId: extraIds[1], progressPct: 100, status: 'COMPLETED', completedAt: new Date(now - 20 * day) });
  for (let i = 0; i < 16; i++) {
    await ins('LessonProgress', { userId: student, lessonId: cctvLessonIds[i], completed: true, completedAt: new Date(now - (16 - i) * day) });
  }
  await ins('Certificate', { serial: 'STA-2026-000117', userId: student, courseId: extraIds[1], hoursCompleted: 18 });
  await ins('PracticalBooking', { sessionId: sess[0], userId: student, status: 'CONFIRMED', slipCode: randomUUID() });
  await ins('Payment', { userId: student, amountCents: 14900, provider: 'ECOCASH', purpose: 'COURSE', status: 'PAID', reference: randomUUID() });

  // ---- Badges ----
  for (const [key, name, description, icon] of [
    ['first-lesson', 'First Steps', 'Completed your first lesson', '🥇'],
    ['streak-7', 'On Fire', '7-day learning streak', '🔥'],
    ['quiz-ace', 'Quiz Ace', 'Scored 100% on a quiz', '🎯'],
    ['first-cert', 'Certified', 'Earned your first certificate', '📜'],
    ['practical-pro', 'Hands-On Pro', 'Completed a practical session', '🛠️'],
  ]) {
    const b = await ins('Badge', { key, name, description, icon });
    if (['first-lesson', 'quiz-ace', 'first-cert'].includes(key)) await ins('UserBadge', { userId: student, badgeId: b });
  }

  // ---- Forum, notifications, coupon ----
  const thread = await ins('ForumThread', { courseId: cctv, title: 'Best budget cable tester?', pinned: true });
  await ins('ForumPost', { threadId: thread, userId: student, body: 'Which cable tester do you recommend for someone starting out?', likes: 4 });
  await ins('ForumPost', { threadId: thread, userId: tapiwa, body: 'A basic RJ45/BNC continuity tester is fine to start (~$10). Upgrade to a tester with PoE detection once you do IP jobs.', likes: 11, isAnswer: true });

  await ins('Notification', { userId: student, kind: 'PRACTICAL_REMINDER', title: 'Practical session confirmed', body: 'Harare · SmartTech Training Centre. Bring closed shoes and your toolkit.', href: '/practicals' });
  await ins('Notification', { userId: student, kind: 'COURSE_UPDATE', title: 'New lesson added', body: 'Module 9: Configuring smart events was updated with new footage.', href: '/courses/cctv-installation-technician' });

  await ins('Coupon', { code: 'LAUNCH25', percentOff: 25, maxUses: 500 });

  await backfillLessonContent();

  console.log('Seed complete.');
}

main().catch((e) => { console.error(e); process.exit(1); });

