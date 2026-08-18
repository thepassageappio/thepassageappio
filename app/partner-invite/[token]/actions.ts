'use server';

import { redirect } from 'next/navigation';
import { firstRpcRow, validInvitationToken } from '@/lib/auth/invitations';
import { loginPath } from '@/lib/auth/redirects';
import { verifiedUser } from '@/lib/auth/session';
import { HUBSPOT_LIFECYCLE_STAGE, upsertContact } from '@/lib/hubspot';
import { createPassageServerClient } from '@/lib/supabase/server';

type PartnerInvitationAcceptance = { partner_member_id: string; partner_organization_id: string; member_role: string; accepted_at: string; replayed: boolean };

function failureCode(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('verified email address that received')) return 'email-mismatch';
  if (normalized.includes('already bound to another') || normalized.includes('administrator review') || normalized.includes('different active vendor')) return 'claimed-other';
  if (normalized.includes('invalid or unavailable')) return 'unavailable';
  return 'retry';
}

export async function acceptPartnerInvitation(token: string) {
  const invitePath = `/partner-invite/${encodeURIComponent(token)}`;
  if (!validInvitationToken(token)) redirect(`${invitePath}?error=invalid`);

  const client = await createPassageServerClient();
  if (!client) redirect(`${invitePath}?error=environment`);
  const user = await verifiedUser(client);
  if (!user) redirect(loginPath(invitePath));

  const accepted = await client.rpc('accept_partner_invitation', { raw_token: token });
  if (accepted.error) redirect(`${invitePath}?error=${failureCode(accepted.error.message)}`);
  const first = firstRpcRow<PartnerInvitationAcceptance>(accepted.data);
  if (!first) redirect(`${invitePath}?error=retry`);

  // Same double-confirmation pattern as app/invite/[token]/actions.ts: revalidate
  // the session and replay the transactional RPC, requiring the second response
  // to be a stable replay before trusting the acceptance.
  if (!await verifiedUser(client)) redirect(loginPath(invitePath));
  const verified = await client.rpc('accept_partner_invitation', { raw_token: token });
  if (verified.error) redirect(`${invitePath}?error=${failureCode(verified.error.message)}`);
  const second = firstRpcRow<PartnerInvitationAcceptance>(verified.data);
  const sameAuthority = second
    && second.replayed
    && second.partner_member_id === first.partner_member_id
    && second.partner_organization_id === first.partner_organization_id
    && second.member_role === first.member_role;
  if (!sameAuthority) redirect(`${invitePath}?error=verification`);

  // Non-blocking, mirrors the funeral-home accept action: a user joining a
  // vendor org (owner or invited employee) is exactly the "vendor should be
  // a platform user, categorized correctly in CRM" case.
  if (user.email) await upsertContact(user.email, undefined, undefined, undefined, HUBSPOT_LIFECYCLE_STAGE.vendorOwnerOrEmployee).catch(() => null);

  redirect(`${invitePath}?receipt=accepted`);
}
