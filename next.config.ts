import type { NextConfig } from "next";

const enableSourceMap = process.env.NEXT_ENABLE_SOURCE_MAP === "true";

const nextConfig: NextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: enableSourceMap,
};

export default nextConfig;
