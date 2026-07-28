// Shared request-payload sanitizers for the CCTV API routes — the client
// sends back its full points/config state, so every field is treated as
// untrusted input.
import { defaultCctvConfig } from './engine';
import type { CameraPoint, CctvConfig } from './types';

const MAX_POINTS = 200;

export function sanitizeCameraPoints(input: unknown): CameraPoint[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, MAX_POINTS).map((raw, i) => {
    const p = raw as Partial<CameraPoint>;
    return {
      id: typeof p.id === 'string' ? p.id : `cam-${i}`,
      name: typeof p.name === 'string' ? p.name.slice(0, 60) : `Camera ${i + 1}`,
      type: ['DOME', 'BULLET', 'TURRET', 'PTZ'].includes(p.type as string) ? (p.type as CameraPoint['type']) : 'DOME',
      environment: p.environment === 'OUTDOOR' ? 'OUTDOOR' : 'INDOOR',
      resolutionMp: Number.isFinite(p.resolutionMp) ? Math.min(32, Math.max(1, Number(p.resolutionMp))) : 4,
      distanceFromNvrM: Number.isFinite(p.distanceFromNvrM) ? Math.max(0, Number(p.distanceFromNvrM)) : 0,
      lowLight: !!p.lowLight,
    };
  });
}

export function sanitizeCctvConfig(input: unknown): CctvConfig {
  const d = defaultCctvConfig();
  if (!input || typeof input !== 'object') return d;
  const c = input as Partial<CctvConfig>;
  return {
    frameRate: Number.isFinite(c.frameRate) ? Math.min(60, Math.max(1, Number(c.frameRate))) : d.frameRate,
    compression: c.compression === 'H264' || c.compression === 'H265' ? c.compression : d.compression,
    recordingMode: c.recordingMode === 'CONTINUOUS' || c.recordingMode === 'MOTION' ? c.recordingMode : d.recordingMode,
    motionActivityPct: Number.isFinite(c.motionActivityPct) ? Math.min(100, Math.max(1, Number(c.motionActivityPct))) : d.motionActivityPct,
    retentionDays: Number.isFinite(c.retentionDays) ? Math.min(365, Math.max(1, Number(c.retentionDays))) : d.retentionDays,
    usePoe: c.usePoe === undefined ? d.usePoe : !!c.usePoe,
    installBufferPct: Number.isFinite(c.installBufferPct) ? Math.min(1, Math.max(0, Number(c.installBufferPct))) : d.installBufferPct,
    clientName: typeof c.clientName === 'string' ? c.clientName.slice(0, 80) : d.clientName,
    siteName: typeof c.siteName === 'string' ? c.siteName.slice(0, 120) : d.siteName,
    notes: typeof c.notes === 'string' ? c.notes.slice(0, 600) : d.notes,
  };
}
