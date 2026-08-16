'use server';

import { verifiedUser } from '@/lib/auth/session';
import { firstRpcRow } from '@/lib/auth/invitations';
import { createPassageServerClient } from '@/lib/supabase/server';

export type AdminOrganizationCreationState = {
  status: 'idle' | 'validation' | 'denied' | 'unavailable' | 'created';
  message?: string;
  receipt?: {
    organizationId: string;
    invitationId: string;
    directorEmail: string;
    invitePath: string;
    expiresAt: string;
    tokenHint: string;
  };
};

type RpcReceipt = { organization_id: string; organization_location_id: string; invitation_id: string; raw_token: string | null; token_hint: string; expires_at: string };

function failure(status: AdminOrganizationCreationState['status'], message: string): AdminOrganizationCreationState {
  return { status, message };
}

export async function adminCreateOrganization(_previous: AdminOrganizationCreationState, formData: FormData): Promise<AdminOrganizationCreationState> {
  const organizationName = String(formData.get('organizationName') ?? '').trim();
  const locationName = String(formData.get('locationName') ?? '').trim();
  const directorEmail = String(formData.get('directorEmail') ?? '').trim().toLowerCase();
  const purpose = String(formData.get('purpose') ?? '').trim() || 'New funeral home onboarding.';

  if (!organizationName || organizationName.length > 200) return failure('validation', 'Enter the organization name. Nothing was created.');
  if (!locationName || locationName.length > 200) return failure('validation', 'Enter the first location name. Nothing was created.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(directorEmail)) return failure('validation', 'Enter a valid director email address. Nothing was created.');

  const client = await createPassageServerClient();
  if (!client) return failure('unavailable', 'Passage could not verify sign-in right now. Nothing was created.');
  const user = await verifiedUser(client);
  if (!user) return failure('denied', 'Sign in with a platform-admin account. Nothing was created.');

  const result = await client.rpc('admin_bootstrap_organization', {
    p_organization_name: organizationName,
    p_location_name: locationName,
    p_director_email: directorEmail,
    p_purpose: purpose,
  });

  if (result.error) {
    if (result.error.code === '42501' || result.error.code === '28000') return failure('denied', 'Platform admin authority is required. Nothing was created.');
    if (result.error.code === '22023') return failure('validation', 'Review the organization, location, and director email. Nothing was created.');
    return failure('unavailable', 'Passage could not create the organization right now. Nothing was created.');
  }

  const receipt = firstRpcRow<RpcReceipt>(result.data);
  if (!receipt?.organization_id || !receipt.invitation_id) return failure('unavailable', 'Passage did not return a complete creation receipt.');

  return {
    status: 'created',
    receipt: {
      organizationId: receipt.organization_id,
      invitationId: receipt.invitation_id,
      directorEmail,
      invitePath: receipt.raw_token ? `/invite/${receipt.raw_token}` : '',
      expiresAt: receipt.expires_at,
      tokenHint: receipt.token_hint,
    },
  };
}
