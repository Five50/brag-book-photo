import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Don't resolve 'canvas' module on the client side
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          canvas: false,
          fs: false,
        },
      };
    }
    
    // Ignore canvas warnings for server-side
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    
    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      type: 'asset/source',
    });
    
    return config;
  },
};

export default nextConfig;
