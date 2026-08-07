import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rateLimit';
import { createLead } from '@/lib/leads';
import { computeWiringDesign } from '@/lib/wiring/engine';
import { sanitizeCircuits, sanitizeWiringConfig } from '@/lib/wiring/sanitize';

function str(v: unknown, maxLen: number): string {
  return typeof v === 'string' ? v.trim().slice(0, maxLen) : '';
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(`wiring-lead:${clientIp(req)}`, 5, 60 * 60_000);
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

  const circuits = sanitizeCircuits(body.circuits);
  const config = sanitizeWiringConfig(body.config);
  const design = computeWiringDesign(circuits, config);

  const summary = `Wiring · ${design.circuitCount} circuits · ${design.board.ways}-way DB`;
  const id = await createLead({
    source: 'WIRING',
    name,
    phone,
    email,
    city,
    message,
    summary,
    totalUsd: design.totalUsd,
    payload: { circuits, config },
  });

  return NextResponse.json({ ok: true, id });
}
