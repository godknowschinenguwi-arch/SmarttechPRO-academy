'use client';
import { Price } from '@/components/CurrencyProvider';
import type { UpgradeResult } from '@/lib/solar/types';

const WARN_STYLE: Record<string, string> = {
  info: 'bg-brand-50 text-brand-700 border-brand-200',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function UpgradeResults({ upgrade }: { upgrade: UpgradeResult }) {
  const { target, existing } = upgrade;
  const noAdditions = upgrade.bom.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="card overflow-hidden">
        <div className="border-b border-surface-line bg-surface-soft px-4 py-2.5">
          <h3 className="font-display text-sm font-bold text-ink">Existing vs. required</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-line text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-2">Component</th>
              <th className="px-4 py-2 text-right">You have</th>
              <th className="px-4 py-2 text-right">Required</th>
              <th className="px-4 py-2 text-right">Gap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-line">
            <tr>
              <td className="px-4 py-2.5 font-semibold text-ink">Array</td>
              <td className="px-4 py-2.5 text-right">{(existing.arrayWp / 1000).toFixed(2)} kWp</td>
              <td className="px-4 py-2.5 text-right">{(target.arrayWpNeeded / 1000).toFixed(2)} kWp</td>
              <td className="px-4 py-2.5 text-right font-bold text-brand-700">
                {upgrade.gapArrayWp > 0 ? `+${upgrade.additionalPanelCount} × ${upgrade.panel.wattage}W` : 'None'}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-semibold text-ink">Battery</td>
              <td className="px-4 py-2.5 text-right">{existing.batteryUsableKwh.toFixed(1)} kWh</td>
              <td className="px-4 py-2.5 text-right">{target.batteryUsableKwh.toFixed(1)} kWh</td>
              <td className="px-4 py-2.5 text-right font-bold text-brand-700">
                {upgrade.gapBatteryKwh > 0 ? `+${upgrade.additionalBatteryCount} × ${upgrade.battery.model.split(' ').slice(-1)[0]}` : 'None'}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-semibold text-ink">Inverter</td>
              <td className="px-4 py-2.5 text-right">{(existing.inverterContinuousW / 1000).toFixed(1)} kW</td>
              <td className="px-4 py-2.5 text-right">{((target.peakLoadW * 1.25) / 1000).toFixed(1)} kW</td>
              <td className="px-4 py-2.5 text-right font-bold text-brand-700">{upgrade.inverterOk ? 'None' : 'Upgrade needed'}</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-semibold text-ink">Charge controller</td>
              <td className="px-4 py-2.5 text-right">{existing.hasController ? `${existing.controllerMaxAmps} A` : 'None / built-in'}</td>
              <td className="px-4 py-2.5 text-right">{target.controller ? `${target.chargeCurrentA.toFixed(0)} A` : 'N/A'}</td>
              <td className="px-4 py-2.5 text-right font-bold text-brand-700">
                {upgrade.controllerOk ? 'None' : `+${upgrade.additionalChargeCurrentA.toFixed(0)} A`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={`card p-4 ${upgrade.inverterOk ? '' : 'border-amber-200'}`}>
          <h3 className="mb-2 font-display text-sm font-bold text-ink">Inverter</h3>
          <p className="text-sm text-ink-soft">{upgrade.inverterRecommendation}</p>
        </div>
        <div className={`card p-4 ${upgrade.controllerOk ? '' : 'border-amber-200'}`}>
          <h3 className="mb-2 font-display text-sm font-bold text-ink">Charge controller</h3>
          <p className="text-sm text-ink-soft">{upgrade.controllerRecommendation}</p>
          {!upgrade.controllerOk && (
            <p className="mt-2 text-[11px] text-ink-faint">Indicative added-branch cable size: {upgrade.dcCableSizeMm2} mm²</p>
          )}
        </div>
      </div>

      {upgrade.warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {upgrade.warnings.map((w, i) => (
            <div key={i} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${WARN_STYLE[w.level]}`}>
              {w.level === 'critical' ? '⛔' : w.level === 'warn' ? '⚠️' : 'ℹ️'} {w.message}
            </div>
          ))}
        </div>
      )}

      {!noAdditions && (
        <div className="card overflow-hidden">
          <div className="border-b border-surface-line bg-surface-soft px-4 py-2.5">
            <h3 className="font-display text-sm font-bold text-ink">Recommended additions</h3>
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
              {upgrade.bom.map((line, i) => (
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
              <tr className="border-t border-surface-line bg-surface-soft">
                <td colSpan={4} className="px-4 py-3 text-right font-bold text-ink">Total upgrade cost</td>
                <td className="px-4 py-3 text-right font-display text-base font-bold text-brand-700"><Price cents={upgrade.additionsTotalUsd * 100} /></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
