import { getAuthorityRepository } from "@/lib/authority/repository";
import { actorFromRequest, commandFromBody, errorResponse, publicResult, recordProjection } from "@/lib/authority/http";
import { isLocalAuthoritySandboxAvailable, localAuthoritySandboxNotFoundResponse } from "@/lib/authority/sandbox-boundary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isLocalAuthoritySandboxAvailable()) return localAuthoritySandboxNotFoundResponse();
  try {
    const { id } = await params;
    const record = getAuthorityRepository().getRecord(id);
    const actor = actorFromRequest(request, record);
    return Response.json({ data: recordProjection(record, actor.role) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isLocalAuthoritySandboxAvailable()) return localAuthoritySandboxNotFoundResponse();
  try {
    const { id } = await params;
    const repository = getAuthorityRepository();
    const record = repository.getRecord(id);
    const actor = actorFromRequest(request, record);
    const body = await request.json() as Record<string, unknown>;
    const result = repository.execute(id, commandFromBody(body, actor));
    return Response.json({ data: publicResult(result) }, { status: result.replayed ? 200 : 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
