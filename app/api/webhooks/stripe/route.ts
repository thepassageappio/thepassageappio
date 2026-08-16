import type Stripe from 'stripe';
import { resolveAcquisitionChannel } from '@/lib/billing/acquisition-channel';
import { b2bPlanDisplayName, legacyB2bPlanValue, legacyOneTimePlanValue, legacySubscriptionPlanValue, legacySubscriptionStatus, planDisplayName } from '@/lib/billing/legacy-plan';
import { createChurnDeal, createNewBusinessDeal, createRenewalDeal, HUBSPOT_LIFECYCLE_STAGE, upsertOrganizationCompany, type RevenueSegment } from '@/lib/hubspot';
import { getStripeClient, VENDOR_PLATFORM_FEE_PERCENT, type B2bPlanKey, type BillingPeriod, type D2cPlanKey } from '@/lib/stripe';
import { createPassageServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

type ServiceClient = NonNullable<ReturnType<typeof createPassageServiceClient>>;

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !webhookSecret) return new Response('Stripe is not configured', { status: 503 });

  const signature = request.headers.get('stripe-signature');
  const rawBody = await request.text();
  if (!signature) return new Response('Missing signature', { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  const service = createPassageServiceClient();
  if (!service) return new Response('Service unavailable', { status: 503 });

  // Checked before processing, recorded only after processing succeeds --
  // a transient failure must be retriable by Stripe, not permanently marked
  // "seen" while never actually applied.
  const { data: alreadyProcessed } = await service.from('stripe_webhook_events').select('id').eq('id', event.id).maybeSingle();
  if (alreadyProcessed) return new Response('ok', { status: 200 });

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(service, stripe, event.data.object as Stripe.Checkout.Session);
    } else if (event.type === 'invoice.paid') {
      await handleInvoicePaid(service, event.data.object as Stripe.Invoice);
    } else if (event.type === 'customer.subscription.updated') {
      await handleSubscriptionUpdated(service, event.data.object as Stripe.Subscription);
    } else if (event.type === 'customer.subscription.deleted') {
      await handleSubscriptionDeleted(service, event.data.object as Stripe.Subscription);
    } else if (event.type === 'account.updated') {
      await handleAccountUpdated(service, event.data.object as Stripe.Account);
    }
  } catch (error) {
    console.error('stripe webhook processing failed', event.type, error);
    return new Response('processing failed', { status: 500 });
  }

  await service.from('stripe_webhook_events').insert({ id: event.id, event_type: event.type, processed_at: new Date().toISOString() });
  return new Response('ok', { status: 200 });
}

// Dispatches by checkout mode/segment. First payment only -- creates the
// one-time "New Business" anchor deal (subscription paths) or a standalone
// Marketplace-adjacent one-time deal (payment mode). Every later charge on a
// subscription is handled by handleInvoicePaid instead; these never fire
// again for the same subscription/session.
async function handleCheckoutCompleted(service: ServiceClient, stripe: Stripe, session: Stripe.Checkout.Session) {
  if (session.mode === 'payment') {
    if (session.metadata?.kind === 'partner_request_payment') return handlePartnerRequestPaymentCompleted(service, session);
    return handleOneTimeCheckoutCompleted(service, session);
  }
  if (session.mode !== 'subscription' || !session.subscription || !session.customer) return;

  const isB2b = session.metadata?.segment === 'b2b_funeral_home';
  const email = session.customer_details?.email ?? session.customer_email ?? undefined;
  if (!email) return;

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const primaryItem = subscription.items.data[0];
  const amountCents = primaryItem?.price.unit_amount ?? 0;
  // Stripe moved current_period_start/end from the subscription object onto
  // each SubscriptionItem (a subscription can have items on different
  // billing cycles) -- Passage only ever creates single-item subscriptions,
  // so the first item's period is the subscription's period.
  const currentPeriodEnd = primaryItem?.current_period_end ? new Date(primaryItem.current_period_end * 1000).toISOString() : null;
  const currentPeriodStart = primaryItem?.current_period_start ? new Date(primaryItem.current_period_start * 1000).toISOString() : null;

  let legacyPlan: string;
  let planName: string;
  let revenueSegment: RevenueSegment;
  if (isB2b) {
    const plan = session.metadata?.plan as B2bPlanKey | undefined;
    if (!plan) return;
    legacyPlan = legacyB2bPlanValue(plan);
    planName = b2bPlanDisplayName(plan);
    revenueSegment = 'B2B Funeral Home';
  } else {
    const plan = session.metadata?.plan as D2cPlanKey | undefined;
    const period = session.metadata?.period as BillingPeriod | undefined;
    if (!plan || !period) return;
    legacyPlan = legacySubscriptionPlanValue(plan, period);
    planName = planDisplayName(plan, period);
    revenueSegment = 'D2C Planning';
  }

  const { data: existingUser } = await service.from('users').select('id').eq('email', email).maybeSingle();
  const userId = (existingUser as { id: string } | null)?.id ?? null;
  const acquisition = userId ? await resolveAcquisitionChannel(service, userId) : { channel: 'organic_direct' as const, referringOrganizationName: null };

  await service.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_checkout_session_id: session.id,
      plan: legacyPlan,
      status: legacySubscriptionStatus(subscription.status),
      amount_cents: amountCents,
      interval: primaryItem?.price.recurring?.interval === 'year' ? 'year' : 'month',
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      renewal_date: currentPeriodEnd,
      started_at: new Date().toISOString(),
      last_payment_date: new Date().toISOString(),
      last_payment_amount: amountCents,
      payment_count: 1,
      lifetime_value_cents: amountCents,
      metadata: userId ? {} : { pending_account_email: email },
    },
    { onConflict: 'stripe_subscription_id' },
  );

  if (userId && acquisition.referringOrganizationName) {
    await service.from('users').update({ referral_source: `funeral_home_referral:${acquisition.referringOrganizationName}` }).eq('id', userId);
  }

  // Both branches: a payer gets something real the instant payment clears --
  // no manual admin step, matching the "no bottleneck" priority applied to
  // vendor payouts. Best-effort: a failure here must never block the
  // payment record or the HubSpot deal below.
  if (isB2b) {
    try {
      await provisionB2bOrganizationIfNeeded(service, {
        email,
        userId,
        organizationName: session.custom_fields?.find((field) => field.key === 'organization_name')?.text?.value ?? null,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: primaryItem?.price.id ?? '',
        legacyPlan,
        billingCity: session.customer_details?.address?.city ?? null,
        billingState: session.customer_details?.address?.state ?? null,
      });
    } catch (error) {
      console.error('b2b auto-provision failed', error);
    }
  } else {
    try {
      await provisionD2cFamilyRecordIfNeeded(service, { email, userId, stripeSubscriptionId: subscriptionId, stripeCheckoutSessionId: session.id });
    } catch (error) {
      console.error('d2c auto-provision failed', error);
    }
  }

  const dealResult = await createNewBusinessDeal({
    email,
    dealName: `${email} — ${planName}`,
    amountCents,
    planName,
    revenueSegment,
    renewalDateIso: currentPeriodEnd,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId,
    acquisitionChannel: acquisition.channel,
    // B2B: this person now runs a real funeral-home org day to day, same
    // stage as every other funeral-home person. D2C: a paying subscriber.
    contactLifecycleStage: isB2b ? HUBSPOT_LIFECYCLE_STAGE.funeralHomeDirectorOrEmployee : HUBSPOT_LIFECYCLE_STAGE.customer,
  });
  if (dealResult) {
    await service.from('subscriptions').update({ hubspot_deal_id: dealResult.dealId, hubspot_contact_id: dealResult.contactId }).eq('stripe_subscription_id', subscriptionId);
  }
}

// Auto-provisions a real organization + first location + owner membership
// for a B2B checkout, so a funeral home never has to take a separate manual
// step (self-serve signup or admin bootstrap) to actually use what they just
// paid for. Two paths: a brand-new email gets a Supabase-invited account
// (Supabase's own built-in invite email, sent via its configured SMTP, is
// the "magic link" -- no custom email-sending code needed) landing them
// straight in their new org at /director; an email that already has an
// account but no active org membership gets the org created directly, ready
// the next time they sign in normally. An email that already manages an
// active org is left untouched -- never create a duplicate workspace.
// Billing city/state (required at checkout -- see startB2bCheckout) is
// written to both the location row and the HubSpot Company record, so real
// location data exists for this org from day one instead of staying null.
async function provisionB2bOrganizationIfNeeded(service: ServiceClient, params: {
  email: string;
  userId: string | null;
  organizationName: string | null;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  legacyPlan: string;
  billingCity: string | null;
  billingState: string | null;
}): Promise<void> {
  const { email, organizationName, stripeCustomerId, stripeSubscriptionId, stripePriceId, legacyPlan, billingCity, billingState } = params;
  let ownerUserId = params.userId;

  if (ownerUserId) {
    const { data: existingMembership } = await service
      .from('organization_members')
      .select('id')
      .eq('user_id', ownerUserId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();
    if (existingMembership) return;
  }

  const orgName = organizationName?.trim() || `${email.split('@')[0]}'s funeral home`;
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.thepassageapp.io';

  if (!ownerUserId) {
    const { data: invited, error: inviteError } = await service.auth.admin.inviteUserByEmail(email, { redirectTo: `${origin}/director` });
    if (inviteError || !invited?.user) {
      console.error('b2b auto-provision: invite failed, organization not created', inviteError);
      return;
    }
    ownerUserId = invited.user.id;
  }

  const nowIso = new Date().toISOString();
  const { data: newOrg, error: orgError } = await service
    .from('organizations')
    .insert({
      name: orgName,
      created_by: ownerUserId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_price_id: stripePriceId,
      partner_plan: legacyPlan,
    })
    .select('id')
    .single();
  if (orgError || !newOrg) {
    console.error('b2b auto-provision: organization insert failed', orgError);
    return;
  }

  // Non-blocking, matching every other HubSpot call in this file: Passage's
  // own record of the organization must never depend on HubSpot being
  // reachable. Every piece of onboarding data collected at checkout --
  // including the billing city/state Stripe just required -- should land in
  // the Company record, not just Supabase.
  await upsertOrganizationCompany({ name: orgName, locationCount: 1, city: billingCity ?? undefined, state: billingState ?? undefined }).catch(() => null);

  const { data: newLocation, error: locationError } = await service
    .from('organization_locations')
    .insert({ organization_id: newOrg.id, name: `${orgName} — Main location`, city: billingCity, state: billingState })
    .select('id')
    .single();
  if (locationError || !newLocation) {
    console.error('b2b auto-provision: location insert failed', locationError);
    return;
  }

  const { data: newMember, error: memberError } = await service
    .from('organization_members')
    .insert({ organization_id: newOrg.id, user_id: ownerUserId, email, role: 'owner', status: 'active', accepted_at: nowIso })
    .select('id')
    .single();
  if (memberError || !newMember) {
    console.error('b2b auto-provision: member insert failed', memberError);
    return;
  }

  await service
    .from('organization_member_locations')
    .insert({ organization_member_id: newMember.id, organization_location_id: newLocation.id, granted_by_user_id: ownerUserId });
}

// D2C mirror of provisionB2bOrganizationIfNeeded. Found while auditing why a
// paying D2C customer had no product: pricing/success's own copy promises
// "use the secure link in your confirmation email to sign in and start your
// family record" -- but nothing ever sent that email or created that
// record, and subscriptions.metadata.pending_account_email was written by
// this same file but never read anywhere. Fixed both: a brand-new email
// gets Supabase's built-in invite email (the "secure link" the copy already
// promised) and their subscription row is linked to the new account the
// moment it's created; either a new or an already-existing account then
// gets their first family record (public.workflows, user_id-owned, no
// organization) created automatically -- never a second one if they already
// have one, matching self_serve_create_family_record's own invariant.
async function provisionD2cFamilyRecordIfNeeded(service: ServiceClient, params: {
  email: string;
  userId: string | null;
  stripeSubscriptionId: string | null;
  stripeCheckoutSessionId: string;
}): Promise<void> {
  let ownerUserId = params.userId;
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.thepassageapp.io';

  if (!ownerUserId) {
    const { data: invited, error: inviteError } = await service.auth.admin.inviteUserByEmail(params.email, { redirectTo: `${origin}/case` });
    if (inviteError || !invited?.user) {
      console.error('d2c auto-provision: invite failed, family record not created', inviteError);
      return;
    }
    ownerUserId = invited.user.id;

    const linkQuery = service.from('subscriptions').update({ user_id: ownerUserId, metadata: {} });
    await (params.stripeSubscriptionId
      ? linkQuery.eq('stripe_subscription_id', params.stripeSubscriptionId)
      : linkQuery.eq('stripe_checkout_session_id', params.stripeCheckoutSessionId));
  }

  const { data: existingWorkflow } = await service.from('workflows').select('id').eq('user_id', ownerUserId).limit(1).maybeSingle();
  if (existingWorkflow) return;

  await service.from('workflows').insert({
    user_id: ownerUserId,
    name: 'My family record',
    trigger_type: 'death_confirmed',
    mode: 'green',
    path: 'green',
    status: 'planning_active',
    phase: 'Planning started',
  });
}

// One-time purchases (single-estate lifetime, urgent one-time) -- no
// recurring subscription id exists, so this is a standalone record
// (interval='once', already a valid legacy status/interval value) rather
// than an upsert keyed on stripe_subscription_id. Idempotency is handled at
// the event level (stripe_webhook_events), so a plain insert is safe here.
async function handleOneTimeCheckoutCompleted(service: ServiceClient, session: Stripe.Checkout.Session) {
  const kind = session.metadata?.plan === 'urgent_one_time' ? 'urgent' : 'single_estate';
  const email = session.customer_details?.email ?? session.customer_email ?? undefined;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const amountCents = session.amount_total ?? 0;
  if (!email) return;

  const { data: existingUser } = await service.from('users').select('id').eq('email', email).maybeSingle();
  const userId = (existingUser as { id: string } | null)?.id ?? null;
  const acquisition = userId ? await resolveAcquisitionChannel(service, userId) : { channel: 'organic_direct' as const, referringOrganizationName: null };

  await service.from('subscriptions').insert({
    user_id: userId,
    stripe_customer_id: customerId ?? null,
    stripe_checkout_session_id: session.id,
    plan: legacyOneTimePlanValue(kind),
    status: 'active',
    amount_cents: amountCents,
    interval: 'once',
    started_at: new Date().toISOString(),
    last_payment_date: new Date().toISOString(),
    last_payment_amount: amountCents,
    payment_count: 1,
    lifetime_value_cents: amountCents,
    metadata: userId ? {} : { pending_account_email: email },
  });

  if (userId && acquisition.referringOrganizationName) {
    await service.from('users').update({ referral_source: `funeral_home_referral:${acquisition.referringOrganizationName}` }).eq('id', userId);
  }

  try {
    await provisionD2cFamilyRecordIfNeeded(service, { email, userId, stripeSubscriptionId: null, stripeCheckoutSessionId: session.id });
  } catch (error) {
    console.error('d2c auto-provision failed', error);
  }

  const planName = kind === 'urgent' ? 'Urgent · One-time' : 'Single Estate · One-time';
  await createNewBusinessDeal({
    email,
    dealName: `${email} — ${planName}`,
    amountCents,
    planName,
    revenueSegment: kind === 'urgent' ? 'D2C Urgent' : 'D2C Planning',
    renewalDateIso: null,
    stripeSubscriptionId: session.id,
    stripeCustomerId: customerId ?? '',
    acquisitionChannel: acquisition.channel,
    contactLifecycleStage: HUBSPOT_LIFECYCLE_STAGE.customer,
  });
}

// Director approved a vendor's quote and paid it -- moves the request from
// 'quoted' straight to 'in_progress' (funds captured, held by the platform
// until verification) with no manual step by anyone at Passage. Writes
// directly rather than through an RPC since there is no authenticated user
// in this context, matching every other handler in this file. The
// .eq('status', 'quoted') guard is a second line of defense on top of the
// top-level stripe_webhook_events dedup, in case this event is ever
// re-delivered after the row has already moved on.
async function handlePartnerRequestPaymentCompleted(service: ServiceClient, session: Stripe.Checkout.Session) {
  const partnerRequestId = session.metadata?.partner_request_id;
  if (!partnerRequestId) return;

  const { data: existingRow } = await service
    .from('partner_requests')
    .select('id, status, version, organization_id, partner_organization_id')
    .eq('id', partnerRequestId)
    .maybeSingle();
  if (!existingRow) return;
  const row = existingRow as { id: string; status: string; version: number; organization_id: string; partner_organization_id: string };
  if (row.status !== 'quoted') return;

  const amountCents = session.amount_total ?? 0;
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null);
  const platformFeeCents = Math.round((amountCents * VENDOR_PLATFORM_FEE_PERCENT) / 100);
  const vendorPayoutCents = amountCents - platformFeeCents;
  const nowIso = new Date().toISOString();

  const { error: updateError } = await service
    .from('partner_requests')
    .update({
      status: 'in_progress',
      version: row.version + 1,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      platform_fee_cents: platformFeeCents,
      vendor_payout_cents: vendorPayoutCents,
      payment_captured_at: nowIso,
      started_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', row.id)
    .eq('status', 'quoted');
  if (updateError) return;

  await service.from('partner_request_events').insert({
    partner_request_id: row.id,
    organization_id: row.organization_id,
    partner_organization_id: row.partner_organization_id,
    name: 'partner_request.payment_captured',
    previous_state: 'quoted',
    next_state: 'in_progress',
    idempotency_key: `partner_request_payment_captured:${session.id}`,
    metadata: { stripe_checkout_session_id: session.id, amount_cents: amountCents, platform_fee_cents: platformFeeCents, vendor_payout_cents: vendorPayoutCents },
  });
}

// The actual renewal trigger. Fires once per billing cycle when Stripe
// successfully charges the recurring invoice -- filtered to
// billing_reason === 'subscription_cycle' specifically so a one-off
// mid-cycle proration invoice (billing_reason 'subscription_update') does
// not also create a Renewal deal for the same underlying change; that
// change is instead folded into the next regular cycle's renewal deal via
// prior_subscription_amount_cents.
async function handleInvoicePaid(service: ServiceClient, invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== 'subscription_cycle') return;
  const subscriptionId = typeof invoice.parent?.subscription_details?.subscription === 'string'
    ? invoice.parent.subscription_details.subscription
    : invoice.parent?.subscription_details?.subscription?.id;
  if (!subscriptionId) return;

  const { data: existingRow } = await service
    .from('subscriptions')
    .select('id, user_id, amount_cents, lifetime_value_cents, payment_count, plan')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();
  // No row yet means this invoice arrived before checkout.session.completed's
  // row write (delivery order isn't guaranteed) -- nothing to compare a
  // "prior amount" against yet, so skip; this specific cycle's renewal deal
  // is lost, but the subscription's state stays correct from the next event.
  if (!existingRow) return;
  const row = existingRow as { id: string; user_id: string | null; amount_cents: number; lifetime_value_cents: number | null; payment_count: number | null; plan: string };

  const newAmountCents = invoice.amount_paid;
  const priorAmountCents = row.amount_cents;
  const lineItem = invoice.lines.data[0];
  const periodEnd = lineItem?.period?.end ? new Date(lineItem.period.end * 1000).toISOString() : null;
  const newLifetimeValueCents = (row.lifetime_value_cents ?? 0) + newAmountCents;

  await service
    .from('subscriptions')
    .update({
      amount_cents: newAmountCents,
      current_period_end: periodEnd,
      renewal_date: periodEnd,
      last_payment_date: new Date().toISOString(),
      last_payment_amount: newAmountCents,
      payment_count: (row.payment_count ?? 0) + 1,
      lifetime_value_cents: newLifetimeValueCents,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);

  if (!row.user_id) return;
  const { data: userRow } = await service.from('users').select('email').eq('id', row.user_id).maybeSingle();
  const email = (userRow as { email: string } | null)?.email;
  if (!email) return;

  const dealId = await createRenewalDeal({
    email,
    dealName: `${email} — renewal (${new Date().toISOString().slice(0, 10)})`,
    amountCents: newAmountCents,
    priorAmountCents,
    planName: row.plan,
    revenueSegment: 'D2C Planning',
    renewalDateIso: periodEnd,
    stripeSubscriptionId: subscriptionId,
    cumulativeLifetimeValueCents: newLifetimeValueCents,
  });
  if (dealId) {
    await service.from('subscriptions').update({ hubspot_deal_id: dealId }).eq('id', row.id);
  }
}

// State-sync only -- does not create or update any HubSpot deal. Renewal
// deals are created by handleInvoicePaid; this just keeps Supabase's status
// (e.g. past_due after a failed charge, or a plan change taking effect)
// current between renewal cycles so the next invoice.paid has an accurate
// prior amount to compare against.
async function handleSubscriptionUpdated(service: ServiceClient, subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;
  const { data: existingRow } = await service
    .from('subscriptions')
    .select('id, amount_cents')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();
  if (!existingRow) return;
  const row = existingRow as { id: string; amount_cents: number };

  const primaryItem = subscription.items.data[0];
  // Sum every line item, not just the first -- a subscription with an
  // Estate Add-On has two items, and the total (not just the base plan's
  // price) is the correct current amount.
  const newAmountCents = subscription.items.data.length > 0
    ? subscription.items.data.reduce((total, item) => total + (item.price.unit_amount ?? 0) * (item.quantity ?? 1), 0)
    : row.amount_cents;
  const currentPeriodEnd = primaryItem?.current_period_end ? new Date(primaryItem.current_period_end * 1000).toISOString() : null;

  await service
    .from('subscriptions')
    .update({
      status: legacySubscriptionStatus(subscription.status),
      amount_cents: newAmountCents,
      current_period_end: currentPeriodEnd,
      renewal_date: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);
}

async function handleSubscriptionDeleted(service: ServiceClient, subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;
  const { data: existingRow } = await service
    .from('subscriptions')
    .select('id, user_id, amount_cents, plan')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();
  if (!existingRow) return;
  const row = existingRow as { id: string; user_id: string | null; amount_cents: number; plan: string };

  await service
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', row.id);

  if (!row.user_id) return;
  const { data: userRow } = await service.from('users').select('email').eq('id', row.user_id).maybeSingle();
  const email = (userRow as { email: string } | null)?.email;
  if (!email) return;

  await createChurnDeal({
    email,
    dealName: `${email} — churned (${new Date().toISOString().slice(0, 10)})`,
    lastAmountCents: row.amount_cents,
    planName: row.plan,
    revenueSegment: 'D2C Planning',
    stripeSubscriptionId: subscriptionId,
  });
}

// Vendor Connect account status changed -- syncs charges/payouts/details
// flags onto the matching partner_organizations row so the director's
// vendor picker (gated on stripe_connect_payouts_enabled) reflects reality
// without waiting for the vendor to reload their own payouts page. A no-op
// for any account this app didn't create (no matching row).
async function handleAccountUpdated(service: ServiceClient, account: Stripe.Account) {
  await service
    .from('partner_organizations')
    .update({
      stripe_connect_charges_enabled: account.charges_enabled ?? false,
      stripe_connect_payouts_enabled: account.payouts_enabled ?? false,
      stripe_connect_details_submitted: account.details_submitted ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_connect_account_id', account.id);
}
