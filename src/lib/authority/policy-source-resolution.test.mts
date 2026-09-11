import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { capturePolicySource, readPolicySource, resolvePolicySources, type PolicySourceVersion, type PolicySourceKind } from "./policy-source-resolution.ts";

const org = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const start = "2026-09-10T00:00:00.000Z", change = "2026-09-11T12:00:00.000Z";
const query = { organizationId: org, jurisdiction: "NY", authorityType: "poa", at: change,
  keys: { platform: "standard", jurisdiction: "ny-fixture", institution: "office" } };
function source(kind: PolicySourceKind, edits: Partial<PolicySourceVersion> = {}): PolicySourceVersion {
  return { format: "passage-policy-source-v1", kind, key: query.keys[kind], version: "v1", organizationId: kind === "institution" ? org : null,
    jurisdiction: "NY", authorityType: "poa", publishedAt: start, effectiveFrom: start, content: { fixture: "Sample rules only" }, ...edits };
}
function history() { return (["platform", "jurisdiction", "institution"] as const).map(kind => capturePolicySource(source(kind))); }

test("each source resolves with exact bytes and a detached result", () => {
  const rows = history(), before = JSON.stringify(rows), result = resolvePolicySources(rows, query);
  assert.equal(result.stage, "sources-only");
  assert.equal(result.institution.source.organizationId, org);
  assert.equal(result.platform.sha256, rows[0].sha256);
  result.platform.source.content.fixture = "Changed locally";
  assert.equal(JSON.stringify(rows), before);
  assert.equal(resolvePolicySources(rows, query).platform.source.content.fixture, "Sample rules only");
});
test("effective boundary selects by time, never version label or input order", () => {
  const rows = history(); rows.push(capturePolicySource(source("institution", { version: "a-new", effectiveFrom: change })));
  assert.equal(resolvePolicySources(rows, { ...query, at: "2026-09-11T11:59:59.999Z" }).institution.source.version, "v1");
  assert.equal(resolvePolicySources(rows.reverse(), query).institution.source.version, "a-new");
  assert.equal(readPolicySource(rows[1]).version, "v1");
});
test("future or absent sources fail closed without substituting a different package", () => {
  for (const selection of [{ ...query, at: "2026-09-09T23:59:59.999Z" }, { ...query, keys: { ...query.keys, jurisdiction: "different" } }]) {
    assert.throws(() => resolvePolicySources(history(), selection), /No .* rules are in effect/);
  }
  assert.throws(() => resolvePolicySources(history().slice(0, 2), query), /No institution/);
});
test("foreign organization, jurisdiction and authority type cannot supply the selected rules", () => {
  for (const edits of [{ organizationId: other }, { jurisdiction: "PA" }, { authorityType: "guardianship" }]) {
    const rows = history(); rows[2] = capturePolicySource(source("institution", edits));
    assert.throws(() => resolvePolicySources(rows, query), /No institution/);
  }
});
test("duplicate versions and effective-time conflicts fail even for future entries", () => {
  for (const edits of [{ version: "v1", effectiveFrom: change }, { version: "v2" }]) {
    const rows = history(); rows.push(capturePolicySource(source("institution", edits)));
    assert.throws(() => resolvePolicySources(rows, { ...query, at: start }), /conflicting versions/);
  }
});
test("tampering or noncanonical bytes cannot be resolved even with a recomputed hash", () => {
  const saved = history()[0];
  assert.throws(() => readPolicySource({ ...saved, canonicalJson: saved.canonicalJson.replace("Sample rules", "Changed rules") }), /hash/);
  const canonicalJson = JSON.stringify(JSON.parse(saved.canonicalJson), null, 2);
  assert.throws(() => readPolicySource({ canonicalJson, sha256: createHash("sha256").update(canonicalJson).digest("hex") }), /hash/);
});
test("source ownership, missing content and backdated publication are rejected", () => {
  for (const edits of [{ organizationId: org }, { content: {} }, { publishedAt: change }, { effectiveFrom: "2026-02-30T00:00:00.000Z" }]) {
    assert.throws(() => capturePolicySource(source("platform", edits)), /policy_source_invalid/);
  }
  assert.throws(() => capturePolicySource(source("institution", { organizationId: null })), /ownership/);
});
test("unknown fields and malformed selection dates cannot change resolution", () => {
  assert.throws(() => capturePolicySource({ ...source("platform"), approved: true } as PolicySourceVersion), /fields/);
  for (const at of ["2026-09-11", "2026-09-11T12:00:00Z", "+012026-09-11T12:00:00.000Z"]) {
    assert.throws(() => resolvePolicySources(history(), { ...query, at }), /UTC/);
  }
  assert.throws(() => resolvePolicySources(history(), { ...query, organizationId: "bad" }), /institution/);
});
