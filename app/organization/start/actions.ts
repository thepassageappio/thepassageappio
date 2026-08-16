'use server';

import { verifiedUser } from '@/lib/auth/session';
import { firstRpcRow } from '@/lib/auth/invitations';
import { upsertContact, upsertOrganizationCompany } from '@/lib/hubspot';
import { createPassageServerClient } from '@/lib/supabase/server';

export type OrganizationCreationState = {
  status: 'idle' | 'validation' | 'denied' | 'conflict' | 'unavailable' | 'created';
  message?: string;
};

type RpcReceipt = { organization_id: string; organization_location_id: string; organization_member_id: string };

function failure(status: OrganizationCreationState['status'], message: string): OrganizationCreationState {
  return { status, message };
}

export async function createOrganization(_previous: OrganizationCreationState, formData: FormData): Promise<OrganizationCreationState> {
  const organizationName = String(formData.get('organizationName') ?? '').trim();
  const locationName = String(formData.get('locationName') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const state = String(formData.get('state') ?? '').trim();

  if (!organizationName || organizationName.length > 200) return failure('validation', 'Enter your funeral home’s name. Nothing was created.');
  if (!locationName || locationName.length > 200) return failure('validation', 'Enter your first location’s name. Nothing was created.');
  if (city.length > 100) return failure('validation', 'Shorten the city name. Nothing was created.');
  if (state.length > 56) return failure('validation', 'Shorten the state. Nothing was created.');

  const client = await createPassageServerClient();
  if (!client) return failure('unavailable', 'Passage could not verify sign-in right now. Nothing was created.');
  const user = await verifiedUser(client);
  if (!user) return failure('denied', 'Sign in before creating an organization. Nothing was created.');

  const result = await client.rpc('self_serve_create_organization', {
    p_organization_name: organizationName,
    p_location_name: locationName,
    p_city: city || null,
    p_state: state || null,
  });

  if (result.error) {
    if (result.error.code === '28000') return failure('denied', 'Sign in before creating an organization. Nothing was created.');
    if (result.error.code === '22023' && result.error.message.includes('already belongs')) {
      return failure('conflict', 'This account already belongs to an active organization. Sign in with a different account, or ask that organization’s owner to invite you.');
    }
    if (result.error.code === '22023') return failure('validation', 'Review the organization and location names. Nothing was created.');
    return failure('unavailable', 'Passage could not create the organization right now. Nothing was created.');
  }

  const receipt = firstRpcRow<RpcReceipt>(result.data);
  if (!receipt?.organization_id) return failure('unavailable', 'Passage did not confirm the new organization. Nothing is shown as created.');

  // Non-blocking: HubSpot tracking must never stand between a funeral home
  // and its own new organization existing. Every piece of onboarding data
  // collected here should land in HubSpot, not just the Supabase row --
  // including the owner as a marketable Contact for future newsletters,
  // not just a Company record nobody can email.
  await upsertOrganizationCompany({ name: organizationName, locationCount: 1, city: city || undefined, state: state || undefined }).catch(() => null);
  if (user.email) await upsertContact(user.email).catch(() => null);

  return { status: 'created' };
}
