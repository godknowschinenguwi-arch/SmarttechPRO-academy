// Server-only: resolves the live house wiring equipment catalog from the
// database, falling back to the built-in static catalog if the tables are
// empty or unreachable.
import { CABLES, CONDUITS, BOARDS, BREAKERS, ACCESSORIES } from './catalog';
import { cableStore, conduitStore, boardStore, breakerStore, accessoryStore } from './catalogDb';
import type { WiringCatalog } from './types';

export async function getActiveWiringCatalog(): Promise<WiringCatalog> {
  try {
    const [cables, conduits, boards, breakers, accessories] = await Promise.all([
      cableStore.list(false),
      conduitStore.list(false),
      boardStore.list(false),
      breakerStore.list(false),
      accessoryStore.list(false),
    ]);
    return {
      cables: cables.length ? cables : CABLES,
      conduits: conduits.length ? conduits : CONDUITS,
      boards: boards.length ? boards : BOARDS,
      breakers: breakers.length ? breakers : BREAKERS,
      accessories: accessories.length ? accessories : ACCESSORIES,
    };
  } catch {
    return { cables: CABLES, conduits: CONDUITS, boards: BOARDS, breakers: BREAKERS, accessories: ACCESSORIES };
  }
}
