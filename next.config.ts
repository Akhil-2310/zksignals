import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Reduce deployment size significantly
  serverExternalPackages: [
    '@semaphore-protocol/core',
    '@semaphore-protocol/proof',
    '@zk-email/sdk',
    'snarkjs',
    'ffjavascript',
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Optimize client-side bundles
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // Ignore node-specific modules
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }
    
    return config;
  },
  // Increase serverless function size limit
  serverRuntimeConfig: {
    maxDuration: 60, // Increase timeout for proof generation
  },
};

export default nextConfig;