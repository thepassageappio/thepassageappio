import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Service-role client: bypasses RLS entirely. Only for trusted server-only
// contexts that never act on behalf of a browser session -- currently just
// the Stripe webhook handler, which has no signed-in user to authenticate as
// and must be able to write subscriptions/users state for any account.
// Never import this into anything that runs in response to a user request.
export function createPassageServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
