import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rateLimit';
import { computeSystemDesign, defaultSiteConfig } from '@/lib/solar/engine';
import { generateSolarProposalPdf } from '@/lib/solar/pdf';
import type { LoadItem, SiteConfig } from '@/lib/solar/types';

const MAX_LOADS = 200;

function sanitizeLoads(input: unknown): LoadItem[] {
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

function sanitizeSite(input: unknown): SiteConfig {
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
    clientName: typeof s.clientName === 'string' ? s.clientName.slice(0, 80) : d.clientName,
    siteName: typeof s.siteName === 'string' ? s.siteName.slice(0, 120) : d.siteName,
    notes: typeof s.notes === 'string' ? s.notes.slice(0, 600) : d.notes,
  };
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(`solar-pdf:${clientIp(req)}`, 20, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests, please try again shortly.' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const loads = sanitizeLoads(body.loads);
  const site = sanitizeSite(body.site);
  const design = computeSystemDesign(loads, site);

  const appUrl = new URL(req.url).origin;
  const pdfBytes = await generateSolarProposalPdf({ design, site, appUrl });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="SmartTech-Solar-Proposal.pdf"',
    },
  });
}
