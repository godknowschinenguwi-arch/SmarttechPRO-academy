export default function ProgressRing({ pct, size = 92 }: { pct: number; size?: number }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${pct}% complete`}>
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1b5ef5" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth="10" fill="none" />
      <circle
        className="ring-value" cx={size / 2} cy={size / 2} r={r} strokeWidth="10" fill="none"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(pct, 100) / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-ink font-display" fontSize={size / 4.6} fontWeight="700">
        {Math.round(pct)}%
      </text>
    </svg>
  );
}
