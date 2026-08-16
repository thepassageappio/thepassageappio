'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { verifiedUser } from '@/lib/auth/session';
import { ESTATE_ADD_ON_PRICE_ID, getStripeClient } from '@/lib/stripe';
import { createPassageServerClient } from '@/lib/supabase/server';

export type BillingSummary = {
  plan: string;
  amountCents: number;
  interval: 'month' | 'year' | 'once';
  status: string;
  renewalDate: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  addOnSeats: number;
};

export type BillingSummaryResult =
  | { ok: true; data: BillingSummary }
  | { ok: false; reason: 'signed-out' | 'no-subscription' | 'unavailable' };

export async function loadBillingSummary(): Promise<BillingSummaryResult> {
  const client = await createPassageServerClient();
  if (!client) return { ok: false, reason: 'unavailable' };
  const user = await verifiedUser(client);
  if (!user) return { ok: false, reason: 'signed-out' };

  const { data, error } = await client
    .from('subscriptions')
    .select('plan, amount_cents, interval, status, renewal_date, stripe_subscription_id, stripe_customer_id')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, reason: 'unavailable' };
  if (!data) return { ok: false, reason: 'no-subscription' };

  const row = data as { plan: string; amount_cents: number; interval: 'month' | 'year' | 'once'; status: string; renewal_date: string | null; stripe_subscription_id: string | null; stripe_customer_id: string | null };

  let addOnSeats = 0;
  const stripe = getStripeClient();
  if (stripe && row.stripe_subscription_id) {
    const subscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id).catch(() => null);
    const addOnItem = subscription?.items.data.find((item) => item.price.id === ESTATE_ADD_ON_PRICE_ID.monthly || item.price.id === ESTATE_ADD_ON_PRICE_ID.annual);
    addOnSeats = addOnItem?.quantity ?? 0;
  }

  return {
    ok: true,
    data: {
      plan: row.plan,
      amountCents: row.amount_cents,
      interval: row.interval,
      status: row.status,
      renewalDate: row.renewal_date,
      stripeSubscriptionId: row.stripe_subscription_id,
      stripeCustomerId: row.stripe_customer_id,
      addOnSeats,
    },
  };
}

// Adds (or increments) an Estate Add-On line item on the caller's own active
// subscription -- never creates a new subscription. Billing period (monthly
// vs annual add-on price) is matched to the base subscription's own
// interval so a monthly subscriber is never charged an annual add-on price
// or vice versa.
export async function addEstateSeat(): Promise<void> {
  const client = await createPassageServerClient();
  if (!client) redirect('/account/billing?error=unavailable');
  const user = await verifiedUser(client!);
  if (!user) redirect('/account/billing?error=denied');

  const { data } = await client!
    .from('subscriptions')
    .select('stripe_subscription_id, interval')
    .eq('user_id', user!.id)
    .in('status', ['active', 'trialing'])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = data as { stripe_subscription_id: string | null; interval: 'month' | 'year' | 'once' } | null;
  if (!row?.stripe_subscription_id || row.interval === 'once') redirect('/account/billing?error=no-subscription');

  const stripe = getStripeClient();
  if (!stripe) redirect('/account/billing?error=unavailable');
  const addOnPriceId = row!.interval === 'year' ? ESTATE_ADD_ON_PRICE_ID.annual : ESTATE_ADD_ON_PRICE_ID.monthly;

  const subscription = await stripe!.subscriptions.retrieve(row!.stripe_subscription_id!);
  const existingItem = subscription.items.data.find((item) => item.price.id === addOnPriceId);

  if (existingItem) {
    await stripe!.subscriptionItems.update(existingItem.id, { quantity: (existingItem.quantity ?? 0) + 1 });
  } else {
    await stripe!.subscriptionItems.create({ subscription: row!.stripe_subscription_id!, price: addOnPriceId, quantity: 1 });
  }

  revalidatePath('/account/billing');
  redirect('/account/billing?added=estate');
}

// Hands off to Stripe's own hosted Billing Portal for payment-method
// updates and cancellation -- deliberately not rebuilt here, since Stripe's
// own portal already does this correctly and safely.
export async function openBillingPortal(): Promise<void> {
  const client = await createPassageServerClient();
  if (!client) redirect('/account/billing?error=unavailable');
  const user = await verifiedUser(client!);
  if (!user) redirect('/account/billing?error=denied');

  const { data } = await client!
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user!.id)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const customerId = (data as { stripe_customer_id: string | null } | null)?.stripe_customer_id;
  if (!customerId) redirect('/account/billing?error=no-subscription');

  const stripe = getStripeClient();
  if (!stripe) redirect('/account/billing?error=unavailable');
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.thepassageapp.io';
  const portalSession = await stripe!.billingPortal.sessions.create({
    customer: customerId!,
    return_url: `${origin}/account/billing`,
  });
  redirect(portalSession.url);
}
