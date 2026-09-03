import type { NextConfig } from "next";
import { baselineResponseHeaders, privateResponseHeaders } from "./src/lib/authority/response-security";

const privateRoutePatterns = [
  "/app",
  "/app/:path*",
  "/auth/:path*",
  "/onboarding/:path*",
  "/start",
  "/start/:path*",
  "/team/:path*",
  "/request/:path*",
  "/r/:path*",
  "/api/:path*",
  "/institution",
  "/institution/:path*",
  "/developer",
  "/developer/:path*",
  "/workspace/:path*",
] as const;

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: [...baselineResponseHeaders] },
      ...privateRoutePatterns.map((source) => ({ source, headers: [...privateResponseHeaders] })),
    ];
  },
};

export default nextConfig;
