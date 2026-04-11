import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres"],
  transpilePackages: ["mapbox-gl"],
};

export default nextConfig;
