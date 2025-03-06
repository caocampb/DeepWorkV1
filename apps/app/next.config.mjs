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
      
      // Handle specific import paths
      config.resolve.alias = {
        ...config.resolve.alias,
        '@v1/ui': path.join(mockPath, 'ui'),
        '@v1/ui/globals.css': path.join(mockPath, 'ui/globals.css'),
        '@v1/ui/button': path.join(mockPath, 'ui/button'),
        '@v1/ui/cn': path.join(mockPath, 'ui/cn'),
        '@v1/ui/icons': path.join(mockPath, 'ui/icons'),
        '@v1/supabase': path.join(mockPath, 'supabase'),
        '@v1/analytics': path.join(mockPath, 'analytics'),
        '@v1/kv': path.join(mockPath, 'kv'),
        '@v1/logger': path.join(mockPath, 'logger'),
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
