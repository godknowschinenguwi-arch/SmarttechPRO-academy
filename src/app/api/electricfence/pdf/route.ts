import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rateLimit';
import { computeFenceDesign } from '@/lib/electricfence/engine';
import { generateFenceProposalPdf } from '@/lib/electricfence/pdf';
import { sanitizeZones, sanitizeFenceConfig } from '@/lib/electricfence/sanitize';

export async function POST(req: NextRequest) {
  const limited = rateLimit(`fence-pdf:${clientIp(req)}`, 20, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests, please try again shortly.' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const zones = sanitizeZones(body.zones);
  const config = sanitizeFenceConfig(body.config);
  const design = computeFenceDesign(zones, config);

  const appUrl = new URL(req.url).origin;
  const pdfBytes = await generateFenceProposalPdf({ design, config, appUrl });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="SmartTech-ElectricFence-Proposal.pdf"',
    },
  });
}
