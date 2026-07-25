'use client';
import type { DesignResult, SiteConfig } from '@/lib/solar/types';

function Node({
  x, y, w, h, title, lines, tone = 'blue',
}: {
  x: number; y: number; w: number; h: number; title: string; lines: string[]; tone?: 'blue' | 'orange' | 'ink';
}) {
  const stroke = tone === 'orange' ? '#ea580c' : tone === 'ink' ? '#3d4c63' : '#1449e1';
  const fill = tone === 'orange' ? '#fff7ed' : tone === 'ink' ? '#f5f8fc' : '#eef6ff';
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + 22} textAnchor="middle" fontSize={12.5} fontWeight={700} fill="#0b1526">{title}</text>
      {lines.map((l, i) => (
        <text key={i} x={x + w / 2} y={y + 40 + i * 15} textAnchor="middle" fontSize={10.5} fill="#68778f">{l}</text>
      ))}
    </g>
  );
}

function Flow({ d, color, active = true }: { d: string; color: string; active?: boolean }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeDasharray="6 6"
      strokeLinecap="round"
      className={active ? 'solar-flow' : undefined}
      opacity={active ? 1 : 0.25}
    />
  );
}

export default function SystemDiagram({ design, site }: { design: DesignResult; site: SiteConfig }) {
  const isGridTied = site.systemType === 'GRID_TIED';
  const hasBattery = !isGridTied;
  const hasGrid = site.systemType !== 'OFF_GRID';
  const hasController = !!design.controller;

  return (
    <div className="card overflow-x-auto p-4">
      <style>{`
        .solar-flow { animation: solar-dash 1.1s linear infinite; }
        @keyframes solar-dash { to { stroke-dashoffset: -24; } }
      `}</style>
      <svg viewBox="0 0 920 300" className="min-w-[760px] w-full" role="img" aria-label="System wiring diagram">
        {/* Sun */}
        <circle cx={50} cy={60} r={20} fill="#fdba74" stroke="#ea580c" strokeWidth={1.5} />
        <text x={50} y={95} textAnchor="middle" fontSize={10} fontWeight={700} fill="#ea580c">SUN</text>

        <Flow d="M70,60 C 100,60 100,90 130,90" color="#f97316" />

        {/* Panels */}
        <Node x={130} y={60} w={140} h={60} title="PV Array" tone="orange"
          lines={[`${design.panelCount} × ${design.panel.wattage}W`, `${(design.arrayWpActual / 1000).toFixed(2)} kWp`]} />

        <Flow d={`M270,90 L ${hasController ? 340 : 380},90`} color="#f97316" />

        {/* Controller (optional) */}
        {hasController && (
          <>
            <Node x={340} y={60} w={110} h={60} title="Charge Ctrl" tone="ink"
              lines={[design.controller!.type, `${design.chargeCurrentA.toFixed(0)} A`]} />
            <Flow d="M450,90 L 500,90" color="#1449e1" />
          </>
        )}

        {/* Battery */}
        {hasBattery && (
          <Node x={hasController ? 500 : 380} y={hasController ? 60 : 150} w={130} h={70} title="Battery Bank" tone="blue"
            lines={[
              `${design.batteryTotalCount} × ${design.battery.model.split(' ').slice(-1)[0]}`,
              `${design.batteryUsableKwh.toFixed(1)} kWh usable`,
            ]}
          />
        )}

        {/* Wire from battery / controller into inverter */}
        {hasBattery ? (
          <Flow
            d={hasController ? 'M630,95 C 680,95 680,150 720,150' : 'M270,90 C 400,90 400,185 500,185'}
            color="#1449e1"
          />
        ) : (
          <Flow d="M270,90 C 400,90 400,150 500,150" color="#f97316" />
        )}

        {/* Inverter */}
        <Node x={hasBattery ? 720 : 500} y={130} w={140} h={70} title="Inverter" tone="blue"
          lines={[`${design.inverter.model}`, `${(design.inverter.continuousW * design.inverterCount / 1000).toFixed(1)} kW`]}
        />

        {/* Grid tie-in */}
        {hasGrid && (
          <>
            <Node x={hasBattery ? 720 : 500} y={20} w={140} h={50} title="Utility Grid" tone="ink" lines={[`$${site.tariffUsdPerKwh.toFixed(2)}/kWh`]} />
            <Flow d={`M${hasBattery ? 790 : 570},70 L ${hasBattery ? 790 : 570},130`} color="#68778f" active={false} />
          </>
        )}

        {/* Inverter -> Loads */}
        <Flow d={`M${hasBattery ? 790 : 570},200 L ${hasBattery ? 790 : 570},250`} color="#ea580c" />
        <Node x={hasBattery ? 690 : 470} y={250} w={200} h={40} title="Loads" tone="orange"
          lines={[`${(design.peakLoadW / 1000).toFixed(2)} kW peak · ${(design.dailyEnergyWh / 1000).toFixed(1)} kWh/day`]}
        />
      </svg>
      <div className="mt-3 flex flex-wrap gap-4 text-[11px] font-semibold text-ink-faint">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent-500" /> DC / solar path</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-600" /> Battery path</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ink-faint" /> Grid (standby)</span>
      </div>
    </div>
  );
}
