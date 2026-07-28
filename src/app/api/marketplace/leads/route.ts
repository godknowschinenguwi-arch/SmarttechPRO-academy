import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [open, mine] = await Promise.all([
    all<{ id: string; source: string; summary: string; city: string | null; totalUsd: number; createdAt: string }>(
      "SELECT id, source, summary, city, totalUsd, createdAt FROM Lead WHERE status = 'NEW' ORDER BY createdAt DESC LIMIT 200"
    ),
    all<{
      id: string; source: string; name: string; phone: string; email: string | null; city: string | null;
      message: string | null; summary: string; totalUsd: number; status: string; claimedAt: string | null; createdAt: string;
    }>(
      'SELECT id, source, name, phone, email, city, message, summary, totalUsd, status, claimedAt, createdAt FROM Lead WHERE claimedByUserId = ? ORDER BY claimedAt DESC LIMIT 200',
      [user.id]
    ),
  ]);

  return NextResponse.json({ open, mine });
}
