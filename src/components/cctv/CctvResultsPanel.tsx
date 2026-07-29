'use client';
import { Price } from '@/components/CurrencyProvider';
import { ANY_BRAND } from '@/lib/cctv/types';
import type { CctvDesignResult, CctvConfig } from '@/lib/cctv/types';

const WARN_STYLE: Record<string, string> = {
  info: 'bg-brand-50 text-brand-700 border-brand-200',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function CctvResultsPanel({ design, config }: { design: CctvDesignResult; config: CctvConfig }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <SummaryStat label="System" value={config.systemType === 'IP' ? 'IP' : 'Analog'} sub={config.brand === ANY_BRAND ? 'Any brand' : config.brand} />
        <SummaryStat label="Cameras" value={String(design.cameraCount)} sub={`${design.totalBitrateMbps.toFixed(0)} Mbps total`} />
        <SummaryStat label="Storage" value={`${design.totalStorageTb.toFixed(1)} TB`} sub={`${design.hddCount} × ${design.hdd.model}`} />
        <SummaryStat label={config.systemType === 'IP' ? 'NVR' : 'DVR'} value={`${design.nvr.channels}CH`} sub={design.nvr.model} />
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
              <td colSpan={4} className="px-4 py-3 text-right font-bold text-ink">Total system cost</td>
              <td className="px-4 py-3 text-right font-display text-base font-bold text-brand-700"><Price cents={design.totalUsd * 100} /></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="card p-4">
        <h3 className="mb-3 font-display text-sm font-bold text-ink">Engineering detail</h3>
        <dl className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-4">
          <Row k="Daily storage" v={`${design.dailyStorageGb.toFixed(1)} GB/day`} />
          <Row k="PoE budget" v={design.totalPoeW > 0 ? `${design.totalPoeW.toFixed(0)} W` : 'N/A'} />
          <Row k="Cable required" v={`${design.cableSpoolsNeeded} × ${design.cable.spoolLengthM}m`} />
          <Row k="PoE switch" v={design.poeSwitch ? design.poeSwitch.model : 'Not needed'} />
        </dl>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
          Indicative sizing and pricing for planning purposes. Storage and bandwidth estimates assume typical
          scene complexity — final design must be verified by a qualified installer against lens field-of-view,
          lighting conditions and local surveillance/privacy regulations.
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
