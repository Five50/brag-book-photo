import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'canvas' module on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
      };
    }
    
    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      type: 'asset/source',
    });
    
    return config;
  },
};

export default nextConfig;
