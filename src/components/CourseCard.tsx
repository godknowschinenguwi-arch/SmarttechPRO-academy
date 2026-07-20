import Link from 'next/link';
import { Price } from './CurrencyProvider';
import Stars from './Stars';
import type { CourseCardData } from '@/lib/queries';

const DIFF_STYLE: Record<string, string> = {
  BEGINNER: 'bg-emerald-50 text-emerald-700',
  INTERMEDIATE: 'bg-amber-50 text-amber-700',
  ADVANCED: 'bg-rose-50 text-rose-700',
};

const GRADIENTS = [
  'from-brand-600 to-brand-900',
  'from-accent-500 to-rose-600',
  'from-cyan-500 to-brand-700',
  'from-violet-500 to-brand-800',
  'from-emerald-500 to-teal-700',
];

export default function CourseCard({ course, index = 0 }: { course: CourseCardData; index?: number }) {
  return (
    <Link href={`/courses/${course.slug}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
      <div className={`relative flex h-40 items-end overflow-hidden bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} p-4`}>
        {course.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.imageUrl} alt={course.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        )}
        {!course.imageUrl && <span className="absolute right-3 top-3 text-3xl drop-shadow">{course.categoryIcon ?? '🎓'}</span>}
        <span className="relative chip bg-black/35 text-white backdrop-blur">{course.categoryName}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className={`chip ${DIFF_STYLE[course.difficulty] ?? 'bg-surface-soft text-ink-soft'}`}>
            {course.difficulty.charAt(0) + course.difficulty.slice(1).toLowerCase()}
          </span>
          <span className="text-ink-faint">⏱ {course.durationHours} hrs</span>
        </div>
        <h3 className="font-display text-base font-bold leading-snug group-hover:text-brand-700">{course.title}</h3>
        <p className="text-sm text-ink-faint">{course.instructorName}</p>
        <div className="flex items-center gap-2 text-sm">
          {course.rating ? (
            <>
              <span className="font-bold text-amber-600">{Number(course.rating).toFixed(1)}</span>
              <Stars value={Number(course.rating)} />
              <span className="text-xs text-ink-faint">({course.reviewCount})</span>
            </>
          ) : (
            <span className="chip bg-brand-50 text-brand-700">New</span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-surface-line pt-3">
          <span className="text-xs text-ink-faint">👥 {Number(course.studentCount).toLocaleString()} students</span>
          <Price cents={course.priceCents} className="font-display text-lg font-bold text-brand-700" />
        </div>
      </div>
    </Link>
  );
}
