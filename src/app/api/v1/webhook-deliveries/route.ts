import { errorResponse, integrationFromRequest } from "@/lib/authority/http";
import { getAuthorityRepository } from "@/lib/authority/repository";
import { isLocalAuthoritySandboxAvailable, localAuthoritySandboxNotFoundResponse } from "@/lib/authority/sandbox-boundary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isLocalAuthoritySandboxAvailable()) return localAuthoritySandboxNotFoundResponse();
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
