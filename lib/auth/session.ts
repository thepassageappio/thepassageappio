import type { User } from '@supabase/supabase-js';
import type { createPassageServerClient } from '@/lib/supabase/server';

type PassageClient = NonNullable<Awaited<ReturnType<typeof createPassageServerClient>>>;

export async function verifiedUser(client: PassageClient): Promise<User | null> {
  const claims = await client.auth.getClaims();
  if (claims.error || !claims.data?.claims?.sub) return null;
  const userResult = await client.auth.getUser();
  if (userResult.error || !userResult.data.user || userResult.data.user.id !== claims.data.claims.sub) return null;
  return userResult.data.user;
}
