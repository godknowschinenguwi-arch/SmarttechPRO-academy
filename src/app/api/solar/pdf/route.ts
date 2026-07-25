import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rateLimit';
import { computeSystemDesign } from '@/lib/solar/engine';
import { generateSolarProposalPdf } from '@/lib/solar/pdf';
import { sanitizeLoads, sanitizeSite, sanitizeCatalog } from '@/lib/solar/sanitize';

export async function POST(req: NextRequest) {
  const limited = rateLimit(`solar-pdf:${clientIp(req)}`, 20, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests, please try again shortly.' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const loads = sanitizeLoads(body.loads);
  const site = sanitizeSite(body.site);
  const catalog = sanitizeCatalog(body.catalog);
  const design = computeSystemDesign(loads, site, {}, catalog);

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
