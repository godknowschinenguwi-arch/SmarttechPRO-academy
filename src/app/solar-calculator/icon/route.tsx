import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

// Generates the Solar Calculator's PWA icon at any requested size, drawn from
// shapes only (no external font/emoji fetches) so it works fully offline at build time.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const size = Math.min(1024, Math.max(32, Number(searchParams.get('size')) || 512));
  const maskable = searchParams.get('maskable') === '1';

  const outerPad = maskable ? size * 0.2 : size * 0.1;
  const content = size - outerPad * 2;
  const badge = content * 0.4;

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1b5ef5 0%, #142457 100%)',
          borderRadius: maskable ? 0 : size * 0.22,
        }}
      >
        <div style={{ display: 'flex', width: content, height: content, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              color: '#ffffff',
              fontSize: content * 0.46,
              fontWeight: 800,
              fontFamily: 'sans-serif',
              letterSpacing: -2,
            }}
          >
            ST
          </div>
          <div
            style={{
              position: 'absolute',
              right: -badge * 0.18,
              bottom: -badge * 0.18,
              width: badge,
              height: badge,
              borderRadius: 9999,
              background: '#f97316',
              border: `${Math.max(2, size * 0.012)}px solid #ffffff`,
              display: 'flex',
            }}
          />
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
