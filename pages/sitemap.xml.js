import { blogPosts } from '../lib/blogPosts';

const SITE_URL = 'https://www.thepassageapp.io';

const staticRoutes = [
  '/',
  '/mission',
  '/story',
  '/resources',
  '/guides',
  '/blog',
  '/pricing',
  '/contact',
  '/funeral-home',
  '/care-providers',
  '/hospice',
  '/assisted-living',
  '/participants',
  '/vendors',
  '/vendors/onboard',
  '/urgent',
  '/planning',
  '/privacy',
  '/terms',
  '/trust',
  '/faq',
  '/status',
];

function entry(path, lastmod = new Date().toISOString()) {
  return [
    '  <url>',
    `    <loc>${SITE_URL}${path}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    path === '/' ? '    <priority>1.0</priority>' : '    <priority>0.7</priority>',
    '  </url>',
  ].join('\n');
}

function sitemap() {
  const routes = staticRoutes.map(path => entry(path));
  const posts = blogPosts.map(post => entry(`/blog/${post.slug}`, new Date(post.publishedAt || post.date).toISOString()));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...routes, ...posts].join('\n')}
</urlset>`;
}

export async function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'application/xml');
  res.write(sitemap());
  res.end();
  return { props: {} };
}

export default function Sitemap() {
  return null;
}
