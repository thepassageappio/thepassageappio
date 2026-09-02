import { createHash } from "node:crypto";
import { Resend } from "resend";
import { parseResendDeliveryEvent } from "@/lib/authority/resend-webhook";
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
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (!webhookSecret || !resendApiKey || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return json({ received: false, code: "webhook_configuration_missing" }, 503);
  }

  const id = request.headers.get("svix-id")?.trim();
  const timestamp = request.headers.get("svix-timestamp")?.trim();
  const signature = request.headers.get("svix-signature")?.trim();
  if (!id || !timestamp || !signature) return json({ received: false, code: "webhook_headers_missing" }, 400);

  const payload = await request.text();
  let verified;
  try {
    verified = new Resend(resendApiKey).webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret,
    });
  } catch {
    return json({ received: false, code: "webhook_signature_invalid" }, 400);
  }

  const receipt = parseResendDeliveryEvent(verified);
  if (!receipt) return json({ received: true, ignored: true });

  const supabase = createAuthorityAdminClient();
  const { data, error } = await supabase.rpc("record_resend_delivery_event_v1", {
    p_provider_event_id: id,
    p_event_type: receipt.eventType,
    p_provider_message_id: receipt.providerMessageId,
    p_event_occurred_at: receipt.occurredAt,
    p_failure_reason: receipt.failureReason,
    p_payload_hash: createHash("sha256").update(payload).digest("hex"),
  });
  if (error) return json({ received: false, code: "webhook_receipt_failed" }, 500);

  return json(data);
}
