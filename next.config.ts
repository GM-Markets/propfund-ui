import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required for the multi-stage Docker image (copies `.next/standalone`).
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
};

export default nextConfig;
