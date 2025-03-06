import "./src/env.mjs";
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@v1/supabase"],
  experimental: {
    instrumentationHook: process.env.NODE_ENV === "production",
  },
  webpack: (config, { isServer, dev }) => {
    // Only replace workspace packages in production build
    if (!dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@v1/ui': require.resolve('./src/mocks/index.ts') + '?mockUI',
        '@v1/supabase': require.resolve('./src/mocks/index.ts') + '?mockSupabase',
        '@v1/analytics': require.resolve('./src/mocks/index.ts') + '?mockAnalytics',
        '@v1/kv': require.resolve('./src/mocks/index.ts') + '?mockKV',
        '@v1/logger': require.resolve('./src/mocks/index.ts') + '?mockLogger',
      };
    }
    
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  tunnelRoute: "/monitoring",
});
