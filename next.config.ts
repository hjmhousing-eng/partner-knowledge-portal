import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static shell + streamed holes + tag invalidation (ADR 0002 / 0003).
  cacheComponents: true,
};

export default nextConfig;
