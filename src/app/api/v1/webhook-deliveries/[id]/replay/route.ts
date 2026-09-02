import { errorResponse, integrationFromRequest } from "@/lib/authority/http";
import { getAuthorityRepository } from "@/lib/authority/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    integrationFromRequest(request);
    const { id } = await params;
    const delivery = getAuthorityRepository().replayWebhook(id);
    return Response.json({ data: delivery });
  } catch (error) {
    return errorResponse(error);
  }
}
