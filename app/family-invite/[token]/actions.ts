'use server';

import { redirect } from 'next/navigation';
import { firstRpcRow, validInvitationToken } from '@/lib/auth/invitations';
import { loginPath } from '@/lib/auth/redirects';
import { verifiedUser } from '@/lib/auth/session';
import { createPassageServerClient } from '@/lib/supabase/server';

type FamilyAcceptance = { workflow_id: string; family_name: string | null; person_name: string | null; accepted_at: string; replayed: boolean };

function failureCode(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('verified email address that received')) return 'email-mismatch';
  if (normalized.includes('accepted by another account')) return 'claimed-other';
  if (normalized.includes('invalid or unavailable')) return 'unavailable';
  return 'retry';
}

export async function acceptFamilyInvitation(token: string) {
  const invitePath = `/family-invite/${encodeURIComponent(token)}`;
  if (!validInvitationToken(token)) redirect(`${invitePath}?error=invalid`);

  const client = await createPassageServerClient();
  if (!client) redirect(`${invitePath}?error=environment`);
  if (!await verifiedUser(client)) redirect(loginPath(invitePath));

  const accepted = await client.rpc('accept_case_family_invitation', { p_raw_token: token });
  if (accepted.error) redirect(`${invitePath}?error=${failureCode(accepted.error.message)}`);
  const receipt = firstRpcRow<FamilyAcceptance>(accepted.data);
  if (!receipt?.workflow_id) redirect(`${invitePath}?error=retry`);

  redirect(`/case/${receipt.workflow_id}/today`);
}
