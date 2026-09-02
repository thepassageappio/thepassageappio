import type { MetadataRoute } from "next";

const routes = ["", "/templates", "/integrations", "/security", "/pricing", "/pilot", "/legal/privacy", "/legal/terms", "/legal/authorized-use"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-09-02T00:00:00.000Z");
  return routes.map((route) => ({
    url: `https://thepassageapp.io${route}`,
    lastModified,
    changeFrequency: route ? "monthly" : "weekly",
    priority: route === "" ? 1 : route.startsWith("/legal/") ? 0.3 : 0.7,
  }));
}
