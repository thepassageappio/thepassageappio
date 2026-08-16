import type Stripe from 'stripe';
import { resolveAcquisitionChannel } from '@/lib/billing/acquisition-channel';
import { legacySubscriptionPlanValue, legacySubscriptionStatus, planDisplayName } from '@/lib/billing/legacy-plan';
import { createChurnDeal, createNewBusinessDeal, createRenewalDeal } from '@/lib/hubspot';
import { getStripeClient, type BillingPeriod, type PricingPlanKey } from '@/lib/stripe';
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

// First payment only -- creates the one-time "New Business" anchor deal.
// Every later charge is handled by handleInvoicePaid instead; this function
// never fires again for the same subscription.
async function handleCheckoutCompleted(service: ServiceClient, stripe: Stripe, session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription' || !session.subscription || !session.customer) return;
  const plan = session.metadata?.plan as PricingPlanKey | undefined;
  const period = session.metadata?.period as BillingPeriod | undefined;
  const email = session.customer_details?.email ?? session.customer_email ?? undefined;
  if (!plan || !period || !email) return;

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

  const { data: existingUser } = await service.from('users').select('id').eq('email', email).maybeSingle();
  const userId = (existingUser as { id: string } | null)?.id ?? null;
  const acquisition = userId ? await resolveAcquisitionChannel(service, userId) : { channel: 'organic_direct' as const, referringOrganizationName: null };

  await service.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_checkout_session_id: session.id,
      plan: legacySubscriptionPlanValue(plan, period),
      status: legacySubscriptionStatus(subscription.status),
      amount_cents: amountCents,
      interval: period === 'monthly' ? 'month' : 'year',
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

  const dealResult = await createNewBusinessDeal({
    email,
    dealName: `${email} — ${planDisplayName(plan, period)}`,
    amountCents,
    planName: planDisplayName(plan, period),
    revenueSegment: 'D2C Planning',
    renewalDateIso: currentPeriodEnd,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId,
    acquisitionChannel: acquisition.channel,
  });
  if (dealResult) {
    await service.from('subscriptions').update({ hubspot_deal_id: dealResult.dealId, hubspot_contact_id: dealResult.contactId }).eq('stripe_subscription_id', subscriptionId);
  }
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
  const newAmountCents = primaryItem?.price.unit_amount ?? row.amount_cents;
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
