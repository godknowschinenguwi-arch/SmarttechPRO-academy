'use client';
import { useEffect, useState } from 'react';

/** True when the page is running as an installed PWA (standalone display mode). */
export function useStandalone(): boolean {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const update = () => setStandalone(mq.matches || iosStandalone);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return standalone;
}
