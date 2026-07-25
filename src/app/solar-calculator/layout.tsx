import type { Metadata, Viewport } from 'next';
import PwaBar from '@/components/solar/PwaBar';

export const metadata: Metadata = {
  manifest: '/solar-calculator/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Solar Calculator',
  },
  icons: {
    icon: [
      { url: '/solar-calculator/icon?size=192', sizes: '192x192', type: 'image/png' },
      { url: '/solar-calculator/icon?size=512', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/solar-calculator/icon?size=180', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#1449e1',
};

export default function SolarCalculatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PwaBar />
      {children}
    </>
  );
}
