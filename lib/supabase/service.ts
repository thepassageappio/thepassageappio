import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Service-role client: bypasses RLS entirely. Only for trusted server-only
// contexts. Most calls come from Stripe webhooks. A server action may use it
// only after separately resolving a verified, authorized actor, and only for
// a narrow write that reconciles a completed Stripe mutation. Never expose
// this client or its key to browser code.
export function createPassageServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
