import { NextResponse } from "next/server";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { AUTHORITY_EVIDENCE_BUCKET } from "@/lib/authority/evidence";
import { createAuthorityAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getAuthorityAccessContext();
  if (!access?.membership || !access.organization) return NextResponse.json({ code: "not_found" }, { status: 404 });
  const { id } = await params;
  const admin = createAuthorityAdminClient();
  const { data, error } = await admin.rpc("authorize_evidence_view_v1", {
    p_organization_id: access.membership.organizationId,
    p_artifact_id: id,
    p_actor_user_id: access.user.id,
  });
  const source = data as { storage_bucket?: string; storage_path?: string; original_filename?: string } | null;
  if (error || !source?.storage_path || source.storage_bucket !== AUTHORITY_EVIDENCE_BUCKET) {
    return NextResponse.json({ code: "not_found" }, { status: 404 });
  }
  const { data: signed, error: signedError } = await admin.storage
    .from(AUTHORITY_EVIDENCE_BUCKET)
    .createSignedUrl(source.storage_path, 60, { download: source.original_filename ?? "evidence" });
  if (signedError || !signed?.signedUrl) return NextResponse.json({ code: "source_unavailable" }, { status: 503 });
  return NextResponse.redirect(signed.signedUrl, { status: 303 });
}
