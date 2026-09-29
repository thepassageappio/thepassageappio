import type { NextConfig } from "next";
import { securityHeaderRoutes } from "./src/lib/authority/response-security";

const nextConfig: NextConfig = {
  async headers() {
    return securityHeaderRoutes(process.env);
  },
};

export default nextConfig;
