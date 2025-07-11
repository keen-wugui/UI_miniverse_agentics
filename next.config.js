/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Move serverComponentsExternalPackages to root level
  serverExternalPackages: ['@tanstack/react-query'],
  experimental: {
    // Enable Partial Prerendering for Next.js 15 (requires canary version)
    // ppr: true,
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3001", "your-production-domain.com"],
    },
  },
  // Move turbo config to turbopack
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  images: {
    domains: ["api.your-domain.com"],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

module.exports = nextConfig;
