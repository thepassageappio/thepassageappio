import assert from "node:assert/strict";
import test from "node:test";
import { readReleaseProvenance, validateProductionProvenance } from "./release-provenance.ts";

const sha = "9182c21000000000000000000000000000000000";
const valid = {
  environment: "production",
  vercelEnvironment: "production",
  gitProvider: "github",
  repositoryOwner: "thepassageappio",
  repositorySlug: "thepassageappio",
  commitRef: "main",
  commitSha: sha,
};

test("accepts a production deployment from the expected main commit", () => {
  assert.deepEqual(validateProductionProvenance(valid, sha), []);
});

test("rejects a branch deployment and a different expected main commit", () => {
  const issues = validateProductionProvenance({ ...valid, commitRef: "agent/work", commitSha: "a".repeat(40) }, sha);
  assert.ok(issues.includes("production_ref_not_main"));
  assert.ok(issues.includes("deployed_sha_does_not_match_expected_main"));
});

test("rejects manual production deployment metadata with no Git provenance", () => {
  const issues = validateProductionProvenance({
    environment: "production",
    vercelEnvironment: "production",
    gitProvider: null,
    repositoryOwner: null,
    repositorySlug: null,
    commitRef: null,
    commitSha: null,
  });
  assert.ok(issues.includes("production_git_provider_not_github"));
  assert.ok(issues.includes("production_repository_mismatch"));
  assert.ok(issues.includes("production_ref_not_main"));
  assert.ok(issues.includes("production_commit_sha_missing_or_invalid"));
});

test("does not apply the production gate to preview or local builds", () => {
  assert.deepEqual(
    validateProductionProvenance({ ...valid, environment: "preview", vercelEnvironment: "preview", commitRef: "feature" }),
    [],
  );
});

test("PASSAGE_ENVIRONMENT demo wins over VERCEL_ENV production for the label", () => {
  const provenance = readReleaseProvenance({
    PASSAGE_ENVIRONMENT: "demo",
    VERCEL_ENV: "production",
    VERCEL_GIT_PROVIDER: "github",
    VERCEL_GIT_REPO_OWNER: "thepassageappio",
    VERCEL_GIT_REPO_SLUG: "thepassageappio",
    VERCEL_GIT_COMMIT_REF: "main",
    VERCEL_GIT_COMMIT_SHA: sha,
  });
  assert.equal(provenance.environment, "demo");
  assert.equal(provenance.vercelEnvironment, "production");
  // Provenance checks still run for Vercel production deploys.
  assert.deepEqual(validateProductionProvenance(provenance, sha), []);
});

test("falls back to VERCEL_ENV when PASSAGE_ENVIRONMENT is unset or invalid", () => {
  assert.equal(readReleaseProvenance({ VERCEL_ENV: "preview" }).environment, "preview");
  assert.equal(readReleaseProvenance({ PASSAGE_ENVIRONMENT: "staging", VERCEL_ENV: "production" }).environment, "production");
});
