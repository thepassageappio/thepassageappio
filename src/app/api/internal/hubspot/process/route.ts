import { timingSafeEqual } from "node:crypto";
import { deliverHubSpotInquiryOutbox } from "@/lib/commercial/hubspot-inquiry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = (process.env.CRON_SECRET ?? process.env.COMMERCIAL_WORKER_SECRET)?.trim();
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || secret.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(secret), Buffer.from(supplied));
}

async function processOutbox(request: Request) {
  if (!authorized(request)) return Response.json({ ok: false, code: "not_found" }, { status: 404 });
  try {
    const result = await deliverHubSpotInquiryOutbox(10);
    return Response.json({ ok: true, ...result }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ ok: false, code: "worker_unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}

export const GET = processOutbox;
export const POST = processOutbox;
