/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["api.your-domain.com"],
    formats: ["image/avif", "image/webp"], // Enhanced formats
  },
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "your-production-domain.com"],
    },
  },
};

module.exports = nextConfig;
