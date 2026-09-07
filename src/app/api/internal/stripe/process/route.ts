import { timingSafeEqual } from "node:crypto";
import { deliverStripePilotInvoiceOutbox } from "@/lib/commercial/stripe-pilot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = (process.env.CRON_SECRET ?? process.env.COMMERCIAL_WORKER_SECRET)?.trim();
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return Boolean(secret && secret.length === supplied.length && timingSafeEqual(Buffer.from(secret), Buffer.from(supplied)));
}

async function processOutbox(request: Request) {
  if (!authorized(request)) return Response.json({ ok: false, code: "not_found" }, { status: 404 });
  try {
    const result = await deliverStripePilotInvoiceOutbox(5);
    return Response.json({ ok: true, ...result, invoiceUrl: undefined }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ ok: false, code: "worker_unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}

export const GET = processOutbox;
export const POST = processOutbox;
