import { NextRequest, NextResponse } from 'next/server';
import { all, insert } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { sanitizeCameraPoints, sanitizeCctvConfig } from '@/lib/cctv/sanitize';

const MAX_DESIGNS_PER_USER = 50;

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await all<{ id: string; name: string; points: string; config: string; createdAt: string; updatedAt: string }>(
    'SELECT id, name, points, config, createdAt, updatedAt FROM CctvDesign WHERE userId = ? ORDER BY updatedAt DESC',
    [user.id]
  );
  const designs = rows.map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    points: JSON.parse(r.points),
    config: JSON.parse(r.config),
  }));
  return NextResponse.json({ designs });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 80) : 'Untitled design';
  const points = sanitizeCameraPoints(body.points);
  const config = sanitizeCctvConfig(body.config);

  const existing = await all<{ id: string }>('SELECT id FROM CctvDesign WHERE userId = ?', [user.id]);
  if (existing.length >= MAX_DESIGNS_PER_USER) {
    return NextResponse.json({ error: `You can save up to ${MAX_DESIGNS_PER_USER} designs. Delete one first.` }, { status: 400 });
  }

  const id = await insert('CctvDesign', {
    userId: user.id,
    name,
    points: JSON.stringify(points),
    config: JSON.stringify(config),
  });

  return NextResponse.json({ id, name, points, config });
}
