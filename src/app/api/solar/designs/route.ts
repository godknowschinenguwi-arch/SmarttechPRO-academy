import { NextRequest, NextResponse } from 'next/server';
import { all, insert } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { sanitizeLoads, sanitizeSite } from '@/lib/solar/sanitize';

const MAX_DESIGNS_PER_USER = 50;

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await all<{ id: string; name: string; loads: string; site: string; createdAt: string; updatedAt: string }>(
    'SELECT id, name, loads, site, createdAt, updatedAt FROM SolarDesign WHERE userId = ? ORDER BY updatedAt DESC',
    [user.id]
  );
  const designs = rows.map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    loads: JSON.parse(r.loads),
    site: JSON.parse(r.site),
  }));
  return NextResponse.json({ designs });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 80) : 'Untitled design';
  const loads = sanitizeLoads(body.loads);
  const site = sanitizeSite(body.site);

  const existing = await all<{ id: string }>('SELECT id FROM SolarDesign WHERE userId = ?', [user.id]);
  if (existing.length >= MAX_DESIGNS_PER_USER) {
    return NextResponse.json({ error: `You can save up to ${MAX_DESIGNS_PER_USER} designs. Delete one first.` }, { status: 400 });
  }

  const id = await insert('SolarDesign', {
    userId: user.id,
    name,
    loads: JSON.stringify(loads),
    site: JSON.stringify(site),
  });

  return NextResponse.json({ id, name, loads, site });
}
