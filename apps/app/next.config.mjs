import "./src/env.mjs";
import { withSentryConfig } from "@sentry/nextjs";
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent of __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@v1/supabase"],
  experimental: {
    instrumentationHook: process.env.NODE_ENV === "production",
  },
  webpack: (config, { isServer, dev }) => {
    // Only replace workspace packages in production build
    if (!dev) {
      const mockPath = path.join(__dirname, 'src/mocks/index.ts');
      config.resolve.alias = {
        ...config.resolve.alias,
        '@v1/ui': mockPath,
        '@v1/supabase': mockPath,
        '@v1/analytics': mockPath,
        '@v1/kv': mockPath,
        '@v1/logger': mockPath,
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
