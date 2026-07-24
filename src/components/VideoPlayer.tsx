'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// Real HTML5 video player. Plays HLS adaptive streams (via hls.js on browsers
// without native support, e.g. Chrome/Firefox/Android; Safari/iOS plays HLS
// natively) as well as plain MP4 URLs. Tracks watch position and completion
// through the existing /api/progress endpoint, and resumes where the student
// left off. See src/lib/bunnyStream.ts for the video-hosting integration this
// is designed to pair with.
export default function VideoPlayer({ src, lessonId, initialSeconds = 0, title, watermark }: {
  src: string;
  lessonId: string;
  initialSeconds?: number;
  title: string;
  watermark: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastReportRef = useRef(0);
  const reportedCompleteRef = useRef(false);
  const router = useRouter();

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState('');

  // Attach the source — HLS via hls.js where needed, otherwise native playback.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    let hls: import('hls.js').default | undefined;

    const isHls = src.includes('.m3u8');
    const canPlayNativeHls = video.canPlayType('application/vnd.apple.mpegurl') !== '';

    if (isHls && !canPlayNativeHls) {
      import('hls.js').then(({ default: Hls }) => {
        if (!videoRef.current) return;
        if (Hls.isSupported()) {
          hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, (_evt, data) => {
            if (data.fatal) setError('This video failed to load. Please refresh the page.');
          });
        } else {
          setError('Your browser doesn’t support the video format used by this lesson.');
        }
      });
    } else {
      video.src = src;
    }

    return () => hls?.destroy();
  }, [src]);

  // Resume from last watched position once we know the video's duration.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onLoadedMeta = () => {
      setDuration(video.duration || 0);
      if (initialSeconds > 0 && initialSeconds < video.duration - 5) {
        video.currentTime = initialSeconds;
      }
    };
    video.addEventListener('loadedmetadata', onLoadedMeta);
    return () => video.removeEventListener('loadedmetadata', onLoadedMeta);
  }, [initialSeconds]);

  function reportProgress(completed: boolean, secondsWatched: number) {
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, completed, secondsWatched: Math.floor(secondsWatched) }),
    }).catch(() => {});
  }

  function onTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    setCurrent(video.currentTime);
    // Persist watch position at most once every 15s of real playback.
    if (video.currentTime - lastReportRef.current >= 15) {
      lastReportRef.current = video.currentTime;
      reportProgress(false, video.currentTime);
    }
  }

  function onEnded() {
    const video = videoRef.current;
    if (!video || reportedCompleteRef.current) return;
    reportedCompleteRef.current = true;
    reportProgress(true, video.duration || current);
    router.refresh();
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play(); else video.pause();
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Number(e.target.value);
    setCurrent(video.currentTime);
  }

  function cycleSpeed() {
    const options = [0.75, 1, 1.25, 1.5, 2];
    const next = options[(options.indexOf(speed) + 1) % options.length];
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  }

  function toggleFullscreen() {
    videoRef.current?.requestFullscreen?.();
  }

  function togglePip() {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else if (video.requestPictureInPicture) {
      video.requestPictureInPicture();
    }
  }

  const fmt = (s: number) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-ink shadow-lift">
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          className="h-full w-full"
          playsInline
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          onEnded={onEnded}
          onClick={togglePlay}
          onError={() => setError('This video failed to load. Please refresh the page or contact support.')}
        />
        <span className="pointer-events-none absolute right-3 top-3 select-none rounded bg-black/40 px-2 py-1 text-[10px] font-semibold tracking-wide text-white/60">
          {watermark} · SmartTech Academy
        </span>
        {error && (
          <div className="absolute inset-0 grid place-items-center bg-black/70 p-6 text-center text-sm text-white/90">{error}</div>
        )}
        {!playing && !error && (
          <button
            onClick={togglePlay}
            aria-label="Play"
            className="absolute inset-0 grid place-items-center bg-black/10 transition hover:bg-black/20"
          >
            <span className="grid h-20 w-20 place-items-center rounded-full bg-white/10 backdrop-blur transition hover:scale-105 hover:bg-accent-500">
              <span className="text-3xl text-white">▶</span>
            </span>
          </button>
        )}
        <div className="absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/80 to-transparent p-4">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={seek}
            className="h-1.5 w-full cursor-pointer accent-accent-500"
            aria-label="Seek"
          />
          <div className="flex items-center justify-between text-xs font-semibold text-white/80">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="hover:text-white">{playing ? 'Pause' : 'Play'}</button>
              <span>{fmt(current)} / {fmt(duration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={cycleSpeed} className="rounded bg-white/10 px-2 py-1 hover:bg-white/20">{speed}×</button>
              <button onClick={togglePip} className="rounded bg-white/10 px-2 py-1 hover:bg-white/20" title="Picture in picture">PiP</button>
              <button onClick={toggleFullscreen} className="rounded bg-white/10 px-2 py-1 hover:bg-white/20" title="Fullscreen">⛶</button>
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
