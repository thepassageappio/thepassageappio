import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { OPERATIONAL_PATHNAME_HEADER } from '@/lib/auth/operational-route-gate';
import { getRuntimeConfiguration } from '@/lib/runtime-config';

export async function refreshPassageSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(OPERATIONAL_PATHNAME_HEADER, request.nextUrl.pathname);
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const configuration = getRuntimeConfiguration();
  if (!configuration.available || !configuration.supabaseUrl || !configuration.supabasePublishableKey) return response;

  const client = createServerClient(configuration.supabaseUrl, configuration.supabasePublishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values, headers) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  const claims = await client.auth.getClaims();
  const pathname = request.nextUrl.pathname;
  const protectedOperatorPath = pathname === '/director'
    || pathname.startsWith('/director/')
    || pathname === '/staff'
    || pathname.startsWith('/staff/');

  if (protectedOperatorPath && (claims.error || !claims.data?.claims?.sub)) {
    const destination = request.nextUrl.clone();
    destination.pathname = '/login';
    destination.search = '';
    destination.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    const redirect = NextResponse.redirect(destination);
    redirect.headers.set('Cache-Control', 'private, no-store');
    redirect.headers.set('Pragma', 'no-cache');
    redirect.headers.set('Expires', '0');
    return redirect;
  }
  return response;
}
