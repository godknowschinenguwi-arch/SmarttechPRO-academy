const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  // Bunny Stream (video hosting) serves manifests/segments from *.b-cdn.net —
  // needed by hls.js's fetches (connect-src) and native <video>/blob: playback (media-src).
  "media-src 'self' blob: https://*.b-cdn.net",
  "connect-src 'self' https://*.b-cdn.net",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure the SQL schema ships with serverless bundles (read at boot by src/lib/db.ts)
  experimental: {
    outputFileTracingIncludes: { '/**': ['./prisma/schema.sql'] },
  },
  images: {
    // No remote image domains are in use yet (course covers are served from
    // /public). Add trusted hostnames here once a real photo/video CDN is chosen.
    remotePatterns: [],
  },
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

module.exports = nextConfig;
