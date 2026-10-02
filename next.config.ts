import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Images are served from our own API as data URLs / API routes; no remote images needed.
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
