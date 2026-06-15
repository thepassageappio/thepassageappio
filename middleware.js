import { NextResponse } from 'next/server';

const vendorCommerceBuckets = new Map();
const VENDOR_COMMERCE_WINDOW_SECONDS = 300;
const VENDOR_COMMERCE_MAX_REQUESTS = 20;

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

function requestIp(request) {
  return String(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown')
    .split(',')[0]
    .trim()
    .slice(0, 80) || 'unknown';
}

function sweepVendorCommerceBuckets(now) {
  if (vendorCommerceBuckets.size < 2000) return;
  for (const [key, bucket] of vendorCommerceBuckets.entries()) {
    if (bucket.resetAt <= now) vendorCommerceBuckets.delete(key);
  }
}

function checkVendorCommerceLimit(request) {
  const now = Date.now();
  sweepVendorCommerceBuckets(now);
  const windowMs = VENDOR_COMMERCE_WINDOW_SECONDS * 1000;
  const key = ['vendor-commerce', request.method, request.nextUrl.pathname, requestIp(request)].join(':');
  const existing = vendorCommerceBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    vendorCommerceBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  existing.count += 1;
  return {
    allowed: existing.count <= VENDOR_COMMERCE_MAX_REQUESTS,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

function shouldThrottleVendorCommerce(request) {
  const path = request.nextUrl.pathname;
  if (path === '/api/vendorRequests/respond') return true;
  if (request.method !== 'POST') return false;
  return path === '/api/checkout'
    || path.startsWith('/api/vendorRequests/')
    || path.startsWith('/api/vendors/')
    || path.startsWith('/api/stripe/');
}

function vendorCommerceRateLimitResponse(limit) {
  return NextResponse.json(
    { error: 'Too many vendor, checkout, or payment attempts. Please wait before trying again.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(limit.retryAfterSeconds || VENDOR_COMMERCE_WINDOW_SECONDS),
      },
    },
  );
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

  if (shouldThrottleVendorCommerce(request)) {
    const limit = checkVendorCommerceLimit(request);
    if (!limit.allowed) return vendorCommerceRateLimitResponse(limit);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/resources',
    '/funeral-home/dashboard',
    '/api/checkout',
    '/api/vendorRequests/:path*',
    '/api/vendors/:path*',
    '/api/stripe/:path*',
  ],
};
