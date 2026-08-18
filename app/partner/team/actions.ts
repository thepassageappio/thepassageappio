'use server';

import { revalidatePath } from 'next/cache';
import { resolvePartnerViewer } from '@/lib/auth/partner-authorization';
import { createPassageServerClient } from '@/lib/supabase/server';

export type PartnerTeamCommandState = {
  status: 'idle' | 'validation' | 'denied' | 'unavailable' | 'saved';
  message?: string;
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function failure(status: PartnerTeamCommandState['status'], message: string): PartnerTeamCommandState {
  return { status, message };
}

async function ownerClient() {
  const viewer = await resolvePartnerViewer();
  if (!viewer.ok || viewer.viewer.role !== 'owner') return null;
  const client = await createPassageServerClient();
  return client ? { client, viewer: viewer.viewer } : null;
}

export async function revokePartnerInvitation(_previous: PartnerTeamCommandState, formData: FormData): Promise<PartnerTeamCommandState> {
  const invitationId = String(formData.get('invitationId') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  if (!uuid.test(invitationId) || !reason) return failure('validation', 'Name the invitation and explain why access is being revoked. Nothing changed.');

  const authority = await ownerClient();
  if (!authority) return failure('denied', 'You need vendor-owner access to make this change. Nothing changed.');

  const result = await authority.client.rpc('revoke_partner_invitation', { invitation_id: invitationId, reason });
  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return failure('denied', 'Passage could not verify authority for that invitation. Nothing changed.');
    if (result.error.code === '22023') return failure('validation', 'Review the invitation and reason. Nothing changed.');
    return failure('unavailable', 'Passage could not revoke that invitation right now. Nothing changed.');
  }

  revalidatePath('/partner/team');
  return { status: 'saved', message: 'The invitation was revoked. No access was granted.' };
}
