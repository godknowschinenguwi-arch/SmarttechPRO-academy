import type { Metadata } from 'next';
import WiringCalculatorApp from './WiringCalculatorApp';

export const metadata: Metadata = {
  title: 'House Wiring & Conduit Calculator — SmartTech Academy',
  description:
    'Pro-grade house wiring estimator: build a circuit schedule, size cable, breakers, the distribution board and conduit/tubing, and export a branded proposal — for installers and technicians.',
};

export default function WiringCalculatorPage() {
  return (
    <div className="bg-surface-soft pb-16">
      <div className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 py-12 text-white">
        <div className="container-x flex flex-col gap-3">
          <span className="chip w-fit bg-white/15 text-white backdrop-blur">🔧 SmartTech Electrical</span>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">House Wiring &amp; Conduit Calculator</h1>
          <p className="max-w-2xl text-sm text-brand-100 sm:text-base">
            Build a real circuit schedule, size cable, breakers, the distribution board and conduit/tubing, and
            export a branded proposal — for installers and technicians.
          </p>
        </div>
      </div>
      <div className="container-x -mt-6 flex flex-col gap-6">
        <WiringCalculatorApp />
      </div>
    </div>
  );
}
