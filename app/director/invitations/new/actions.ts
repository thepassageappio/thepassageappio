'use server';

import { resolveOperationalViewer } from '@/lib/auth/authorization';
import { firstRpcRow } from '@/lib/auth/invitations';
import { createPassageServerClient } from '@/lib/supabase/server';

export type InvitationCreationState = {
  status: 'idle' | 'validation' | 'denied' | 'conflict' | 'unavailable' | 'created' | 'already-pending';
  message?: string;
  receipt?: {
    invitationId: string;
    invitedEmail: string;
    locationName: string;
    purpose: string;
    expiresAt: string;
    tokenHint: string;
    invitePath?: string;
    createdAt: string;
    actorName: string;
  };
};

type RpcReceipt = { invitation_id: string; raw_token: string | null; token_hint: string; expires_at: string; created_at: string; invitation_purpose: string; inviter_display_name: string; organization_location_ids: string[]; invitation_state: 'pending' | 'accepted' | 'revoked' | 'expired'; replayed: boolean };

function failure(status: InvitationCreationState['status'], message: string): InvitationCreationState {
  return { status, message };
}

export async function createStaffInvitation(_previous: InvitationCreationState, formData: FormData): Promise<InvitationCreationState> {
  const viewerResult = await resolveOperationalViewer();
  if (!viewerResult.ok || !['owner', 'director'].includes(viewerResult.viewer.role)) return failure('denied', 'Your verified director authority is required. Nothing was created.');

  const invitedEmail = String(formData.get('invitedEmail') ?? '').trim().toLowerCase();
  const locationId = String(formData.get('locationId') ?? '');
  const purpose = String(formData.get('purpose') ?? '').trim();
  const creationRequestId = String(formData.get('creationRequestId') ?? '');
  const expiresAt = new Date(String(formData.get('expiresAt') ?? ''));
  const location = viewerResult.viewer.locations.find((item) => item.id === locationId);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitedEmail)) return failure('validation', 'Enter the verified staff email address. Nothing was created.');
  if (!location) return failure('denied', 'Choose a location inside your verified authority. Nothing was created.');
  if (!purpose) return failure('validation', 'Explain why this staff access is needed. Nothing was created.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(creationRequestId)) return failure('validation', 'This invitation request expired before submission. Reload and try again.');
  if (Number.isNaN(expiresAt.getTime())) return failure('validation', 'Choose a valid invitation expiry. Nothing was created.');

  const client = await createPassageServerClient();
  if (!client) return failure('unavailable', 'The isolated authorization service is unavailable. Nothing was created.');
  const result = await client.rpc('create_employee_invitation_idempotent_v2', {
    p_organization_id: viewerResult.viewer.organizationId,
    p_invited_email: invitedEmail,
    p_organization_location_ids: [location.id],
    p_purpose: purpose,
    p_expires_at: expiresAt.toISOString(),
    p_creation_request_id: creationRequestId,
  });

  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return failure('denied', 'Passage could not verify authority for that invitation. Nothing was created.');
    if (result.error.code === '23505') return failure('conflict', 'That person already has active access or this request conflicts with another invitation. Nothing new was created.');
    if (result.error.code === '22023') return failure('validation', 'Review the recipient, purpose, location, and expiry. Nothing was created.');
    return failure('unavailable', 'Passage could not create the invitation right now. Nothing is shown as sent or accepted.');
  }

  const receipt = firstRpcRow<RpcReceipt>(result.data);
  if (!receipt?.invitation_id || !receipt.expires_at || !receipt.created_at) return failure('unavailable', 'Passage did not return a complete creation receipt. Ask an administrator to verify audit history before retrying.');
  if (receipt.invitation_state !== 'pending') return failure('conflict', `The earlier invitation is ${receipt.invitation_state}. Nothing new was created; reload before starting a replacement request.`);

  const receiptLocations = receipt.organization_location_ids.map((id) => viewerResult.viewer.locations.find((item) => item.id === id)?.name ?? 'Authorized location');
  return { status: receipt.replayed ? 'already-pending' : 'created', receipt: { invitationId: receipt.invitation_id, invitedEmail, locationName: receiptLocations.join(' · '), purpose: receipt.invitation_purpose, expiresAt: receipt.expires_at, tokenHint: receipt.token_hint, invitePath: receipt.raw_token ? `/invite/${receipt.raw_token}` : undefined, createdAt: receipt.created_at, actorName: receipt.inviter_display_name } };
}
