import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const authClient = url && anon ? createClient(url, anon) : null;

export async function verifyDeliveryRequest(req) {
  const configuredSecret = process.env.PASSAGE_INTERNAL_API_SECRET;
  const providedSecret = req.headers['x-passage-internal-secret'] || req.headers['x-passage-system-secret'];

  if (configuredSecret && providedSecret && providedSecret === configuredSecret) {
    return { ok: true, source: 'internal' };
  }

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token && authClient) {
    const { data, error } = await authClient.auth.getUser(token);
    if (!error && data?.user) return { ok: true, source: 'user', user: data.user };
  }

  return {
    ok: false,
    status: 401,
    error: configuredSecret && providedSecret
      ? 'Internal Passage request could not be verified. Confirm the production PASSAGE_INTERNAL_API_SECRET matches the calling environment.'
      : configuredSecret
        ? 'Your Passage session expired. Refresh, sign in again, and retry this task action.'
        : 'Your Passage session expired. Configure PASSAGE_INTERNAL_API_SECRET for server orchestration or sign in again.',
  };
}

export function internalHeaders() {
  const secret = process.env.PASSAGE_INTERNAL_API_SECRET;
  return secret ? { 'x-passage-internal-secret': secret } : {};
}
