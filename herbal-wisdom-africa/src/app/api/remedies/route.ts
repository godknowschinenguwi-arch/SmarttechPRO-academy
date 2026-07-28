import { NextRequest, NextResponse } from 'next/server';
import { insert } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Please log in to share your experience.')}`, req.url),
      303,
    );
  }

  const form = await req.formData();
  const herbName = String(form.get('herbName') ?? '').trim();
  const herbLocalName = String(form.get('herbLocalName') ?? '').trim() || null;
  const condition = String(form.get('condition') ?? '').trim();
  const region = String(form.get('region') ?? '').trim() || null;
  const preparation = String(form.get('preparation') ?? '').trim();
  const dosage = String(form.get('dosage') ?? '').trim() || null;
  const outcome = String(form.get('outcome') ?? '').trim();

  if (!herbName || !condition || !preparation || !outcome) {
    return NextResponse.redirect(
      new URL(`/remedies/new?error=${encodeURIComponent('Please fill in the required fields.')}`, req.url),
      303,
    );
  }

  const id = await insert('Remedy', {
    authorId: user.id,
    herbName,
    herbLocalName,
    condition,
    region,
    preparation,
    dosage,
    outcome,
    status: 'PUBLISHED',
  });

  return NextResponse.redirect(new URL(`/remedies/${id}`, req.url), 303);
}
