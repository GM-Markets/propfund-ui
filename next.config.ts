import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required for the multi-stage Docker image (copies `.next/standalone`).
  output: "standalone",
  // A second dev server or a measurement build can use its own output folder
  // (`NEXT_DIST_DIR=.next-perf next dev -p 3500`) so it never shares `.next`
  // with the dev server someone else is already running.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  // `pnpm dev` runs Turbopack, which compiles a route in about a second where
  // webpack took several after an edit. It prints a notice about the webpack
  // block below; that block only matters to `next build`, and Turbopack
  // resolves the optional dependency on its own. `pnpm dev:webpack` is the
  // fallback if a Turbopack-specific problem ever turns up.
  webpack(config) {
    // Optional peer of the sign-in SDK (Farcaster mini-app Solana wallets),
    // never used here. Resolve it to an empty module instead of a build warning.
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@farcaster/mini-app-solana": false,
    };
    return config;
  },
};

export default nextConfig;
