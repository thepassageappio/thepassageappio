import { NextResponse } from 'next/server';
import { loadCurrentProviderSelection } from '@/lib/provider-discovery/family-selection';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await loadCurrentProviderSelection();
  const status = result.state === 'signed_out'
    ? 401
    : result.state === 'unavailable'
      ? 503
      : 200;
  return NextResponse.json(result, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
