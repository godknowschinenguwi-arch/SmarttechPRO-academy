import { NextRequest, NextResponse } from 'next/server';
import { getCertificate } from '@/lib/queries';
import { generateCertificatePdf } from '@/lib/certificatePdf';

// Public by serial — anyone holding the serial can download (same trust model as the verify page).
export async function GET(_req: NextRequest, { params }: { params: { serial: string } }) {
  const cert = await getCertificate(decodeURIComponent(params.serial));
  if (!cert) return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });

  const pdf = await generateCertificatePdf({
    serial: cert.serial,
    studentName: cert.studentName,
    courseTitle: cert.courseTitle,
    instructorName: cert.instructorName,
    hoursCompleted: cert.hoursCompleted,
    issuedAt: cert.issuedAt,
    kind: cert.kind,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://smarttech-pro-academy.vercel.app',
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="SmartTech-Certificate-${cert.serial}.pdf"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
