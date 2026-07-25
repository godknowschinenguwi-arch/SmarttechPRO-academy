'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStandalone } from '@/lib/solar/useStandalone';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaBar() {
  const standalone = useStandalone();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/solar-calculator-sw.js', { scope: '/solar-calculator/' }).catch(() => {});
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  if (standalone) {
    return (
      <div className="flex items-center justify-between bg-brand-950 px-4 py-2 text-xs font-semibold text-white/80">
        <span className="flex items-center gap-1.5">⚡ SmartTech Solar — installed app</span>
        <Link href="/" className="text-white hover:underline">Exit to SmartTech Academy →</Link>
      </div>
    );
  }

  if (installPrompt && !dismissed) {
    return (
      <div className="flex items-center justify-between gap-3 bg-accent-500 px-4 py-2 text-xs font-semibold text-white sm:text-sm">
        <span>📲 Install SmartTech Solar as its own app — works offline once installed.</span>
        <div className="flex items-center gap-2">
          <button onClick={install} className="rounded-lg bg-white/20 px-3 py-1.5 hover:bg-white/30">Install</button>
          <button onClick={() => setDismissed(true)} className="text-white/80 hover:text-white" aria-label="Dismiss">✕</button>
        </div>
      </div>
    );
  }

  return null;
}
