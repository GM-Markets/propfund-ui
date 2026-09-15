import path from "node:path";

import type { NextConfig } from "next";

const emptyStubAbs = path.join(__dirname, "lib/stubs/empty-module.js");
const emptyStubRel = "./lib/stubs/empty-module.js";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required for the multi-stage Docker image (copies `.next/standalone`).
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  turbopack: {
    resolveAlias: {
      "@farcaster/mini-app-solana": emptyStubRel,
      "@react-native-async-storage/async-storage": emptyStubRel,
    },
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@farcaster/mini-app-solana": emptyStubAbs,
      "@react-native-async-storage/async-storage": emptyStubAbs,
    };
    if (isServer) {
      config.externals = [...(config.externals ?? []), "@farcaster/mini-app-solana"];
    }
    // Suppress dynamic-require warnings from viem's tempo chain (ox/virtualMasterPool).
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /ox\/_esm\/tempo\/internal\/virtualMasterPool/ },
    ];
    return config;
  },
};

export default nextConfig;
