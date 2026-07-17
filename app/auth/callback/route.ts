
import { NextResponse, type NextRequest } from 'next/server';
import { safeInternalPath } from '@/lib/auth/redirects';
import { createPassageServerClient } from '@/lib/supabase/server';

function privateRedirect(destination: URL) {
  const response = NextResponse.redirect(destination);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = safeInternalPath(request.nextUrl.searchParams.get('next'), '/');
  const client = await createPassageServerClient();

  if (!client) {
    return privateRedirect(new URL(`/login?error=unavailable&next=${encodeURIComponent(next)}`, request.url));
  }
  if (!code) {
    return privateRedirect(new URL(`/login?error=callback&next=${encodeURIComponent(next)}`, request.url));
  }

  const exchanged = await client.auth.exchangeCodeForSession(code);
  if (exchanged.error) {
    return privateRedirect(new URL(`/login?error=callback&next=${encodeURIComponent(next)}`, request.url));
  }

  return privateRedirect(new URL(next, request.url));
}

