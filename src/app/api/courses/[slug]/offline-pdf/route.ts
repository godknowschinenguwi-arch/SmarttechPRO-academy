import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getCourse, getEnrollment } from '@/lib/queries';
import { generateCourseOfflinePdf } from '@/lib/offlinePdf';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });

  const data = await getCourse(params.slug);
  if (!data) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
  const { course, modules, lessons } = data;

  const enrollment = await getEnrollment(user.id, course.id);
  const isOwnerInstructor = user.role === 'INSTRUCTOR' && course.instructorId === user.id;
  if (!enrollment && user.role !== 'ADMIN' && !isOwnerInstructor) {
    return NextResponse.json({ error: 'Enroll in this course to download the offline pack.' }, { status: 403 });
  }

  const pdf = await generateCourseOfflinePdf({ course, modules, lessons });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="SmartTech-${course.slug}-offline-pack.pdf"`,
    },
  });
}
