import assert from "node:assert/strict";
import test from "node:test";
import { capturePolicySnapshot, readPolicySnapshot, readStoredPolicyEnvelope, type StoredPolicySnapshot } from "./policy-snapshot.ts";
import { capturePolicySource, readPolicySource } from "./policy-source-resolution.ts";

const org = "11111111-1111-4111-8111-111111111111";
const at = "2026-09-11T00:00:00.000Z";
const snapshot = capturePolicySnapshot({ format: "passage-policy-snapshot-v1", organizationId: org,
  policyVersion: "fixture-v1", effectiveFrom: at,
  sources: { platform: { key: "base", version: "1" }, jurisdiction: { key: "NY", version: "1" }, institution: { key: "fixture", version: "1" } },
  content: { label: "Fictional rules" } });
const source = capturePolicySource({ format: "passage-policy-source-v1", kind: "platform", key: "base", version: "1",
  organizationId: null, jurisdiction: "NY", authorityType: "fixture", publishedAt: at, effectiveFrom: at,
  dependencies: {}, content: { label: "Fictional rules" } });

for (const [name, saved, read] of [
  ["snapshot", snapshot, readPolicySnapshot], ["source", source, readPolicySource],
] as const) {
  test(`${name}: getters are rejected before being invoked`, () => {
    for (const field of ["canonicalJson", "sha256"]) {
      let calls = 0;
      const input = { ...saved };
      Object.defineProperty(input, field, { enumerable: true, get() { calls++; return saved[field as keyof typeof saved]; } });
      assert.throws(() => read(input));
      assert.equal(calls, 0);
    }
  });
  test(`${name}: inherited, hidden, symbol and extra fields are rejected`, () => {
    const hidden = { ...saved };
    Object.defineProperty(hidden, "sha256", { enumerable: false });
    for (const input of [Object.create(saved), Object.assign(new Date(), saved), hidden,
      { ...saved, approved: true }, { ...saved, [Symbol("approval")]: true }, [saved], null]) {
      assert.throws(() => read(input as StoredPolicySnapshot));
    }
  });
  test(`${name}: ordinary, frozen and null-prototype envelopes preserve exact saved meaning`, () => {
    const expected = read(saved);
    assert.deepEqual(read(Object.freeze({ ...saved })), expected);
    assert.deepEqual(read(Object.assign(Object.create(null), saved)), expected);
    assert.deepEqual(read(JSON.parse(JSON.stringify(saved))), expected);
  });
}

test("envelope limits count stored UTF-8 bytes without re-encoding the JSON string", () => {
  const saved = { canonicalJson: '"'.repeat(1_000_000), sha256: "a".repeat(64) };
  assert.deepEqual(readStoredPolicyEnvelope(saved), saved);
  assert.throws(() => readStoredPolicyEnvelope({ ...saved, canonicalJson: '"'.repeat(1_000_001) }));
  assert.throws(() => readStoredPolicyEnvelope({ ...saved, canonicalJson: "é".repeat(500_001) }));
  assert.throws(() => readStoredPolicyEnvelope({ ...saved, sha256: "A".repeat(64) }));
  // Passing the envelope guard does not bypass canonical content or hash validation.
  assert.throws(() => readPolicySnapshot(saved));
});

test("envelope result is detached from the caller's mutable wrapper", () => {
  const input = { ...snapshot }, result = readStoredPolicyEnvelope(input);
  input.canonicalJson = "changed";
  assert.equal(result.canonicalJson, snapshot.canonicalJson);
});
