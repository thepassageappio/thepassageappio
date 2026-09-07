import { blogPosts } from "@/lib/blog/posts";

const escapeXml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

export function GET() {
  const items = blogPosts.map((post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>https://thepassageapp.io/blog/${post.slug}</link>
      <guid>https://thepassageapp.io/blog/${post.slug}</guid>
      <pubDate>${new Date(`${post.published}T12:00:00.000Z`).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
    <channel>
      <title>Passage Authority blog</title>
      <link>https://thepassageapp.io/blog</link>
      <description>Plain-English guidance for financial power of attorney requests.</description>${items}
    </channel>
  </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
