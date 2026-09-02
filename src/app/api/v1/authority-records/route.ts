import { errorResponse, integrationFromRequest } from "@/lib/authority/http";
import { getAuthorityRepository } from "@/lib/authority/repository";
import type { SandboxScenario } from "@/lib/authority/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    integrationFromRequest(request);
    return Response.json(
      { data: getAuthorityRepository().listRecords() },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    integrationFromRequest(request);
    const body = await request.json() as { sandboxScenario?: SandboxScenario };
    const record = getAuthorityRepository().createScenario(body.sandboxScenario ?? "standard");
    return Response.json(
      {
        data: {
          authorityRecordId: record.id,
          status: record.status,
          version: record.version,
          policyVersionId: record.policy.id,
          workspacePath: `/workspace/${record.id}`,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
