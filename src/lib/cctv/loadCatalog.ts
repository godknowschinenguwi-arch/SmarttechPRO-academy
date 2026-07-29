// Server-only: resolves the live CCTV equipment catalog from the database,
// falling back to the built-in static catalog if the tables are empty or
// unreachable.
import { CAMERAS, NVRS, HDDS, CABLES, POE_SWITCHES, ACCESSORIES } from './catalog';
import { cameraStore, nvrStore, hddStore, cableStore, poeSwitchStore, accessoryStore } from './catalogDb';
import type { CctvCatalog } from './types';

export async function getActiveCctvCatalog(): Promise<CctvCatalog> {
  try {
    const [cameras, nvrs, hdds, cables, poeSwitches, accessories] = await Promise.all([
      cameraStore.list(false),
      nvrStore.list(false),
      hddStore.list(false),
      cableStore.list(false),
      poeSwitchStore.list(false),
      accessoryStore.list(false),
    ]);
    return {
      cameras: cameras.length ? cameras : CAMERAS,
      nvrs: nvrs.length ? nvrs : NVRS,
      hdds: hdds.length ? hdds : HDDS,
      cables: cables.length ? cables : CABLES,
      poeSwitches: poeSwitches.length ? poeSwitches : POE_SWITCHES,
      accessories: accessories.length ? accessories : ACCESSORIES,
    };
  } catch {
    return { cameras: CAMERAS, nvrs: NVRS, hdds: HDDS, cables: CABLES, poeSwitches: POE_SWITCHES, accessories: ACCESSORIES };
  }
}
