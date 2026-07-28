import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rateLimit';
import { computeCctvDesign } from '@/lib/cctv/engine';
import { generateCctvProposalPdf } from '@/lib/cctv/pdf';
import { sanitizeCameraPoints, sanitizeCctvConfig } from '@/lib/cctv/sanitize';

export async function POST(req: NextRequest) {
  const limited = rateLimit(`cctv-pdf:${clientIp(req)}`, 20, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests, please try again shortly.' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const points = sanitizeCameraPoints(body.points);
  const config = sanitizeCctvConfig(body.config);
  const design = computeCctvDesign(points, config);

  const appUrl = new URL(req.url).origin;
  const pdfBytes = await generateCctvProposalPdf({ design, config, appUrl });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="SmartTech-CCTV-Proposal.pdf"',
    },
  });
}
