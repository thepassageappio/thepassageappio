'use server';

import { redirect } from 'next/navigation';
import { createPassageServerClient } from '@/lib/supabase/server';

export async function signOut() {
  const client = await createPassageServerClient();
  if (client) await client.auth.signOut();
  redirect('/login?status=signed-out');
}
