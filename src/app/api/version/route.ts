import { NextResponse } from "next/server";
import { readReleaseProvenance, validateProductionProvenance } from "@/lib/authority/release-provenance";

export const dynamic = "force-dynamic";

export function GET() {
  const provenance = readReleaseProvenance();
  const issues = validateProductionProvenance(provenance);
  return NextResponse.json(
    {
      service: "passage-authority",
      environment: provenance.environment,
      source: {
        provider: provenance.gitProvider,
        repository: provenance.repositoryOwner && provenance.repositorySlug
          ? `${provenance.repositoryOwner}/${provenance.repositorySlug}`
          : null,
        ref: provenance.commitRef,
        sha: provenance.commitSha,
      },
      provenance: issues.length === 0 ? "verified" : "invalid",
      issues,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
