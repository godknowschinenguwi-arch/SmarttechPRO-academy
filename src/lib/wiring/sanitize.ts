// Shared request-payload sanitizers for the wiring calculator API routes —
// the client sends back its full circuits/config state, so every field is
// treated as untrusted input.
import { defaultWiringConfig } from './engine';
import type { WiringCircuit, WiringConfig } from './types';

const MAX_CIRCUITS = 100;

export function sanitizeCircuits(input: unknown): WiringCircuit[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, MAX_CIRCUITS).map((raw, i) => {
    const c = raw as Partial<WiringCircuit>;
    return {
      id: typeof c.id === 'string' ? c.id : `ckt-${i}`,
      name: typeof c.name === 'string' ? c.name.slice(0, 60) : `Circuit ${i + 1}`,
      type: ['LIGHTING', 'SOCKET', 'DEDICATED'].includes(c.type as string) ? (c.type as WiringCircuit['type']) : 'LIGHTING',
      points: Number.isFinite(c.points) ? Math.min(30, Math.max(1, Number(c.points))) : 1,
      dedicatedLoadW: Number.isFinite(c.dedicatedLoadW) ? Math.min(30000, Math.max(0, Number(c.dedicatedLoadW))) : 0,
      cableRunM: Number.isFinite(c.cableRunM) ? Math.max(0, Number(c.cableRunM)) : 0,
    };
  });
}

export function sanitizeWiringConfig(input: unknown): WiringConfig {
  const d = defaultWiringConfig();
  if (!input || typeof input !== 'object') return d;
  const c = input as Partial<WiringConfig>;
  return {
    earthLeakageEnabled: c.earthLeakageEnabled === undefined ? d.earthLeakageEnabled : !!c.earthLeakageEnabled,
    surgeProtectionEnabled: !!c.surgeProtectionEnabled,
    conduitMounting: c.conduitMounting === 'SURFACE' ? 'SURFACE' : 'CHASED',
    spareDbWaysPct: Number.isFinite(c.spareDbWaysPct) ? Math.min(1, Math.max(0, Number(c.spareDbWaysPct))) : d.spareDbWaysPct,
    installBufferPct: Number.isFinite(c.installBufferPct) ? Math.min(1, Math.max(0, Number(c.installBufferPct))) : d.installBufferPct,
    clientName: typeof c.clientName === 'string' ? c.clientName.slice(0, 80) : d.clientName,
    siteName: typeof c.siteName === 'string' ? c.siteName.slice(0, 120) : d.siteName,
    notes: typeof c.notes === 'string' ? c.notes.slice(0, 600) : d.notes,
  };
}
