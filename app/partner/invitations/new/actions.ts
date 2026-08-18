'use server';

import { firstRpcRow } from '@/lib/auth/invitations';
import { resolvePartnerViewer } from '@/lib/auth/partner-authorization';
import { createPassageServerClient } from '@/lib/supabase/server';

export type PartnerInvitationCreationState = {
  status: 'idle' | 'validation' | 'denied' | 'conflict' | 'unavailable' | 'created' | 'already-pending';
  message?: string;
  receipt?: {
    invitationId: string;
    invitedEmail: string;
    purpose: string;
    expiresAt: string;
    tokenHint: string;
    invitePath?: string;
    createdAt: string;
    actorName: string;
  };
};

type RpcReceipt = {
  invitation_id: string;
  raw_token: string | null;
  token_hint: string;
  expires_at: string;
  created_at: string;
  invitation_purpose: string;
  inviter_display_name: string;
  invitation_state: 'pending' | 'accepted' | 'revoked' | 'expired';
  replayed: boolean;
};

function failure(status: PartnerInvitationCreationState['status'], message: string): PartnerInvitationCreationState {
  return { status, message };
}

export async function createPartnerEmployeeInvitation(_previous: PartnerInvitationCreationState, formData: FormData): Promise<PartnerInvitationCreationState> {
  const viewerResult = await resolvePartnerViewer();
  if (!viewerResult.ok || viewerResult.viewer.role !== 'owner') return failure('denied', 'Your verified vendor-owner authority is required. Nothing was created.');

  const invitedEmail = String(formData.get('invitedEmail') ?? '').trim().toLowerCase();
  const purpose = String(formData.get('purpose') ?? '').trim();
  const creationRequestId = String(formData.get('creationRequestId') ?? '');
  const expiresAt = new Date(String(formData.get('expiresAt') ?? ''));

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitedEmail)) return failure('validation', 'Enter the verified employee email address. Nothing was created.');
  if (!purpose) return failure('validation', 'Explain why this vendor access is needed. Nothing was created.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(creationRequestId)) return failure('validation', 'This invitation request expired before submission. Reload and try again.');
  if (Number.isNaN(expiresAt.getTime())) return failure('validation', 'Choose a valid invitation expiry. Nothing was created.');

  const client = await createPassageServerClient();
  if (!client) return failure('unavailable', 'The isolated authorization service is unavailable. Nothing was created.');
  const result = await client.rpc('create_partner_employee_invitation_idempotent', {
    p_partner_organization_id: viewerResult.viewer.partnerOrganizationId,
    p_invited_email: invitedEmail,
    p_purpose: purpose,
    p_expires_at: expiresAt.toISOString(),
    p_creation_request_id: creationRequestId,
  });

  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return failure('denied', 'Passage could not verify authority for that invitation. Nothing was created.');
    if (result.error.code === '23505') return failure('conflict', 'That person already has active access or this request conflicts with another invitation. Nothing new was created.');
    if (result.error.code === '22023') return failure('validation', 'Review the recipient, purpose, and expiry. Nothing was created.');
    return failure('unavailable', 'Passage could not create the invitation right now. Nothing is shown as sent or accepted.');
  }

  const receipt = firstRpcRow<RpcReceipt>(result.data);
  if (!receipt?.invitation_id || !receipt.expires_at || !receipt.created_at) return failure('unavailable', 'Passage did not return a complete creation receipt. Ask an administrator to verify audit history before retrying.');
  if (receipt.invitation_state !== 'pending') return failure('conflict', `The earlier invitation is ${receipt.invitation_state}. Nothing new was created; reload before starting a replacement request.`);

  return {
    status: receipt.replayed ? 'already-pending' : 'created',
    receipt: {
      invitationId: receipt.invitation_id,
      invitedEmail,
      purpose: receipt.invitation_purpose,
      expiresAt: receipt.expires_at,
      tokenHint: receipt.token_hint,
      invitePath: receipt.raw_token ? `/partner-invite/${receipt.raw_token}` : undefined,
      createdAt: receipt.created_at,
      actorName: receipt.inviter_display_name,
    },
  };
}
