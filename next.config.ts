import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static shell + streamed holes + tag invalidation (ADR 0002 / 0003).
  cacheComponents: true,
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
