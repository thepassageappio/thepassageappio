import type Stripe from 'stripe';
import { resolveAcquisitionChannel } from '@/lib/billing/acquisition-channel';
import { hubspotSubscriptionStatus, legacySubscriptionPlanValue, legacySubscriptionStatus, planDisplayName } from '@/lib/billing/legacy-plan';
import { createMovementCompanionDeal, upsertSubscriptionDeal } from '@/lib/hubspot';
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
    } else if (event.type === 'customer.subscription.updated') {
      await handleSubscriptionUpdated(service, event.data.object as Stripe.Subscription);
    } else if (event.type === 'customer.subscription.deleted') {
      await handleSubscriptionDeleted(service, event.data.object as Stripe.Subscription);
    }
  } catch (error) {
    console.error('stripe webhook processing failed', event.type, error);
    return new Response('processing failed', { status: 500 });
  }

  await service.from('stripe_webhook_events').insert({ id: event.id, event_type: event.type, processed_at: new Date().toISOString() });
  return new Response('ok', { status: 200 });
}

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

  const dealResult = await upsertSubscriptionDeal({
    email,
    dealName: `${email} — ${planDisplayName(plan, period)}`,
    amountCents,
    planName: planDisplayName(plan, period),
    revenueStream: 'planning',
    renewalDateIso: currentPeriodEnd,
    subscriptionStatus: hubspotSubscriptionStatus(subscription.status),
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId,
    acquisitionChannel: acquisition.channel,
    movementType: 'new',
  });
  if (dealResult) {
    await service.from('subscriptions').update({ hubspot_deal_id: dealResult.dealId, hubspot_contact_id: dealResult.contactId }).eq('stripe_subscription_id', subscriptionId);
  }
}

async function handleSubscriptionUpdated(service: ServiceClient, subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;
  const { data: existingRow } = await service
    .from('subscriptions')
    .select('id, user_id, amount_cents, plan, hubspot_deal_id, hubspot_contact_id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();
  // No row yet means checkout.session.completed hasn't landed (delivery order isn't
  // guaranteed) -- nothing to reconcile against yet, so skip; the eventual
  // checkout.session.completed handler will create the row with current state.
  if (!existingRow) return;

  const row = existingRow as { id: string; user_id: string | null; amount_cents: number; plan: string; hubspot_deal_id: string | null; hubspot_contact_id: string | null };
  const primaryItem = subscription.items.data[0];
  const newAmountCents = primaryItem?.price.unit_amount ?? row.amount_cents;
  const currentPeriodEnd = primaryItem?.current_period_end ? new Date(primaryItem.current_period_end * 1000).toISOString() : null;
  const amountDelta = newAmountCents - row.amount_cents;

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

  if (!row.hubspot_deal_id) return;
  const { data: userRow } = row.user_id ? await service.from('users').select('email').eq('id', row.user_id).maybeSingle() : { data: null };
  const email = (userRow as { email: string } | null)?.email;
  if (!email) return;

  await upsertSubscriptionDeal({
    email,
    dealName: `${email} — subscription update`,
    amountCents: newAmountCents,
    planName: row.plan,
    revenueStream: 'planning',
    renewalDateIso: currentPeriodEnd,
    subscriptionStatus: hubspotSubscriptionStatus(subscription.status),
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    acquisitionChannel: 'organic_direct',
    movementType: amountDelta > 0 ? 'expansion' : amountDelta < 0 ? 'contraction' : 'new',
    existingDealId: row.hubspot_deal_id,
  });

  if (amountDelta !== 0 && row.hubspot_contact_id) {
    await createMovementCompanionDeal({
      email,
      dealName: `${email} — ${amountDelta > 0 ? 'expansion' : 'contraction'} (${new Date().toISOString().slice(0, 10)})`,
      amountDeltaCents: amountDelta,
      revenueStream: 'planning',
      movementType: amountDelta > 0 ? 'expansion' : 'contraction',
      contactId: row.hubspot_contact_id,
    });
  }
}

async function handleSubscriptionDeleted(service: ServiceClient, subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;
  const { data: existingRow } = await service
    .from('subscriptions')
    .select('id, user_id, amount_cents, plan, hubspot_deal_id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();
  if (!existingRow) return;
  const row = existingRow as { id: string; user_id: string | null; amount_cents: number; plan: string; hubspot_deal_id: string | null };

  await service
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', row.id);

  if (!row.hubspot_deal_id || !row.user_id) return;
  const { data: userRow } = await service.from('users').select('email').eq('id', row.user_id).maybeSingle();
  const email = (userRow as { email: string } | null)?.email;
  if (!email) return;

  await upsertSubscriptionDeal({
    email,
    dealName: `${email} — subscription cancelled`,
    amountCents: row.amount_cents,
    planName: row.plan,
    revenueStream: 'planning',
    renewalDateIso: null,
    subscriptionStatus: 'canceled',
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    acquisitionChannel: 'organic_direct',
    movementType: 'churn',
    existingDealId: row.hubspot_deal_id,
  });
}
