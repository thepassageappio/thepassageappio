'use server';

import { redirect } from 'next/navigation';
import { firstRpcRow, type InvitationAcceptance, validInvitationToken } from '@/lib/auth/invitations';
import { loginPath } from '@/lib/auth/redirects';
import { verifiedUser } from '@/lib/auth/session';
import { HUBSPOT_LIFECYCLE_STAGE, upsertContact } from '@/lib/hubspot';
import { createPassageServerClient } from '@/lib/supabase/server';

function failureCode(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('verified email address that received')) return 'email-mismatch';
  if (normalized.includes('already bound to another') || normalized.includes('administrator review')) return 'claimed-other';
  if (normalized.includes('access has ended')) return 'access-ended';
  if (normalized.includes('invalid or unavailable')) return 'unavailable';
  return 'retry';
}

export async function acceptInvitation(token: string) {
  const invitePath = `/invite/${encodeURIComponent(token)}`;
  if (!validInvitationToken(token)) redirect(`${invitePath}?error=invalid`);

  const client = await createPassageServerClient();
  if (!client) redirect(`${invitePath}?error=environment`);
  const user = await verifiedUser(client);
  if (!user) redirect(loginPath(invitePath));

  const accepted = await client.rpc('accept_organization_invitation', { raw_token: token });
  if (accepted.error) redirect(`${invitePath}?error=${failureCode(accepted.error.message)}`);
  const first = firstRpcRow<InvitationAcceptance>(accepted.data);
  if (!first) redirect(`${invitePath}?error=retry`);

  // Revalidate the session and replay the transactional RPC. The second response
  // succeeds only for the same authenticated user and proves durable membership.
  if (!await verifiedUser(client)) redirect(loginPath(invitePath));
  const verified = await client.rpc('accept_organization_invitation', { raw_token: token });
  if (verified.error) redirect(`${invitePath}?error=${failureCode(verified.error.message)}`);
  const second = firstRpcRow<InvitationAcceptance>(verified.data);
  const sameAuthority = second
    && second.replayed
    && second.organization_member_id === first.organization_member_id
    && second.organization_id === first.organization_id
    && second.member_role === first.member_role;
  if (!sameAuthority) redirect(`${invitePath}?error=verification`);

  // Non-blocking: a user joining a funeral-home org (staff or director) is
  // exactly the "users added to funeral homes" case that should land in
  // HubSpot as a Contact at this stage -- do it once acceptance is durably
  // confirmed, not before.
  if (user.email) await upsertContact(user.email, undefined, undefined, undefined, HUBSPOT_LIFECYCLE_STAGE.funeralHomeDirectorOrEmployee).catch(() => null);

  redirect(`${invitePath}?receipt=accepted`);
}
