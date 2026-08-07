import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rateLimit';
import { computeWiringDesign } from '@/lib/wiring/engine';
import { generateWiringProposalPdf } from '@/lib/wiring/pdf';
import { sanitizeCircuits, sanitizeWiringConfig } from '@/lib/wiring/sanitize';

export async function POST(req: NextRequest) {
  const limited = rateLimit(`wiring-pdf:${clientIp(req)}`, 20, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests, please try again shortly.' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const circuits = sanitizeCircuits(body.circuits);
  const config = sanitizeWiringConfig(body.config);
  const design = computeWiringDesign(circuits, config);

  const appUrl = new URL(req.url).origin;
  const pdfBytes = await generateWiringProposalPdf({ design, config, appUrl });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="SmartTech-Wiring-Proposal.pdf"',
    },
  });
}
