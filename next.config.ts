import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const secureHeaders = [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
    ];
    return [
      { source: "/r/:path*", headers: secureHeaders },
      { source: "/request/:path*", headers: secureHeaders },
    ];
  },
};

export default nextConfig;
