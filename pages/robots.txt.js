const SITE_URL = 'https://www.thepassageapp.io';

export async function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'text/plain');
  res.write(`User-agent: *
Allow: /
Disallow: /system/
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`);
  res.end();
  return { props: {} };
}

export default function Robots() {
  return null;
}
