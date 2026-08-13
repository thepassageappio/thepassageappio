import { NextResponse } from 'next/server';
import {
  createSyntheticProviderDiscoveryAdapter,
  ProviderDiscoveryError,
} from '@/lib/provider-discovery/synthetic-directory';
import { verifiedUser } from '@/lib/auth/session';
import { createPassageServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const adapter = createSyntheticProviderDiscoveryAdapter();

export async function POST(request: Request) {
  const client = await createPassageServerClient();
  if (!client || !(await verifiedUser(client))) {
    return noStore({ error: 'signed_out' }, 401);
  }

  let query = '';
  try {
    const body = (await request.json()) as { query?: unknown };
    query = typeof body.query === 'string' ? body.query.trim().slice(0, 160) : '';
  } catch {
    return noStore({ results: [] }, 400);
  }

  if (query.replace(/\s/g, '').length < 2) {
    return noStore({ results: [] });
  }

  try {
    const results = await adapter.search(query, 6, request.signal);
    return noStore({ results });
  } catch (error) {
    if (request.signal.aborted) {
      return new Response(null, { status: 499 });
    }
    if (error instanceof ProviderDiscoveryError && error.kind === 'rate_limit') {
      return noStore({ error: 'busy' }, 429);
    }
    return noStore({ error: 'unavailable' }, 503);
  }
}
function noStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
