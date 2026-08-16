'use server';

import { redirect } from 'next/navigation';
import { resolvePartnerViewer } from '@/lib/auth/partner-authorization';
import { getStripeClient } from '@/lib/stripe';
import { createPassageServerClient } from '@/lib/supabase/server';

export type PayoutStatus = {
  hasAccount: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
};

export type PayoutStatusResult =
  | { ok: true; role: 'owner' | 'member'; organizationName: string; status: PayoutStatus }
  | { ok: false; message: string };

export async function loadPayoutStatus(): Promise<PayoutStatusResult> {
  const viewerResult = await resolvePartnerViewer();
  if (!viewerResult.ok) return { ok: false, message: 'Passage could not verify current vendor authority.' };
  const client = await createPassageServerClient();
  if (!client) return { ok: false, message: 'The isolated workspace data service is unavailable.' };

  const { data, error } = await client
    .from('partner_organizations')
    .select('stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_details_submitted')
    .eq('id', viewerResult.viewer.partnerOrganizationId)
    .maybeSingle();
  if (error || !data) return { ok: false, message: 'Passage could not load payout status right now.' };

  const row = data as { stripe_connect_account_id: string | null; stripe_connect_charges_enabled: boolean; stripe_connect_payouts_enabled: boolean; stripe_connect_details_submitted: boolean };
  return {
    ok: true,
    role: viewerResult.viewer.role,
    organizationName: viewerResult.viewer.partnerOrganizationName,
    status: {
      hasAccount: row.stripe_connect_account_id !== null,
      chargesEnabled: row.stripe_connect_charges_enabled,
      payoutsEnabled: row.stripe_connect_payouts_enabled,
      detailsSubmitted: row.stripe_connect_details_submitted,
    },
  };
}

// Creates (first time) or reuses the vendor's Stripe Express account, then
// redirects to Stripe's hosted onboarding flow. Owner-only -- a vendor
// "member" (non-owner staff) cannot set up or change payout details.
export async function startPayoutOnboarding(): Promise<void> {
  const viewerResult = await resolvePartnerViewer();
  if (!viewerResult.ok || viewerResult.viewer.role !== 'owner') {
    redirect('/partner/payouts?error=denied');
  }
  const viewer = viewerResult.viewer;

  const stripe = getStripeClient();
  const client = await createPassageServerClient();
  if (!stripe || !client) redirect('/partner/payouts?error=unavailable');

  const { data: existing } = await client!
    .from('partner_organizations')
    .select('stripe_connect_account_id')
    .eq('id', viewer.partnerOrganizationId)
    .maybeSingle();
  let accountId = (existing as { stripe_connect_account_id: string | null } | null)?.stripe_connect_account_id ?? null;

  if (!accountId) {
    const account = await stripe!.accounts.create({
      type: 'express',
      email: viewer.email,
      business_type: 'company',
      capabilities: { transfers: { requested: true }, card_payments: { requested: true } },
      metadata: { partner_organization_id: viewer.partnerOrganizationId },
    });
    const linkResult = await client!.rpc('create_partner_connect_account_idempotent', {
      p_partner_organization_id: viewer.partnerOrganizationId,
      p_stripe_connect_account_id: account.id,
    });
    if (linkResult.error) redirect('/partner/payouts?error=unavailable');
    accountId = account.id;
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.thepassageapp.io';
  const accountLink = await stripe!.accountLinks.create({
    account: accountId!,
    refresh_url: `${origin}/partner/payouts?onboarding=refresh`,
    return_url: `${origin}/partner/payouts?onboarding=return`,
    type: 'account_onboarding',
  });
  redirect(accountLink.url);
}

// Called on return from Stripe's hosted onboarding so the vendor sees
// current status immediately rather than waiting for the account.updated
// webhook to arrive.
export async function syncPayoutStatusOnReturn(): Promise<void> {
  const viewerResult = await resolvePartnerViewer();
  if (!viewerResult.ok) return;
  const stripe = getStripeClient();
  const client = await createPassageServerClient();
  if (!stripe || !client) return;

  const { data } = await client
    .from('partner_organizations')
    .select('stripe_connect_account_id')
    .eq('id', viewerResult.viewer.partnerOrganizationId)
    .maybeSingle();
  const accountId = (data as { stripe_connect_account_id: string | null } | null)?.stripe_connect_account_id;
  if (!accountId) return;

  const account = await stripe.accounts.retrieve(accountId).catch(() => null);
  if (!account) return;

  await client.rpc('sync_own_partner_connect_status', {
    p_charges_enabled: account.charges_enabled ?? false,
    p_payouts_enabled: account.payouts_enabled ?? false,
    p_details_submitted: account.details_submitted ?? false,
  });
}
