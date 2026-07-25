import { NextResponse } from 'next/server';

// Served explicitly (rather than via the app/manifest.ts convention, which
// only generates a route at the app root) so the manifest can be scoped to
// /solar-calculator and install as its own app, separate from the Academy site.
export function GET() {
  return NextResponse.json(
    {
      name: 'SmartTech Solar Calculator',
      short_name: 'Solar Calc',
      description: 'Pro-grade solar system sizing and design tool — load profiles, equipment sizing, live wiring diagrams and branded proposal PDFs.',
      start_url: '/solar-calculator',
      scope: '/solar-calculator',
      display: 'standalone',
      orientation: 'portrait-primary',
      background_color: '#f5f8fc',
      theme_color: '#1449e1',
      categories: ['utilities', 'productivity', 'business'],
      icons: [
        { src: '/solar-calculator/icon?size=192', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/solar-calculator/icon?size=512', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/solar-calculator/icon?size=512&maskable=1', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } }
  );
}
