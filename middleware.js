import { NextResponse } from 'next/server';

const ADMIN_PATHS = ['/system/admin', '/system/demo'];
const ADMIN_EMAILS = new Set(['steventurrisi@gmail.com', 'thepassageappio@gmail.com']);
const SUPABASE_PROJECT_REF =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/i)?.[1] ||
  'qsveqfchwylsbncsfgxe';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function base64UrlDecode(value) {
  try {
    const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return atob(padded);
  } catch {
    return '';
  }
}

function readCookieValue(request, name) {
  const direct = request.cookies.get(name)?.value;
  if (direct) return direct;

  let combined = '';
  for (let index = 0; index < 10; index += 1) {
    const chunk = request.cookies.get(`${name}.${index}`)?.value;
    if (!chunk) break;
    combined += chunk;
  }
  return combined;
}

function readSupabaseEmail(request) {
  const cookieNames = [
    `sb-${SUPABASE_PROJECT_REF}-auth-token`,
    'sb-auth-token',
  ].filter(Boolean);

  for (const name of cookieNames) {
    const raw = readCookieValue(request, name);
    if (!raw) continue;
    const decoded = raw.startsWith('base64-') ? base64UrlDecode(raw.slice(7)) : decodeURIComponent(raw);
    try {
      const parsed = JSON.parse(decoded);
      const accessToken = Array.isArray(parsed) ? parsed[0] : parsed?.access_token;
      const payload = accessToken?.split('.')?.[1];
      if (!payload) continue;
      const claims = JSON.parse(base64UrlDecode(payload));
      const email = normalizeEmail(claims.email || claims.user_metadata?.email);
      if (email) return email;
    } catch {
      continue;
    }
  }
  return '';
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  if (pathname === '/resources') {
    const url = request.nextUrl.clone();
    url.pathname = '/guides';
    return NextResponse.redirect(url, 308);
  }

  if (ADMIN_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    const email = readSupabaseEmail(request);
    if (!ADMIN_EMAILS.has(email)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url, 307);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/resources', '/system/admin/:path*', '/system/demo/:path*'],
};
