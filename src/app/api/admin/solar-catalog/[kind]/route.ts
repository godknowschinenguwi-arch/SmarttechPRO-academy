import { NextRequest, NextResponse } from 'next/server';
import { CATALOG_STORES } from '@/lib/solar/catalogDb';
import { requireAdmin, isCatalogKind, coerceCatalogFields, REQUIRED_FIELDS } from '@/lib/solar/adminCatalog';

export async function POST(req: NextRequest, { params }: { params: { kind: string } }) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { kind } = params;
  if (!isCatalogKind(kind)) return NextResponse.json({ error: 'Unknown catalog kind' }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const missing = REQUIRED_FIELDS[kind].filter((f) => !(f in body));
  if (missing.length > 0) return NextResponse.json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 });

  const fields = coerceCatalogFields(kind, body);
  const id = await CATALOG_STORES[kind].create(fields as never);
  return NextResponse.json({ id }, { status: 201 });
}
