import { NextResponse } from 'next/server';
import { createPassageServerClient } from '@/lib/supabase/server';

// Plain route handler (not a Server Action) so the sign-out form below can
// submit as a real HTML POST and succeed even if client-side JS/fetch is
// interrupted - see components/auth/OperationalBoundary.tsx.
export async function POST(request: Request) {
  const client = await createPassageServerClient();
  if (client) await client.auth.signOut();
  const url = new URL('/login?status=signed-out', request.url);
  return NextResponse.redirect(url, { status: 303 });
}
