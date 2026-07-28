// Shared request-payload sanitizers for the electric fence API routes — the
// client sends back its full zones/config state, so every field is treated
// as untrusted input.
import { defaultFenceConfig } from './engine';
import type { FenceZone, FenceConfig } from './types';

const MAX_ZONES = 100;

export function sanitizeZones(input: unknown): FenceZone[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, MAX_ZONES).map((raw, i) => {
    const z = raw as Partial<FenceZone>;
    return {
      id: typeof z.id === 'string' ? z.id : `zone-${i}`,
      name: typeof z.name === 'string' ? z.name.slice(0, 60) : `Zone ${i + 1}`,
      lengthM: Number.isFinite(z.lengthM) ? Math.max(0, Number(z.lengthM)) : 0,
      corners: Number.isFinite(z.corners) ? Math.max(0, Number(z.corners)) : 0,
    };
  });
}

export function sanitizeFenceConfig(input: unknown): FenceConfig {
  const d = defaultFenceConfig();
  if (!input || typeof input !== 'object') return d;
  const c = input as Partial<FenceConfig>;
  return {
    strandCount: Number.isFinite(c.strandCount) ? Math.min(20, Math.max(1, Number(c.strandCount))) : d.strandCount,
    wireType: c.wireType === 'HT_WIRE' || c.wireType === 'BRAIDED_WIRE' ? c.wireType : d.wireType,
    postSpacingM: Number.isFinite(c.postSpacingM) ? Math.min(10, Math.max(0.5, Number(c.postSpacingM))) : d.postSpacingM,
    postMaterial: ['STEEL', 'TIMBER', 'CONCRETE'].includes(c.postMaterial as string) ? (c.postMaterial as FenceConfig['postMaterial']) : d.postMaterial,
    gateCount: Number.isFinite(c.gateCount) ? Math.max(0, Number(c.gateCount)) : d.gateCount,
    powerSource: ['MAINS', 'MAINS_WITH_BACKUP', 'SOLAR'].includes(c.powerSource as string) ? (c.powerSource as FenceConfig['powerSource']) : d.powerSource,
    backupHours: Number.isFinite(c.backupHours) ? Math.min(72, Math.max(0, Number(c.backupHours))) : d.backupHours,
    monitoringEnabled: !!c.monitoringEnabled,
    gsmAlertEnabled: !!c.gsmAlertEnabled,
    installBufferPct: Number.isFinite(c.installBufferPct) ? Math.min(1, Math.max(0, Number(c.installBufferPct))) : d.installBufferPct,
    clientName: typeof c.clientName === 'string' ? c.clientName.slice(0, 80) : d.clientName,
    siteName: typeof c.siteName === 'string' ? c.siteName.slice(0, 120) : d.siteName,
    notes: typeof c.notes === 'string' ? c.notes.slice(0, 600) : d.notes,
  };
}
