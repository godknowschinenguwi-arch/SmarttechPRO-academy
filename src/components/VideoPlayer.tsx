'use client';
import { useState } from 'react';

// Professional player shell. In production this wraps a HLS stream (Mux/Cloudflare Stream)
// with signed URLs, captions, quality selection and watermarking — see docs/ARCHITECTURE.md.
export default function VideoPlayer({ title, watermark }: { title: string; watermark: string }) {
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState('720p');
  const [playing, setPlaying] = useState(false);
  const [captions, setCaptions] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl bg-ink shadow-lift">
      <div className="relative aspect-video">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#1b3a75_0%,#0b1526_70%)]" />
        <span className="absolute right-3 top-3 select-none rounded bg-black/40 px-2 py-1 text-[10px] font-semibold tracking-wide text-white/60">
          {watermark} · SmartTech Academy
        </span>
        <div className="absolute inset-0 grid place-items-center">
          <button
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? 'Pause' : 'Play'}
            className="grid h-20 w-20 place-items-center rounded-full bg-white/10 backdrop-blur transition hover:scale-105 hover:bg-accent-500"
          >
            <span className="text-3xl text-white">{playing ? '❚❚' : '▶'}</span>
          </button>
        </div>
        {captions && (
          <div className="absolute inset-x-0 bottom-16 text-center">
            <span className="rounded bg-black/70 px-3 py-1 text-sm text-white">…and that’s how we terminate a BNC connector properly.</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-[35%] rounded-full bg-accent-500" />
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-white/80">
            <div className="flex items-center gap-3">
              <button onClick={() => setPlaying(!playing)} className="hover:text-white">{playing ? 'Pause' : 'Play'}</button>
              <span>04:12 / 11:58</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSpeed(speed === 2 ? 0.75 : speed === 0.75 ? 1 : speed === 1 ? 1.25 : speed === 1.25 ? 1.5 : 2)}
                className="rounded bg-white/10 px-2 py-1 hover:bg-white/20"
              >
                {speed}×
              </button>
              <button
                onClick={() => setQuality(quality === '1080p' ? '480p' : quality === '480p' ? '720p' : '1080p')}
                className="rounded bg-white/10 px-2 py-1 hover:bg-white/20"
              >
                {quality}
              </button>
              <button onClick={() => setCaptions(!captions)} className={`rounded px-2 py-1 ${captions ? 'bg-accent-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}>CC</button>
              <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/20" title="Picture in picture">PiP</button>
              <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/20" title="Fullscreen">⛶</button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between bg-ink px-4 py-3 text-xs text-white/50">
        <span>{title}</span>
        <span>Shortcuts: Space = play · ←/→ = seek · F = fullscreen</span>
      </div>
    </div>
  );
}
