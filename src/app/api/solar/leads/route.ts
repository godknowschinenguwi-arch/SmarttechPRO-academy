import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rateLimit';
import { insert } from '@/lib/db';
import { computeSystemDesign } from '@/lib/solar/engine';
import { sanitizeLoads, sanitizeSite, sanitizeCatalog } from '@/lib/solar/sanitize';

function str(v: unknown, maxLen: number): string {
  return typeof v === 'string' ? v.trim().slice(0, maxLen) : '';
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(`solar-lead:${clientIp(req)}`, 5, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests, please try again shortly.' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const name = str(body.name, 100);
  const phone = str(body.phone, 40);
  const email = str(body.email, 120);
  const city = str(body.city, 100);
  const message = str(body.message, 800);

  if (!name || !phone) {
    return NextResponse.json({ error: 'Name and phone number are required.' }, { status: 400 });
  }

  const loads = sanitizeLoads(body.loads);
  const site = sanitizeSite(body.site);
  const catalog = sanitizeCatalog(body.catalog);
  const design = computeSystemDesign(loads, site, {}, catalog);

  const id = await insert('SolarLead', {
    name,
    phone,
    email: email || null,
    city: city || null,
    message: message || null,
    systemType: site.systemType,
    totalUsd: design.totalUsd,
    arrayWpActual: design.arrayWpActual,
    batteryUsableKwh: design.batteryUsableKwh,
    loads: JSON.stringify(loads),
    site: JSON.stringify(site),
  });

  return NextResponse.json({ ok: true, id });
}
