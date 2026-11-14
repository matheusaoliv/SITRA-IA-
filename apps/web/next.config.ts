import type { NextConfig } from 'next';
import { loadEnvConfig } from '@next/env';

loadEnvConfig('../..'); // single .env at the monorepo root

// The browser talks to /api/v1 on its own origin and Next forwards to the API,
// so the session cookie stays first-party in development and production.
const apiOrigin = (process.env.SITRA_API_ORIGIN || 'http://localhost:3001').replace(/\/$/, '');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: `${apiOrigin}/api/v1/:path*` }];
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
};
export default nextConfig;
