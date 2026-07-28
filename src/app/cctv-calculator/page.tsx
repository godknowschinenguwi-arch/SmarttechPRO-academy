import type { Metadata } from 'next';
import Link from 'next/link';
import CctvCalculatorApp from './CctvCalculatorApp';

export const metadata: Metadata = {
  title: 'CCTV Calculator & System Designer — SmartTech Academy',
  description:
    'Pro-grade CCTV sizing tool: build a camera point profile, size storage, bandwidth, PoE budget, cabling and the NVR against a live equipment catalogue, and export a branded proposal.',
};

export default function CctvCalculatorPage() {
  return (
    <div className="bg-surface-soft pb-16">
      <div className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 py-12 text-white">
        <div className="container-x flex flex-col gap-3">
          <span className="chip w-fit bg-white/15 text-white backdrop-blur">📹 SmartTech Security</span>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">CCTV Calculator &amp; System Designer</h1>
          <p className="max-w-2xl text-sm text-brand-100 sm:text-base">
            Build a real camera point profile, size storage, bandwidth, PoE budget, cabling and the NVR against a
            live equipment catalogue, and export a branded proposal — for installers and technicians.
          </p>
        </div>
      </div>
      <div className="container-x -mt-6 flex flex-col gap-6">
        <CctvCalculatorApp />

        <Link
          href="/courses/cctv-installation-technician"
          className="card group flex flex-col items-start gap-3 border-brand-200 bg-brand-50 p-5 transition hover:-translate-y-0.5 hover:shadow-lift sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Learn to do this yourself</p>
            <p className="mt-1 font-display text-base font-bold text-ink">CCTV Installation Technician course</p>
            <p className="mt-1 text-sm text-ink-faint">
              Camera placement, cabling, NVR configuration and smart events — SmartTech Academy&apos;s hands-on CCTV
              programme.
            </p>
          </div>
          <span className="chip shrink-0 bg-brand-600 text-white group-hover:bg-brand-700">View course →</span>
        </Link>
      </div>
    </div>
  );
}
