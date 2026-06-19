export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qsveqfchwylsbncsfgxe.supabase.co';
  if (!supabaseUrl) return res.status(500).json({ error: 'Google sign-in is not configured.' });

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.thepassageapp.io';
  const proto = req.headers['x-forwarded-proto'] || (String(host).includes('localhost') ? 'http' : 'https');
  const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || (proto + '://' + host);
  const requestedNext = typeof req.query.next === 'string' ? req.query.next : '';
  const safeNext = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '';
  const loginReturn = safeNext ? ('/login?next=' + encodeURIComponent(safeNext)) : '/login';
  const redirectTo = new URL(loginReturn, origin).toString();
  const authUrl = new URL('/auth/v1/authorize', supabaseUrl);
  authUrl.searchParams.set('provider', 'google');
  authUrl.searchParams.set('redirect_to', redirectTo);

  res.setHeader('Cache-Control', 'no-store');
  return res.redirect(302, authUrl.toString());
}
