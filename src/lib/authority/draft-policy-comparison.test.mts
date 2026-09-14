import assert from "node:assert/strict";
import test from "node:test";
import { compareDraftPolicy } from "./draft-policy-comparison.ts";
import { capturePolicySnapshot, type PolicySnapshotBody } from "./policy-snapshot.ts";

const org = "11111111-1111-4111-8111-111111111111";
const at = "2026-09-11T12:00:00.000Z";
function policy(edits: Partial<PolicySnapshotBody> = {}) {
  return capturePolicySnapshot({ format: "passage-policy-snapshot-v1", organizationId: org, policyVersion: "v1",
    effectiveFrom: "2026-09-10T00:00:00.000Z",
    sources: { platform: { key: "base", version: "1" }, jurisdiction: { key: "NY", version: "1" }, institution: { key: "fixture", version: "1" } },
    content: { label: "Fictional rules", required: true }, ...edits });
}
test("identical saved content needs no change but does not authorize activation", () => {
  const saved = policy(), result = compareDraftPolicy(org, at, saved, { ...saved });
  assert.equal(result.status, "current");
  assert.equal(result.stage, "draft-comparison-only");
  assert.deepEqual(result.changes, []);
  assert.equal(result.savedHash, result.currentHash);
});
test("a newer publication requires review with exact changes at its effective instant", () => {
  const saved = policy(), current = policy({ policyVersion: "v2", effectiveFrom: at, content: { label: "Revised fictional rules", required: true } });
  const before = JSON.stringify([saved, current]), result = compareDraftPolicy(org, at, saved, current);
  assert.equal(result.status, "review-required");
  assert.deepEqual(result.changes.find(change => change.path === "/content/label"), {
    path: "/content/label", kind: "changed", before: "Fictional rules", after: "Revised fictional rules",
  });
  assert.notEqual(result.savedHash, result.currentHash);
  result.changes.length = 0;
  assert.equal(JSON.stringify([saved, current]), before);
  assert.ok(compareDraftPolicy(org, at, saved, current).changes.length > 0);
});
test("equal version names cannot hide different rules", () => {
  const result = compareDraftPolicy(org, at, policy(), policy({ content: { required: false } }));
  assert.equal(result.status, "review-required");
  assert.ok(result.changes.some(change => change.path === "/content/required"));
});
test("both saved and proposed rules must belong to the authenticated institution", () => {
  const foreign = policy({ organizationId: "22222222-2222-4222-8222-222222222222" });
  for (const pair of [[foreign, policy()], [policy(), foreign], [foreign, foreign]]) {
    assert.throws(() => compareDraftPolicy(org, at, pair[0], pair[1]), /organization_mismatch/);
  }
});
test("future and older replacement publications fail rather than offer rebase", () => {
  const future = policy({ effectiveFrom: "2026-09-11T12:00:00.001Z" });
  for (const pair of [[policy(), future], [future, future]]) {
    assert.throws(() => compareDraftPolicy(org, at, pair[0], pair[1]), /not_effective/);
  }
  assert.throws(() => compareDraftPolicy(org, at, policy({ effectiveFrom: at }), policy()), /went_backwards/);
});
test("malformed context and tampered bytes fail before returning a comparison", () => {
  for (const value of ["2026-09-11", "2026-02-30T00:00:00.000Z", "2026-09-11T12:00:00Z"]) {
    assert.throws(() => compareDraftPolicy(org, value, policy(), policy()), /invalid_time/);
  }
  assert.throws(() => compareDraftPolicy("invalid", at, policy(), policy()), /invalid_organization/);
  const altered = { ...policy(), sha256: "0".repeat(64) };
  assert.throws(() => compareDraftPolicy(org, at, altered, policy()), /hash_mismatch/);
  assert.throws(() => compareDraftPolicy(org, at, policy(), altered), /hash_mismatch/);
});
