export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.thepassageapp.io';
  const proto = req.headers['x-forwarded-proto'] || (String(host).includes('localhost') ? 'http' : 'https');
  const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || (proto + '://' + host);
  const requestedNext = typeof req.query.next === 'string' ? req.query.next : '';
  const safeNext = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '';
  const authStart = '/auth/google' + (safeNext ? ('?next=' + encodeURIComponent(safeNext)) : '');

  res.setHeader('Cache-Control', 'no-store');
  return res.redirect(302, new URL(authStart, origin).toString());
}
