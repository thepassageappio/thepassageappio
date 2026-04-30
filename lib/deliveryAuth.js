import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const authClient = createClient(url, anon);

export async function verifyDeliveryRequest(req) {
  const configuredSecret = process.env.PASSAGE_INTERNAL_API_SECRET;
  const providedSecret = req.headers['x-passage-internal-secret'];

  if (configuredSecret && providedSecret && providedSecret === configuredSecret) {
    return { ok: true, source: 'internal' };
  }

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token) {
    const { data, error } = await authClient.auth.getUser(token);
    if (!error && data?.user) return { ok: true, source: 'user', user: data.user };
  }

  return {
    ok: false,
    status: 401,
    error: configuredSecret
      ? 'Delivery request is not authorized.'
      : 'Delivery request is not authorized. Configure PASSAGE_INTERNAL_API_SECRET for server orchestration.',
  };
}

export function internalHeaders() {
  const secret = process.env.PASSAGE_INTERNAL_API_SECRET;
  return secret ? { 'x-passage-internal-secret': secret } : {};
}
