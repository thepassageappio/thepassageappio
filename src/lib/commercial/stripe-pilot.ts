import "server-only";
import Stripe from "stripe";
import { createAuthorityAdminClient } from "@/lib/supabase/admin";

type PilotOutboxJob = {
  id: string;
  idempotency_key: string;
  payload: {
    order_id: string;
    organization_id: string;
    organization_name: string;
    billing_email: string;
    service_period_start: string;
    service_period_end: string;
    request_allowance: number;
    amount_minor: number;
    currency: string;
  };
};

function stripeFailure(error: unknown) {
  if (error instanceof Stripe.errors.StripeError) {
    return {
      code: error.statusCode === 401 ? "stripe_unauthorized"
        : error.statusCode === 403 ? "stripe_scope_missing"
        : error.statusCode === 429 ? "stripe_rate_limited"
        : error.statusCode && error.statusCode >= 500 ? "stripe_unavailable"
        : "stripe_invoice_invalid",
      retryable: error.statusCode === 408 || error.statusCode === 409 || error.statusCode === 429 || Boolean(error.statusCode && error.statusCode >= 500),
    };
  }
  return { code: "stripe_delivery_failed", retryable: true };
}

function unixDate(value: string) {
  return Math.floor(new Date(`${value}T00:00:00.000Z`).getTime() / 1000);
}

export async function deliverStripePilotInvoiceOutbox(maxJobs = 1) {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const priceId = process.env.STRIPE_PILOT_PRICE_ID?.trim();
  if (!secretKey || !priceId || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return { configured: false, applied: 0, failed: 0, invoiceUrl: null as string | null };
  }

  const stripe = new Stripe(secretKey);
  const admin = createAuthorityAdminClient();
  let applied = 0;
  let failed = 0;
  let invoiceUrl: string | null = null;

  for (let index = 0; index < Math.min(Math.max(maxJobs, 1), 5); index += 1) {
    const claimed = await admin.rpc("claim_stripe_pilot_outbox_v1");
    if (claimed.error) throw claimed.error;
    const job = claimed.data as PilotOutboxJob | null;
    if (!job) break;

    try {
      const customer = await stripe.customers.create({
        name: job.payload.organization_name,
        email: job.payload.billing_email,
        metadata: {
          passage_organization_id: job.payload.organization_id,
          passage_order_id: job.payload.order_id,
        },
      }, { idempotencyKey: `${job.idempotency_key}:customer` });

      const invoice = await stripe.invoices.create({
        customer: customer.id,
        collection_method: "send_invoice",
        days_until_due: 30,
        auto_advance: false,
        description: `Passage Authority founding pilot — ${job.payload.service_period_start} through ${job.payload.service_period_end}`,
        footer: "Institution pilot only. Account holders and representatives are never charged.",
        metadata: {
          passage_order_id: job.payload.order_id,
          passage_organization_id: job.payload.organization_id,
          passage_service_period_start: job.payload.service_period_start,
          passage_service_period_end: job.payload.service_period_end,
          passage_request_allowance: String(job.payload.request_allowance),
        },
      }, { idempotencyKey: `${job.idempotency_key}:invoice` });

      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        pricing: { price: priceId },
        period: {
          start: unixDate(job.payload.service_period_start),
          end: unixDate(job.payload.service_period_end),
        },
      }, { idempotencyKey: `${job.idempotency_key}:item` });

      const finalized = await stripe.invoices.finalizeInvoice(invoice.id, {}, {
        idempotencyKey: `${job.idempotency_key}:finalize`,
      });
      if (!finalized.hosted_invoice_url) throw new Error("stripe_hosted_invoice_missing");

      const completion = await admin.rpc("complete_stripe_pilot_outbox_v1", {
        p_outbox_id: job.id,
        p_provider_result: {
          stripe_customer_id: customer.id,
          stripe_invoice_id: finalized.id,
          hosted_invoice_url: finalized.hosted_invoice_url,
          invoice_number: finalized.number,
        },
      });
      if (completion.error) throw completion.error;
      applied += 1;
      invoiceUrl = finalized.hosted_invoice_url;
    } catch (error) {
      const failure = stripeFailure(error);
      await admin.rpc("fail_stripe_pilot_outbox_v1", {
        p_outbox_id: job.id,
        p_error_code: failure.code,
        p_retryable: failure.retryable,
      });
      failed += 1;
    }
  }

  return { configured: true, applied, failed, invoiceUrl };
}
