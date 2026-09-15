const PASSAGE_ENVIRONMENTS = new Set(["local", "preview", "demo", "production"]);

export type ReleaseProvenance = {
  /** Product/env label for /api/version and demo guards. Prefers PASSAGE_ENVIRONMENT, then PASSAGE_ENVIRONMENT_GROK. */
  environment: string | null;
  /** Vercel deploy class (VERCEL_ENV). Used for production provenance checks. */
  vercelEnvironment: string | null;
  gitProvider: string | null;
  repositoryOwner: string | null;
  repositorySlug: string | null;
  commitRef: string | null;
  commitSha: string | null;
};

function readValidatedPassageEnvironment(raw: string | undefined): string | null {
  const value = raw?.trim().toLowerCase() ?? "";
  return PASSAGE_ENVIRONMENTS.has(value) ? value : null;
}

function readPassageEnvironmentLabel(env: NodeJS.ProcessEnv): string | null {
  return (
    readValidatedPassageEnvironment(env.PASSAGE_ENVIRONMENT) ??
    readValidatedPassageEnvironment(env.PASSAGE_ENVIRONMENT_GROK) ??
    (env.VERCEL_ENV?.trim() || null)
  );
}

export function readReleaseProvenance(env: NodeJS.ProcessEnv = process.env): ReleaseProvenance {
  return {
    environment: readPassageEnvironmentLabel(env),
    vercelEnvironment: env.VERCEL_ENV?.trim() || null,
    gitProvider: env.VERCEL_GIT_PROVIDER?.trim() || null,
    repositoryOwner: env.VERCEL_GIT_REPO_OWNER?.trim() || null,
    repositorySlug: env.VERCEL_GIT_REPO_SLUG?.trim() || null,
    commitRef: env.VERCEL_GIT_COMMIT_REF?.trim() || null,
    commitSha: env.VERCEL_GIT_COMMIT_SHA?.trim().toLowerCase() || null,
  };
}

export function validateProductionProvenance(
  provenance: ReleaseProvenance,
  expectedSha?: string | null,
): string[] {
  // Gate on Vercel deploy class, not the Passage label — demo Production
  // deploys can report environment:"demo" while VERCEL_ENV is still production.
  if (provenance.vercelEnvironment !== "production") return [];
  const issues: string[] = [];
  if (provenance.gitProvider !== "github") issues.push("production_git_provider_not_github");
  if (provenance.repositoryOwner !== "thepassageappio" || provenance.repositorySlug !== "thepassageappio") {
    issues.push("production_repository_mismatch");
  }
  if (provenance.commitRef !== "main") issues.push("production_ref_not_main");
  if (!provenance.commitSha || !/^[0-9a-f]{40}$/.test(provenance.commitSha)) {
    issues.push("production_commit_sha_missing_or_invalid");
  }
  const normalizedExpected = expectedSha?.trim().toLowerCase();
  if (normalizedExpected && provenance.commitSha !== normalizedExpected) {
    issues.push("deployed_sha_does_not_match_expected_main");
  }
  return issues;
}
