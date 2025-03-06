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
      const mockPath = path.join(__dirname, 'src/mocks');
      config.resolve.alias = {
        ...config.resolve.alias,
        '@v1/ui': path.join(mockPath, 'ui.ts'),
        '@v1/supabase': path.join(mockPath, 'supabase.ts'),
        '@v1/analytics': path.join(mockPath, 'analytics.ts'),
        '@v1/kv': path.join(mockPath, 'kv.ts'),
        '@v1/logger': path.join(mockPath, 'logger.ts'),
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

// Skip Sentry in development
const config = process.env.NODE_ENV === 'development' 
  ? nextConfig 
  : withSentryConfig(nextConfig, {
      silent: !process.env.CI,
      telemetry: false,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
      tunnelRoute: "/monitoring",
    });

export default config;
