'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ACTIVE_ORG_COOKIE, landingPathForRole, type OperationalRole } from '@/lib/auth/authorization';
import { verifiedUser } from '@/lib/auth/session';
import { createPassageServerClient } from '@/lib/supabase/server';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function selectWorkspace(formData: FormData): Promise<void> {
  const organizationId = String(formData.get('organizationId') ?? '');
  if (!uuid.test(organizationId)) redirect('/workspace/select?error=invalid');

  const client = await createPassageServerClient();
  if (!client) redirect('/workspace/select?error=unavailable');
  const user = await verifiedUser(client);
  if (!user) redirect('/login?next=%2Fworkspace%2Fselect');

  // Re-verify server-side rather than trusting the submitted org id alone --
  // a request can only select a workspace the account is actually an active
  // member of.
  const membership = await client.from('organization_members').select('role').eq('user_id', user.id).eq('organization_id', organizationId).eq('status', 'active').maybeSingle();
  if (membership.error || !membership.data) redirect('/workspace/select?error=denied');

  (await cookies()).set(ACTIVE_ORG_COOKIE, organizationId, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 60 * 60 * 24 * 90 });
  redirect(landingPathForRole((membership.data as { role: OperationalRole }).role));
}
