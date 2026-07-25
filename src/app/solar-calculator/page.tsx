import type { Metadata } from 'next';
import SolarCalculatorApp from './SolarCalculatorApp';

export const metadata: Metadata = {
  title: 'Solar Calculator & System Designer — SmartTech Academy',
  description:
    'Pro-grade solar system sizing tool: build a load profile, size panels, batteries, inverters and controllers, see a live wiring diagram, and export a branded proposal PDF.',
};

export default function SolarCalculatorPage() {
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
      <div className="container-x -mt-6">
        <SolarCalculatorApp />
      </div>
    </div>
  );
}
