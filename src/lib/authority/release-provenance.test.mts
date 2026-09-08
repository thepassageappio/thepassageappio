import assert from "node:assert/strict";
import test from "node:test";
import { validateProductionProvenance } from "./release-provenance.ts";

const sha = "9182c21000000000000000000000000000000000";
const valid = {
  environment: "production",
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
  assert.deepEqual(validateProductionProvenance({ ...valid, environment: "preview", commitRef: "feature" }), []);
});
