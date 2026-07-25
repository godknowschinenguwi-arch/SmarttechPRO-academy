import { NextRequest, NextResponse } from 'next/server';
import { CATALOG_STORES } from '@/lib/solar/catalogDb';
import { requireAdmin, isCatalogKind, coerceCatalogFields } from '@/lib/solar/adminCatalog';

export async function PATCH(req: NextRequest, { params }: { params: { kind: string; id: string } }) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { kind, id } = params;
  if (!isCatalogKind(kind)) return NextResponse.json({ error: 'Unknown catalog kind' }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const fields = coerceCatalogFields(kind, body);
  await CATALOG_STORES[kind].update(id, fields as never);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { kind: string; id: string } }) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { kind, id } = params;
  if (!isCatalogKind(kind)) return NextResponse.json({ error: 'Unknown catalog kind' }, { status: 400 });

  await CATALOG_STORES[kind].remove(id);
  return NextResponse.json({ ok: true });
}
