import { createHash } from "node:crypto";
import Stripe from "stripe";
import { createAuthorityAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripeSecretKey || !webhookSecret || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return json({ received: false, code: "webhook_configuration_missing" }, 503);
  }

  const signature = request.headers.get("stripe-signature")?.trim();
  if (!signature) return json({ received: false, code: "webhook_headers_missing" }, 400);

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    const stripe = new Stripe(stripeSecretKey);
    event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
  } catch {
    return json({ received: false, code: "webhook_signature_invalid" }, 400);
  }

  const supabase = createAuthorityAdminClient();
  const { data, error } = await supabase.rpc("ingest_and_apply_stripe_event_v2", {
    p_provider_event_id: event.id,
    p_provider_created_at: new Date(event.created * 1000).toISOString(),
    p_body_sha256: createHash("sha256").update(payload).digest("hex"),
    p_payload: event,
  });
  if (error) return json({ received: false, code: "webhook_receipt_failed" }, 500);
  return json(data);
}
