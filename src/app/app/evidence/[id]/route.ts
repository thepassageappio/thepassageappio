import { NextResponse } from "next/server";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { AUTHORITY_EVIDENCE_BUCKET } from "@/lib/authority/evidence";
import { createAuthorityAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function contentDispositionAttachment(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7E]+/g, "_").replace(/["\\]/g, "_") || "evidence";
  const encoded = encodeURIComponent(filename).replace(/['()]/g, escape);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

/**
 * Authorized evidence open: ACL via authorize_evidence_view_v1, then same-origin
 * attachment body (not a 303 to Storage CDN). Preserves download-by-design and
 * avoids ERR_BLOCKED_BY_CLIENT from client blockers on signed storage hosts.
 * Does not weaken ACL.
 */
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
  const source = data as {
    storage_bucket?: string;
    storage_path?: string;
    original_filename?: string;
    media_type?: string;
  } | null;
  if (error || !source?.storage_path || source.storage_bucket !== AUTHORITY_EVIDENCE_BUCKET) {
    return NextResponse.json({ code: "not_found" }, { status: 404 });
  }

  const { data: blob, error: downloadError } = await admin.storage
    .from(AUTHORITY_EVIDENCE_BUCKET)
    .download(source.storage_path);
  if (downloadError || !blob) {
    return NextResponse.json({ code: "source_unavailable" }, { status: 503 });
  }

  const filename = source.original_filename?.trim() || "evidence";
  const mediaType = source.media_type?.trim() || blob.type || "application/octet-stream";
  const bytes = Buffer.from(await blob.arrayBuffer());
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": mediaType,
      "Content-Disposition": contentDispositionAttachment(filename),
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
