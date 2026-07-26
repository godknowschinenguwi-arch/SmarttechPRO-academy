// Shared request-payload sanitizers for the solar API routes — the client sends
// back its full loads/site state, so every field is treated as untrusted input.
import { defaultSiteConfig } from './engine';
import type { LoadItem, SiteConfig, SolarCatalog, CatalogPanel, CatalogBattery, CatalogInverter, CatalogController } from './types';

const MAX_LOADS = 200;
const MAX_CATALOG_ITEMS = 100;

export function sanitizeLoads(input: unknown): LoadItem[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, MAX_LOADS).map((raw, i) => {
    const l = raw as Partial<LoadItem>;
    return {
      id: typeof l.id === 'string' ? l.id : `load-${i}`,
      applianceId: typeof l.applianceId === 'string' ? l.applianceId : 'custom',
      name: typeof l.name === 'string' ? l.name.slice(0, 60) : 'Load',
      category: typeof l.category === 'string' ? l.category.slice(0, 40) : 'Custom',
      icon: typeof l.icon === 'string' ? l.icon.slice(0, 4) : '⚙️',
      watts: Number.isFinite(l.watts) ? Math.max(0, Number(l.watts)) : 0,
      qty: Number.isFinite(l.qty) ? Math.max(0, Number(l.qty)) : 0,
      hours: Number.isFinite(l.hours) ? Math.min(24, Math.max(0, Number(l.hours))) : 0,
      surgeFactor: Number.isFinite(l.surgeFactor) ? Math.max(1, Number(l.surgeFactor)) : 1,
      essential: !!l.essential,
    };
  });
}

export function sanitizeSite(input: unknown): SiteConfig {
  const d = defaultSiteConfig();
  if (!input || typeof input !== 'object') return d;
  const s = input as Partial<SiteConfig>;
  return {
    locationId: typeof s.locationId === 'string' ? s.locationId : d.locationId,
    psh: Number.isFinite(s.psh) ? Math.min(9, Math.max(1, Number(s.psh))) : d.psh,
    systemType: s.systemType === 'OFF_GRID' || s.systemType === 'HYBRID' || s.systemType === 'GRID_TIED' ? s.systemType : d.systemType,
    autonomyDays: Number.isFinite(s.autonomyDays) ? Math.min(10, Math.max(0, Number(s.autonomyDays))) : d.autonomyDays,
    batteryChemistry: ['LFP', 'AGM', 'GEL', 'FLOODED'].includes(s.batteryChemistry as string) ? (s.batteryChemistry as SiteConfig['batteryChemistry']) : d.batteryChemistry,
    systemVoltage: [12, 24, 48].includes(s.systemVoltage as number) ? (s.systemVoltage as SiteConfig['systemVoltage']) : d.systemVoltage,
    panelDeratingPct: Number.isFinite(s.panelDeratingPct) ? Math.min(1, Math.max(0.1, Number(s.panelDeratingPct))) : d.panelDeratingPct,
    inverterEfficiencyPct: Number.isFinite(s.inverterEfficiencyPct) ? Math.min(1, Math.max(0.1, Number(s.inverterEfficiencyPct))) : d.inverterEfficiencyPct,
    wiringLossPct: Number.isFinite(s.wiringLossPct) ? Math.min(0.5, Math.max(0, Number(s.wiringLossPct))) : d.wiringLossPct,
    installBufferPct: Number.isFinite(s.installBufferPct) ? Math.min(1, Math.max(0, Number(s.installBufferPct))) : d.installBufferPct,
    monthlyGridBillUsd: Number.isFinite(s.monthlyGridBillUsd) ? Math.max(0, Number(s.monthlyGridBillUsd)) : d.monthlyGridBillUsd,
    tariffUsdPerKwh: Number.isFinite(s.tariffUsdPerKwh) ? Math.max(0, Number(s.tariffUsdPerKwh)) : d.tariffUsdPerKwh,
    financingEnabled: !!s.financingEnabled,
    downPaymentUsd: Number.isFinite(s.downPaymentUsd) ? Math.max(0, Number(s.downPaymentUsd)) : d.downPaymentUsd,
    loanTermYears: Number.isFinite(s.loanTermYears) ? Math.min(15, Math.max(0.5, Number(s.loanTermYears))) : d.loanTermYears,
    loanInterestRatePct: Number.isFinite(s.loanInterestRatePct) ? Math.min(100, Math.max(0, Number(s.loanInterestRatePct))) : d.loanInterestRatePct,
    clientName: typeof s.clientName === 'string' ? s.clientName.slice(0, 80) : d.clientName,
    siteName: typeof s.siteName === 'string' ? s.siteName.slice(0, 120) : d.siteName,
    notes: typeof s.notes === 'string' ? s.notes.slice(0, 600) : d.notes,
  };
}

function num(v: unknown, fallback = 0): number {
  return Number.isFinite(v as number) ? Number(v) : fallback;
}
function str(v: unknown, fallback: string, maxLen = 80): string {
  return typeof v === 'string' && v.trim() ? v.slice(0, maxLen) : fallback;
}

// The client passes back the catalog it rendered with (fetched server-side on
// page load), so PDF/assistant numbers match what's on screen. Returns
// undefined when absent/malformed so callers fall back to the default catalog.
export function sanitizeCatalog(input: unknown): SolarCatalog | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const c = input as Partial<Record<keyof SolarCatalog, unknown>>;

  const panels: CatalogPanel[] = Array.isArray(c.panels)
    ? c.panels.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const p = raw as Partial<CatalogPanel>;
        return {
          id: str(p.id, `panel-${i}`, 40), brand: str(p.brand, 'Panel'), model: str(p.model, 'Panel'),
          wattage: num(p.wattage), vmp: num(p.vmp), imp: num(p.imp), voc: num(p.voc), isc: num(p.isc),
          priceUsd: num(p.priceUsd),
        };
      })
    : [];

  const batteries: CatalogBattery[] = Array.isArray(c.batteries)
    ? c.batteries.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const b = raw as Partial<CatalogBattery>;
        return {
          id: str(b.id, `battery-${i}`, 40), brand: str(b.brand, 'Battery'), model: str(b.model, 'Battery'),
          chemistry: (['LFP', 'AGM', 'GEL', 'FLOODED'] as string[]).includes(b.chemistry ?? '') ? (b.chemistry as CatalogBattery['chemistry']) : 'LFP',
          voltage: num(b.voltage), ah: num(b.ah), maxDodPct: num(b.maxDodPct, 0.5), roundTripEff: num(b.roundTripEff, 0.85),
          cycleLife: num(b.cycleLife), priceUsd: num(b.priceUsd),
        };
      })
    : [];

  const inverters: CatalogInverter[] = Array.isArray(c.inverters)
    ? c.inverters.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const v = raw as Partial<CatalogInverter>;
        const voltageOptions = Array.isArray(v.voltageOptions)
          ? v.voltageOptions.filter((x): x is CatalogInverter['voltageOptions'][number] => x === 12 || x === 24 || x === 48)
          : [];
        return {
          id: str(v.id, `inverter-${i}`, 40), brand: str(v.brand, 'Inverter'), model: str(v.model, 'Inverter'),
          type: (['OFF_GRID', 'HYBRID', 'GRID_TIE'] as string[]).includes(v.type ?? '') ? (v.type as CatalogInverter['type']) : 'HYBRID',
          continuousW: num(v.continuousW), surgeW: num(v.surgeW), voltageOptions: voltageOptions.length ? voltageOptions : [48],
          mpptBuiltIn: !!v.mpptBuiltIn, efficiencyPct: num(v.efficiencyPct, 0.9), priceUsd: num(v.priceUsd),
        };
      })
    : [];

  const controllers: CatalogController[] = Array.isArray(c.controllers)
    ? c.controllers.slice(0, MAX_CATALOG_ITEMS).map((raw, i) => {
        const k = raw as Partial<CatalogController>;
        return {
          id: str(k.id, `controller-${i}`, 40), brand: str(k.brand, 'Controller'), model: str(k.model, 'Controller'),
          type: k.type === 'PWM' ? 'PWM' : 'MPPT', maxAmps: num(k.maxAmps), maxPvVoltage: num(k.maxPvVoltage), priceUsd: num(k.priceUsd),
        };
      })
    : [];

  if (!panels.length || !batteries.length || !inverters.length) return undefined;
  return { panels, batteries, inverters, controllers };
}
