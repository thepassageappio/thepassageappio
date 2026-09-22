import { timingSafeEqual } from "node:crypto";
import { processSubmissionDelivery } from "@/lib/authority/submission-delivery-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = Buffer.from(process.env.CRON_SECRET?.trim() ?? "");
  const supplied = Buffer.from(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  if (!secret.length || secret.length !== supplied.length || !timingSafeEqual(secret, supplied)) {
    return Response.json({ ok: false }, { status: 404 });
  }
  try {
    return Response.json({ ok: true, ...await processSubmissionDelivery() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
