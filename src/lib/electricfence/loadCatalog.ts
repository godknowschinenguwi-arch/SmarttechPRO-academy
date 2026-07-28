// Server-only: resolves the live electric fence equipment catalog from the
// database, falling back to the built-in static catalog if the tables are
// empty or unreachable.
import { ENERGIZERS, WIRES, POSTS, MONITORS, BATTERIES } from './catalog';
import { energizerStore, wireStore, postStore, monitorStore, batteryStore } from './catalogDb';
import type { FenceCatalog } from './types';

export async function getActiveFenceCatalog(): Promise<FenceCatalog> {
  try {
    const [energizers, wires, posts, monitors, batteries] = await Promise.all([
      energizerStore.list(false),
      wireStore.list(false),
      postStore.list(false),
      monitorStore.list(false),
      batteryStore.list(false),
    ]);
    return {
      energizers: energizers.length ? energizers : ENERGIZERS,
      wires: wires.length ? wires : WIRES,
      posts: posts.length ? posts : POSTS,
      monitors: monitors.length ? monitors : MONITORS,
      batteries: batteries.length ? batteries : BATTERIES,
    };
  } catch {
    return { energizers: ENERGIZERS, wires: WIRES, posts: POSTS, monitors: MONITORS, batteries: BATTERIES };
  }
}
