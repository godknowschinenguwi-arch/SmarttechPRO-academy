import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-20 bg-brand-950 text-white">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 font-display text-sm font-bold">ST</span>
            <span className="font-display text-lg font-bold">SmartTech Academy</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/70">
            Building Africa’s next generation of skilled technicians. Learn online, practise hands-on, get certified.
          </p>
          <div className="mt-4 flex gap-3 text-white/70">
            {['Facebook', 'YouTube', 'WhatsApp', 'LinkedIn'].map((s) => (
              <a key={s} href="#" aria-label={s} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20">{s}</a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wide text-white/60">Learn</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li><Link href="/courses" className="hover:text-white">All Courses</Link></li>
            <li><Link href="/practicals" className="hover:text-white">Practical Training</Link></li>
            <li><Link href="/verify" className="hover:text-white">Verify a Certificate</Link></li>
            <li><Link href="/register" className="hover:text-white">Become a Student</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wide text-white/60">Support</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li><a href="mailto:support@smarttech.academy" className="hover:text-white">support@smarttech.academy</a></li>
            <li><a href="#" className="hover:text-white">Help Centre</a></li>
            <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wide text-white/60">Newsletter</h4>
          <p className="mt-4 text-sm text-white/70">Course launches, practical session dates and career tips. No spam.</p>
          <form className="mt-4 flex gap-2" action="#">
            <input type="email" required placeholder="Your email" className="w-full rounded-xl border-0 bg-white/10 px-4 py-2.5 text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-400" />
            <button className="rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-semibold hover:bg-accent-600">Join</button>
          </form>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-white/50">
        © {new Date().getFullYear()} SmartTech Academy · Harare · Bulawayo · Johannesburg
      </div>
    </footer>
  );
}
