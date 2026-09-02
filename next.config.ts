import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const baselineHeaders = [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
    ];
    const secureHeaders = [
      ...baselineHeaders,
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
    ];
    return [
      { source: "/:path*", headers: baselineHeaders },
      { source: "/r/:path*", headers: secureHeaders },
      { source: "/request/:path*", headers: secureHeaders },
    ];
  },
};

export default nextConfig;
