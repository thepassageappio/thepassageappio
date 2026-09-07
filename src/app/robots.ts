import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/blog", "/faq", "/resources", "/about", "/contact", "/templates", "/integrations", "/security", "/pricing", "/pilot", "/legal/"] },
      { userAgent: "*", disallow: ["/app/", "/onboarding/", "/request/", "/r/", "/team/", "/workspace/", "/api/", "/developer", "/institution"] },
    ],
    sitemap: "https://thepassageapp.io/sitemap.xml",
  };
}
