import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

// TEMPORARY: live UAT link resolution for the 2026-08-20 staff-persona test.
// Deleted immediately after use -- never left deployed.
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  const next = request.nextUrl.searchParams.get('next') ?? '/case/start';
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return NextResponse.json({ error: 'service client unavailable' }, { status: 500 });
  const service = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const redirectTo = `https://www.thepassageapp.io/auth/finish?next=${encodeURIComponent(next)}`;
  const result = await service.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo } });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ action_link: result.data.properties.action_link });
}
