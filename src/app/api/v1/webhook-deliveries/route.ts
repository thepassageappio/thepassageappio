import { errorResponse, integrationFromRequest } from "@/lib/authority/http";
import { getAuthorityRepository } from "@/lib/authority/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    integrationFromRequest(request);
    const recordId = new URL(request.url).searchParams.get("authorityRecordId") ?? undefined;
    return Response.json(
      { data: getAuthorityRepository().getWebhookDeliveries(recordId) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
