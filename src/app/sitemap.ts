import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog/posts";

const routes = ["", "/about", "/blog", ...blogPosts.map(({ slug }) => `/blog/${slug}`), "/contact", "/faq", "/resources", "/resources/financial-poa-operations", "/resources/decision-receipts", "/resources/hosted-first-integration", "/templates", "/integrations", "/security", "/pricing", "/pilot", "/legal/privacy", "/legal/terms", "/legal/authorized-use"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-09-04T00:00:00.000Z");
  return routes.map((route) => ({
    url: `https://thepassageapp.io${route}`,
    lastModified,
    changeFrequency: route === "" || route === "/blog" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/blog" ? 0.8 : route.startsWith("/legal/") ? 0.3 : 0.7,
  }));
}
