'use client';
import { Price } from '@/components/CurrencyProvider';
import type { WiringDesignResult } from '@/lib/wiring/types';

const WARN_STYLE: Record<string, string> = {
  info: 'bg-brand-50 text-brand-700 border-brand-200',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function WiringResultsPanel({ design }: { design: WiringDesignResult }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Circuits" value={String(design.circuitCount)} sub={`${design.totalDbWays} DB ways`} />
        <SummaryStat label="DB" value={`${design.board.ways}-way`} sub={design.board.model} />
        <SummaryStat label="Cable" value={`${design.totalCableLengthM.toFixed(0)}m`} sub={`${design.conduitSticksNeeded} × ${design.conduit.lengthM}m conduit`} />
        <SummaryStat label="System cost" value={<Price cents={design.totalUsd * 100} />} sub="incl. install buffer" />
      </div>

      {design.warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {design.warnings.map((w, i) => (
            <div key={i} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${WARN_STYLE[w.level]}`}>
              {w.level === 'critical' ? '⛔' : w.level === 'warn' ? '⚠️' : 'ℹ️'} {w.message}
            </div>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="border-b border-surface-line bg-surface-soft px-4 py-2.5">
          <h3 className="font-display text-sm font-bold text-ink">Circuit schedule</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-line text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-2">Circuit</th>
              <th className="px-4 py-2">Cable</th>
              <th className="px-4 py-2">Breaker</th>
              <th className="px-4 py-2 text-right">Design current</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-line">
            {design.circuitLines.map((line) => (
              <tr key={line.circuit.id}>
                <td className="px-4 py-2.5 font-semibold text-ink">{line.circuit.name}</td>
                <td className="px-4 py-2.5 text-ink-faint">{line.cable.csaMm2}mm²</td>
                <td className="px-4 py-2.5 text-ink-faint">{line.breaker.ampRating}A {line.breaker.type}</td>
                <td className="px-4 py-2.5 text-right">{line.requiredCurrentA.toFixed(1)}A</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-surface-line bg-surface-soft px-4 py-2.5">
          <h3 className="font-display text-sm font-bold text-ink">Bill of materials</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-line text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Detail</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2 text-right">Unit</th>
              <th className="px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-line">
            {design.bom.map((line, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5 font-semibold text-ink">{line.label}</td>
                <td className="px-4 py-2.5 text-ink-faint">{line.detail}</td>
                <td className="px-4 py-2.5 text-right">{line.qty}</td>
                <td className="px-4 py-2.5 text-right"><Price cents={line.unitPriceUsd * 100} /></td>
                <td className="px-4 py-2.5 text-right font-bold"><Price cents={line.totalUsd * 100} /></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-surface-line">
              <td colSpan={4} className="px-4 py-2 text-right text-ink-faint">Equipment subtotal</td>
              <td className="px-4 py-2 text-right font-semibold"><Price cents={design.equipmentTotalUsd * 100} /></td>
            </tr>
            <tr>
              <td colSpan={4} className="px-4 py-2 text-right text-ink-faint">Install &amp; contingency buffer</td>
              <td className="px-4 py-2 text-right font-semibold"><Price cents={design.installBufferUsd * 100} /></td>
            </tr>
            <tr className="border-t border-surface-line bg-surface-soft">
              <td colSpan={4} className="px-4 py-3 text-right font-bold text-ink">Total system cost</td>
              <td className="px-4 py-3 text-right font-display text-base font-bold text-brand-700"><Price cents={design.totalUsd * 100} /></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="card p-4">
        <h3 className="mb-3 font-display text-sm font-bold text-ink">Engineering detail</h3>
        <dl className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-4">
          <Row k="Switches" v={String(design.switchCount)} />
          <Row k="Socket outlets" v={String(design.socketOutletCount)} />
          <Row k="Light fittings" v={String(design.lightFittingCount)} />
          <Row k="Junction boxes" v={String(design.junctionBoxCount)} />
          <Row k="Earth leakage" v={design.earthLeakage ? design.earthLeakage.model : 'Not fitted'} />
          <Row k="Main isolator" v={design.mainIsolator ? design.mainIsolator.model : '—'} />
        </dl>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
          Indicative sizing and pricing for planning purposes, based on declared loads and typical residential
          design currents. Final circuit design, cable derating, earthing and compliance must be verified by a
          qualified electrician against local wiring regulations.
        </p>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-ink-faint">{k}</dt>
      <dd className="text-right font-semibold text-ink">{v}</dd>
    </>
  );
}

function SummaryStat({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <div className="card p-3 text-center">
      <p className="font-display text-lg font-bold text-brand-700">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-0.5 truncate text-[11px] text-ink-faint" title={sub}>{sub}</p>
    </div>
  );
}
