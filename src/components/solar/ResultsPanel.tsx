'use client';
import { useMemo } from 'react';
import { useCurrency, Price } from '@/components/CurrencyProvider';
import { formatPrice } from '@/lib/currency';
import { computeFinancing } from '@/lib/solar/finance';
import type { DesignResult, SiteConfig } from '@/lib/solar/types';

const WARN_STYLE: Record<string, string> = {
  info: 'bg-brand-50 text-brand-700 border-brand-200',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function ResultsPanel({ design, site }: { design: DesignResult; site: SiteConfig }) {
  const { code } = useCurrency();
  const financing = useMemo(
    () => (site.financingEnabled ? computeFinancing(design.totalUsd, design.estMonthlySavingsUsd, site) : null),
    [site, design.totalUsd, design.estMonthlySavingsUsd]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Array size" value={`${(design.arrayWpActual / 1000).toFixed(2)} kWp`} sub={`${design.panelCount} panels`} />
        <SummaryStat label="Battery bank" value={design.batteryTotalCount ? `${design.batteryUsableKwh.toFixed(1)} kWh` : 'None'} sub={design.batteryTotalCount ? `${design.batteryTotalCount} batteries` : 'Grid-tied'} />
        <SummaryStat label="Inverter" value={`${((design.inverter.continuousW * design.inverterCount) / 1000).toFixed(1)} kW`} sub={design.inverter.model} />
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
              <td colSpan={4} className="px-4 py-3 text-right font-bold text-ink">Total system cost ({code})</td>
              <td className="px-4 py-3 text-right font-display text-base font-bold text-brand-700"><Price cents={design.totalUsd * 100} /></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-3 font-display text-sm font-bold text-ink">Engineering detail</h3>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <Row k="Daily energy demand" v={`${(design.dailyEnergyWh / 1000).toFixed(2)} kWh`} />
            <Row k="Adjusted for losses" v={`${(design.dailyEnergyAdjustedWh / 1000).toFixed(2)} kWh`} />
            <Row k="Peak running load" v={`${(design.peakLoadW / 1000).toFixed(2)} kW`} />
            <Row k="Surge / start-up load" v={`${(design.surgeLoadW / 1000).toFixed(2)} kW`} />
            <Row k="Charge current" v={`${design.chargeCurrentA.toFixed(1)} A`} />
            <Row k="DC cable (indicative)" v={`${design.dcCableSizeMm2} mm²`} />
            <Row k="AC cable (indicative)" v={`${design.acCableSizeMm2} mm²`} />
          </dl>
        </div>
        <div className="card p-4">
          <h3 className="mb-3 font-display text-sm font-bold text-ink">Financials</h3>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <Row k="Est. monthly production" v={`${design.estMonthlyProductionKwh.toFixed(0)} kWh`} />
            <Row k="Est. monthly savings" v={<Price cents={design.estMonthlySavingsUsd * 100} />} />
            <Row k="Payback period" v={design.paybackYears ? `${design.paybackYears.toFixed(1)} years` : '—'} />
          </dl>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
            Indicative sizing and pricing for planning purposes. Final design must be verified by a
            qualified solar installer against local wiring regulations, roof structure and site survey.
          </p>
        </div>
      </div>

      {financing && (
        <div className="card p-4">
          <h3 className="mb-3 font-display text-sm font-bold text-ink">Financing vs. staying on grid</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="Monthly payment" value={<Price cents={financing.monthlyPaymentUsd * 100} />} sub={`${financing.months} months @ ${site.loanInterestRatePct}%`} />
            <SummaryStat
              label="Net monthly cash flow"
              value={`${financing.monthlyCashFlowUsd < 0 ? '-' : '+'}${formatPrice(Math.abs(financing.monthlyCashFlowUsd) * 100, code)}`}
              sub={financing.monthlyCashFlowUsd >= 0 ? 'Savings cover the payment' : 'Payment exceeds savings'}
            />
            <SummaryStat label="Total interest" value={<Price cents={financing.totalInterestUsd * 100} />} sub="over the loan term" />
            <SummaryStat
              label={financing.netPositionOverTermUsd >= 0 ? 'Net savings vs. grid' : 'Net cost vs. grid'}
              value={<Price cents={Math.abs(financing.netPositionOverTermUsd) * 100} />}
              sub={`over ${site.loanTermYears} yr${site.loanTermYears !== 1 ? 's' : ''}, vs. paying $${site.monthlyGridBillUsd}/mo`}
            />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
            Compares the down payment + loan repayments against what the same period would cost on the grid alone
            (monthly grid bill × loan term), using the estimated monthly solar savings above. Indicative only —
            not a credit offer.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
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
