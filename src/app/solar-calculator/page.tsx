import type { Metadata } from 'next';
import Link from 'next/link';
import SolarCalculatorApp from './SolarCalculatorApp';
import { getActiveSolarCatalog } from '@/lib/solar/loadCatalog';

export const metadata: Metadata = {
  title: 'Solar Calculator & System Designer — SmartTech Academy',
  description:
    'Pro-grade solar system sizing tool: build a load profile, size panels, batteries, inverters and controllers, see a live wiring diagram, and export a branded proposal PDF.',
};

export default async function SolarCalculatorPage() {
  const catalog = await getActiveSolarCatalog();

  return (
    <div className="bg-surface-soft pb-16">
      <div className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 py-12 text-white">
        <div className="container-x flex flex-col gap-3">
          <span className="chip w-fit bg-white/15 text-white backdrop-blur">⚡ SmartTech Solar</span>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Solar Calculator &amp; System Designer</h1>
          <p className="max-w-2xl text-sm text-brand-100 sm:text-base">
            Build a real load profile, size your array, battery bank, inverter and charge controller against a
            live equipment catalogue, watch the wiring diagram update in real time, and export a branded proposal —
            all in one tool built for installers and technicians.
          </p>
        </div>
      </div>
      <div className="container-x -mt-6 flex flex-col gap-6">
        <SolarCalculatorApp catalog={catalog} />

        <Link
          href="/courses/solar-installation-professional"
          className="card group flex flex-col items-start gap-3 border-brand-200 bg-brand-50 p-5 transition hover:-translate-y-0.5 hover:shadow-lift sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Learn to do this yourself</p>
            <p className="mt-1 font-display text-base font-bold text-ink">Professional Solar Installation course</p>
            <p className="mt-1 text-sm text-ink-faint">
              Go from sizing a system on paper to installing, commissioning and troubleshooting it on site —
              SmartTech Academy&apos;s hands-on Solar PV programme.
            </p>
          </div>
          <span className="chip shrink-0 bg-brand-600 text-white group-hover:bg-brand-700">View course →</span>
        </Link>
      </div>
    </div>
  );
}
