import { NextResponse } from 'next/server';

function cameFromHomepage(request) {
  const referrer = request.headers.get('referer') || '';
  if (!referrer) return false;
  try {
    const url = new URL(referrer);
    return url.origin === request.nextUrl.origin && url.pathname === '/';
  } catch {
    return false;
  }
}

export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === '/resources') {
    const url = request.nextUrl.clone();
    url.pathname = '/guides';
    return NextResponse.redirect(url, 308);
  }

  if (
    pathname === '/funeral-home/dashboard' &&
    searchParams.get('demo') === '1' &&
    searchParams.get('demoTour') === 'funeral-home' &&
    searchParams.get('demoStep') === 'dashboard' &&
    cameFromHomepage(request)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/funeral-home/pilot-proof';
    url.search = '';
    return NextResponse.redirect(url, 302);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/resources', '/funeral-home/dashboard'],
};
