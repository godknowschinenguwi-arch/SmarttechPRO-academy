/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure the SQL schema ships with serverless bundles (read at boot by src/lib/db.ts)
  experimental: {
    outputFileTracingIncludes: { '/**': ['./prisma/schema.sql'] },
  },
  images: {
    // In production, point this at your CDN / object storage domain(s)
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

module.exports = nextConfig;
