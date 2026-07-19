import Link from 'next/link';
import CourseCard from '@/components/CourseCard';
import { listCourses, listCategories } from '@/lib/queries';

export default async function CoursesPage({ searchParams }: { searchParams: { category?: string } }) {
  const [courses, categories] = await Promise.all([listCourses(searchParams.category), listCategories()]);
  const active = searchParams.category;

  return (
    <div className="container-x py-12">
      <h1 className="h-display text-3xl">Course catalogue</h1>
      <p className="mt-2 text-ink-faint">Every course includes downloadable resources, quizzes and a verifiable certificate.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/courses" className={`chip ${!active ? 'bg-brand-600 text-white' : 'bg-white text-ink-soft border border-surface-line hover:border-brand-300'}`}>
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/courses?category=${c.slug}`}
            className={`chip ${active === c.slug ? 'bg-brand-600 text-white' : 'bg-white text-ink-soft border border-surface-line hover:border-brand-300'}`}
          >
            {c.icon} {c.name}
          </Link>
        ))}
      </div>

      {courses.length === 0 ? (
        <div className="card mt-10 p-10 text-center text-ink-faint">
          No courses in this category yet — new academies are coming soon.
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
        </div>
      )}
    </div>
  );
}
