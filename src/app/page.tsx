import Link from 'next/link';
import CourseCard from '@/components/CourseCard';
import { listCourses, listCategories } from '@/lib/queries';
import { all } from '@/lib/db';

export default async function HomePage() {
  const [courses, categories, testimonials] = await Promise.all([
    listCourses(),
    listCategories(),
    all<any>(
      `SELECT r.rating, r.comment, u.name AS userName, u.headline, c.title AS courseTitle
       FROM Review r JOIN User u ON u.id = r.userId JOIN Course c ON c.id = r.courseId
       ORDER BY r.rating DESC, r.createdAt DESC LIMIT 3`
    ),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(600px_circle_at_80%_20%,#1b5ef5_0%,transparent_60%),radial-gradient(500px_circle_at_10%_90%,#f97316_0%,transparent_55%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="container-x relative grid items-center gap-12 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="chip bg-white/10 text-accent-300">🎓 Certification-first vocational training</span>
            <h1 className="h-display mt-5 text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
              Become a Certified <span className="text-accent-400">CCTV Installation</span> Technician
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">
              Learn online at your own pace, then prove your skills at hands-on practical sessions in Harare,
              Bulawayo and Johannesburg. Building Africa’s next generation of skilled technicians.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/courses/cctv-installation-technician" className="btn-accent !px-7 !py-3.5 text-base">Enroll Now</Link>
              <Link href="/courses" className="btn !px-7 !py-3.5 text-base bg-white/10 text-white hover:bg-white/20">Browse Courses</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-8 text-sm">
              {[['8,500+', 'Students trained'], ['96%', 'Completion satisfaction'], ['3 cities', 'Practical centres']].map(([n, l]) => (
                <div key={l}>
                  <p className="font-display text-2xl font-bold text-white">{n}</p>
                  <p className="text-white/60">{l}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Video banner mock */}
          <div className="relative">
            <div className="card overflow-hidden !border-white/10 !bg-white/5 backdrop-blur">
              <div className="relative aspect-video bg-[radial-gradient(ellipse_at_center,#1b3a75_0%,#0b1526_75%)]">
                <div className="absolute inset-0 grid place-items-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-accent-500 text-2xl shadow-lift">▶</span>
                </div>
                <span className="absolute bottom-3 left-3 rounded bg-black/50 px-2 py-1 text-xs text-white/80">Technicians at work — watch the trailer</span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-white/10 text-center text-xs text-white/70">
                {['🎥 42 HD lessons', '🛠 Hands-on practicals', '📜 Verified certificate'].map((t) => (
                  <div key={t} className="px-2 py-3">{t}</div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl bg-white p-4 shadow-lift md:block">
              <p className="text-xs font-bold text-ink-faint">NEXT PRACTICAL DAY</p>
              <p className="font-display text-sm font-bold text-ink">Harare · 12 seats</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-x py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="h-display text-2xl sm:text-3xl">Explore by category</h2>
            <p className="mt-2 text-ink-faint">Practical skills that get you hired — or help you start your own business.</p>
          </div>
          <Link href="/courses" className="hidden text-sm font-bold text-brand-600 hover:text-brand-800 sm:block">View all →</Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((c) => (
            <Link key={c.id} href={`/courses?category=${c.slug}`} className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
              <span className="text-3xl">{c.icon}</span>
              <p className="mt-3 font-display text-sm font-bold group-hover:text-brand-700">{c.name}</p>
              <p className="mt-1 text-xs text-ink-faint">{c.courseCount} course{Number(c.courseCount) === 1 ? '' : 's'}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured courses */}
      <section className="bg-white py-16">
        <div className="container-x">
          <h2 className="h-display text-2xl sm:text-3xl">Featured courses</h2>
          <p className="mt-2 text-ink-faint">Job-ready programmes with downloadable toolkits and optional practical days.</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((c, i) => (
              <CourseCard key={c.id} course={c} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-x py-16">
        <h2 className="h-display text-center text-2xl sm:text-3xl">Online theory. Hands-on practice. Real certification.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            ['1', '📱', 'Learn online', 'HD videos, notes, quizzes and assignments — on any device, at your pace.'],
            ['2', '🛠️', 'Book a practical', 'Choose your city and date, pay the balance, get your attendance slip.'],
            ['3', '🎯', 'Get assessed', 'Instructors assess your hands-on work at real installation rigs.'],
            ['4', '📜', 'Get certified', 'Earn a QR-verifiable certificate employers can trust.'],
          ].map(([n, icon, title, body]) => (
            <div key={n} className="card relative p-6">
              <span className="absolute -top-3 left-6 grid h-7 w-7 place-items-center rounded-full bg-accent-500 text-xs font-bold text-white">{n}</span>
              <span className="text-3xl">{icon}</span>
              <h3 className="mt-3 font-display font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-faint">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-brand-950 py-16 text-white">
        <div className="container-x">
          <h2 className="h-display text-2xl text-white sm:text-3xl">Student success stories</h2>
          <p className="mt-2 text-white/60">Real outcomes from students who trained with us.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <figure key={i} className="rounded-2xl bg-white/5 p-6 backdrop-blur">
                <p className="text-amber-400">{'★'.repeat(Number(t.rating))}</p>
                <blockquote className="mt-3 text-sm leading-7 text-white/85">“{t.comment}”</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 font-bold">
                    {String(t.userName).charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{t.userName}</p>
                    <p className="text-xs text-white/50">{t.courseTitle}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Partners + CTA */}
      <section className="container-x py-16 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Companies that trust SmartTech Academy</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 font-display text-lg font-bold text-ink-faint/60">
          <span>SecureVision ZW</span><span>PowerGrid Solar</span><span>NetLink Africa</span><span>SafeCity Group</span><span>Jetstream IoT</span>
        </div>
        <div className="mx-auto mt-14 max-w-2xl rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-10 text-white shadow-lift">
          <h2 className="h-display text-2xl text-white sm:text-3xl">Start your technician career today</h2>
          <p className="mt-3 text-white/75">Join thousands of students building practical, employable skills.</p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/register" className="btn-accent !px-7">Create Free Account</Link>
            <Link href="/courses" className="btn bg-white/10 text-white hover:bg-white/20">Browse Courses</Link>
          </div>
        </div>
      </section>
    </>
  );
}
