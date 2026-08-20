'use server';

import { verifiedUser } from '@/lib/auth/session';
import { firstRpcRow } from '@/lib/auth/invitations';
import { createSelfServeSignupTask, createTrialDeal, HUBSPOT_LIFECYCLE_STAGE, upsertContact, upsertOrganizationCompany } from '@/lib/hubspot';
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
  const ownerDisplayName = String(formData.get('ownerDisplayName') ?? '').trim();
  const organizationName = String(formData.get('organizationName') ?? '').trim();
  const locationName = String(formData.get('locationName') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const state = String(formData.get('state') ?? '').trim();

  if (!ownerDisplayName || ownerDisplayName.length > 200) return failure('validation', 'Enter your name. Nothing was created.');
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
    p_owner_display_name: ownerDisplayName,
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
  // the owner as a marketable Contact, an open "Pilot Active" deal tracking
  // the 90-day trial (matches supabase/migrations/20260816120000's gate,
  // which starts the same clock from organizations.created_at), and a task
  // assigned to the founder so a self-serve signup is never silent.
  const company = await upsertOrganizationCompany({ name: organizationName, locationCount: 1, city: city || undefined, state: state || undefined }).catch(() => null);
  const [ownerFirstName, ...ownerLastNameParts] = ownerDisplayName.split(/\s+/).filter(Boolean);
  const contactId = user.email
    ? await upsertContact(user.email, ownerFirstName, ownerLastNameParts.join(' ') || undefined, undefined, HUBSPOT_LIFECYCLE_STAGE.funeralHomeDirectorOrEmployee).catch(() => null)
    : null;
  // M3 exit criterion 5 ("a named recovery owner for every failure"): this
  // was the one site left uncovered when crm_sync_events was wired into the
  // Stripe webhook -- it runs on the user-context client (a Server Action,
  // not a trusted service-role context), so failures here are logged via
  // passage_private.log_crm_sync_failure (a SECURITY DEFINER RPC) rather
  // than a direct table write, which RLS would silently block.
  const trialEndsAtIso = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  if (user.email) {
    const dealId = await createTrialDeal({ email: user.email, organizationName, trialEndsAtIso }).catch(() => null);
    if (!dealId) {
      try {
        await client.rpc('log_crm_sync_failure', {
          source: 'organization_start',
          event_type: 'trial_deal_creation',
          email: user.email,
          error: 'createTrialDeal returned no deal id -- see server logs around this timestamp for the underlying HubSpot failure.',
        });
      } catch {
        // Best-effort logging must never block or fail the signup itself.
      }
    }
  }
  await createSelfServeSignupTask({ organizationName, contactId, companyId: company?.companyId ?? null }).catch(() => null);

  return { status: 'created' };
}
