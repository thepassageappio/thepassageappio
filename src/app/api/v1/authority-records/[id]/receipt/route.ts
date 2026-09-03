import { getAuthorityRepository } from "@/lib/authority/repository";
import { actorFromRequest, errorResponse } from "@/lib/authority/http";
import { isLocalAuthoritySandboxAvailable, localAuthoritySandboxNotFoundResponse } from "@/lib/authority/sandbox-boundary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isLocalAuthoritySandboxAvailable()) return localAuthoritySandboxNotFoundResponse();
  try {
    const { id } = await params;
    const record = getAuthorityRepository().getRecord(id);
    const actor = actorFromRequest(request, record);
    return Response.json({
      data: {
        authorityRecordId: record.id,
        status: record.status,
        version: record.version,
        policy: {
          id: record.policy.id,
          label: record.policy.label,
          version: record.policy.version,
          jurisdiction: record.policy.jurisdiction,
        },
        authoritySource: record.authoritySource,
        consentSnapshots: record.consentSnapshots,
        disclosures: record.disclosures,
        decision: record.decision ?? null,
        revokedAt: record.revokedAt ?? null,
        events: record.events.filter((event) => event.audience.includes(actor.role)),
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
