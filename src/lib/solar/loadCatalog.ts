// Server-only: resolves the live solar equipment catalog from the database,
// falling back to the built-in static catalog if the tables are empty or
// unreachable (e.g. a fresh environment that hasn't seeded yet).
import { PANELS, BATTERIES, INVERTERS, CONTROLLERS } from './catalog';
import { panelStore, batteryStore, inverterStore, controllerStore } from './catalogDb';
import type { SolarCatalog } from './types';

export async function getActiveSolarCatalog(): Promise<SolarCatalog> {
  try {
    const [panels, batteries, inverters, controllers] = await Promise.all([
      panelStore.list(false),
      batteryStore.list(false),
      inverterStore.list(false),
      controllerStore.list(false),
    ]);
    return {
      panels: panels.length ? panels : PANELS,
      batteries: batteries.length ? batteries : BATTERIES,
      inverters: inverters.length ? inverters : INVERTERS,
      controllers: controllers.length ? controllers : CONTROLLERS,
    };
  } catch {
    return { panels: PANELS, batteries: BATTERIES, inverters: INVERTERS, controllers: CONTROLLERS };
  }
}
