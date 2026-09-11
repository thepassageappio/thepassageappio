import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { canonicalPolicyJson, capturePolicySnapshot, comparePolicySnapshots, readPolicySnapshot, type PolicySnapshotBody } from "./policy-snapshot.ts";

function policy(): PolicySnapshotBody {
  return {
    format: "passage-policy-snapshot-v1",
    organizationId: "11111111-1111-4111-8111-111111111111",
    policyVersion: "fixture-1",
    effectiveFrom: "2026-09-11T00:00:00.000Z",
    sources: {
      platform: { key: "test-catalog", version: "1" },
      jurisdiction: { key: "test-only-not-legal-guidance", version: "1" },
      institution: { key: "test-rules", version: "1" },
    },
    content: {
      actions: { statements: { enabled: true, label: "Receive statement copies", source: "platform" } },
      evidence: { identity: { required: true, source: "institution" } },
      channels: ["phone", "branch"], controls: {},
    },
  };
}

test("policy encoding has fixed bytes and an independently computed SHA-256", () => {
  assert.equal(canonicalPolicyJson({ z: [true, null, "é"], a: { "10": 10, "2": 2 } }), '{"a":{"10":10,"2":2},"z":[true,null,"é"]}');
  const snapshot = capturePolicySnapshot(policy());
  assert.equal(snapshot.sha256, createHash("sha256").update(Buffer.from(snapshot.canonicalJson, "utf8")).digest("hex"));
  assert.deepEqual(readPolicySnapshot(snapshot), policy());
});

test("key insertion order does not change policy identity; array order does", () => {
  const original = policy();
  const reordered = Object.fromEntries(Object.entries(original).reverse()) as PolicySnapshotBody;
  assert.deepEqual(capturePolicySnapshot(original), capturePolicySnapshot(reordered));
  reordered.content = { ...original.content, channels: ["branch", "phone"] };
  assert.notEqual(capturePolicySnapshot(original).sha256, capturePolicySnapshot(reordered).sha256);
});

test("captured policy and prior comparison data survive caller mutations", () => {
  const original = policy(), snapshot = capturePolicySnapshot(original), savedBytes = snapshot.canonicalJson;
  original.content.actions = {};
  const read = readPolicySnapshot(snapshot); read.content.actions = {};
  assert.equal(snapshot.canonicalJson, savedBytes);
  assert.deepEqual(readPolicySnapshot(snapshot).content.actions, policy().content.actions);
});

test("saved labels, version sources and effective time all affect snapshot identity", () => {
  const original = capturePolicySnapshot(policy());
  for (const alter of [
    (value: PolicySnapshotBody) => { value.content.actions = { statements: { enabled: true, label: "New label", source: "platform" } }; },
    (value: PolicySnapshotBody) => { value.sources.jurisdiction.version = "2"; },
    (value: PolicySnapshotBody) => { value.policyVersion = "fixture-2"; },
    (value: PolicySnapshotBody) => { value.effectiveFrom = "2026-09-12T00:00:00.000Z"; },
  ]) {
    const changed = policy(); alter(changed);
    assert.notEqual(capturePolicySnapshot(changed).sha256, original.sha256);
  }
});

test("tampered, noncanonical and duplicate-key saved payloads fail closed", () => {
  const snapshot = capturePolicySnapshot(policy());
  assert.throws(() => readPolicySnapshot({ ...snapshot, canonicalJson: snapshot.canonicalJson.replace('fixture-1', 'fixture-2') }), /hash_mismatch/);
  for (const canonicalJson of [JSON.stringify(policy(), null, 2), snapshot.canonicalJson.replace('{', '{"format":"ignored",')]) {
    const sha256 = createHash('sha256').update(canonicalJson).digest('hex');
    assert.throws(() => readPolicySnapshot({ canonicalJson, sha256 }), /snapshot_invalid/);
  }
});

test("legacy version references cannot masquerade as captured policies", () => {
  for (const value of [{ template_key: "ny_financial_poa", template_version: "2026.1" }, { ...policy(), content: {} }, { ...policy(), sources: {} }, { ...policy(), unexpected: true }]) {
    assert.throws(() => capturePolicySnapshot(value as PolicySnapshotBody), /snapshot_invalid/);
  }
});

test("invalid and ambiguous effective dates fail closed", () => {
  for (const effectiveFrom of ['2026-09-11', '2026-02-30T00:00:00.000Z', '2026-09-11T00:00:00-04:00', 'not a date']) {
    assert.throws(() => capturePolicySnapshot({ ...policy(), effectiveFrom }), /snapshot_invalid/);
  }
});

test("unsupported JSON values are rejected instead of silently omitted or changed", () => {
  const circular: Record<string, unknown> = {}; circular.self = circular;
  const getter = Object.defineProperty({}, 'rule', { enumerable: true, get() { throw Error('must not execute getter'); } });
  const sparse = Array(2); sparse[1] = true;
  const extended = Object.assign([true], { hidden: true });
  for (const value of [undefined, NaN, Infinity, -0, BigInt(1), () => true, Symbol('rule'), new Date(), circular, getter, sparse, extended, { a: undefined }, { [Symbol('rule')]: true }, '\ud800']) {
    assert.throws(() => canonicalPolicyJson(value), /snapshot_invalid/);
  }
});

test("excessive size and depth fail without persisting partial content", () => {
  assert.throws(() => canonicalPolicyJson('a'.repeat(1_000_001)), /snapshot_invalid/);
  let nested: unknown = true;
  for (let index = 0; index < 66; index++) nested = [nested];
  assert.throws(() => canonicalPolicyJson(nested), /snapshot_invalid/);
});

test("exact diff distinguishes missing values from null and escapes rule paths", () => {
  const before = policy(), after = policy();
  before.content = { 'a/b~c': { old: true, nullable: null }, list: ['branch', 'phone'] };
  after.content = { 'a/b~c': { new: null, nullable: false }, list: ['phone', 'branch'] };
  const savedBefore = capturePolicySnapshot(before), savedAfter = capturePolicySnapshot(after);
  assert.deepEqual(comparePolicySnapshots(savedBefore, savedAfter), [
    { path: '/content/a~1b~0c/new', kind: 'added', after: null },
    { path: '/content/a~1b~0c/nullable', kind: 'changed', before: null, after: false },
    { path: '/content/a~1b~0c/old', kind: 'removed', before: true },
    { path: '/content/list', kind: 'changed', before: ['branch', 'phone'], after: ['phone', 'branch'] },
  ]);
  assert.deepEqual(comparePolicySnapshots(savedBefore, savedBefore), []);
  assert.deepEqual(readPolicySnapshot(savedBefore), before);
});

test("comparison rejects another organization and verifies both saved hashes first", () => {
  const original = capturePolicySnapshot(policy());
  const foreign = capturePolicySnapshot({ ...policy(), organizationId: '22222222-2222-4222-8222-222222222222' });
  assert.throws(() => comparePolicySnapshots(original, foreign), /organization_mismatch/);
  assert.throws(() => comparePolicySnapshots(original, { ...original, sha256: '0'.repeat(64) }), /hash_mismatch/);
});
