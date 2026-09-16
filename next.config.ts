import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  // Compress responses
  compress: true,

  // Production image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],  // serve WebP/AVIF instead of JPEG
    minimumCacheTTL: 86400,                  // cache images 24h
    dangerouslyAllowSVG: false,
  },

  // Smaller bundle: drop source maps in prod
  productionBrowserSourceMaps: false,

  // Silence the middleware deprecation noise in CI
  experimental: {
    optimizePackageImports: ['lucide-react', 'swiper'],
  },
};

export default nextConfig;
