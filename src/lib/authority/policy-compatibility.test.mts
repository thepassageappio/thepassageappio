import assert from "node:assert/strict";
import test from "node:test";
import { compileCompatiblePolicyConfiguration } from "./policy-rule-compiler.ts";

const org = "11111111-1111-4111-8111-111111111111";
function fixture() {
  return {
    catalog: {
      actions: [{ key: "statements", label: "Statement copies", meaning: "Get sample copies", category: "information", accountTypes: ["sample"], riskTier: "low", reviewGuidance: "Review the sample.", enabled: true, unavailableReason: null, source: "platform" }],
      evidence: [{ key: "identity", label: "Identity evidence", purpose: "Identify the representative", collectionMethod: "upload", retentionClass: "sample", reviewerRole: "reviewer", required: true, lockedRequired: false, source: "platform" }],
      channels: [{ key: "phone", label: "Phone", enabled: true, accessLevel: "view", separateIdentity: true, requiresMfa: false, requiresAcknowledgment: true, actionKeys: ["statements"], unavailableReason: null, source: "platform" }],
      controls: [{ key: "duration", kind: "max_duration_days", value: 30, currency: null as string | null, windowHours: null, actionKeys: ["statements"], locked: false, source: "platform" }],
    },
    draft: { actionOverrides: [] as unknown[], evidenceOverrides: [] as unknown[], customActions: [] as unknown[], customEvidence: [], channelOverrides: [] as unknown[], controlOverrides: [] },
    contract: { accountTypes: ["sample"], retentionClasses: ["sample"], currencies: ["USD"], actions: [
      { key: "statements", requiredEvidenceKeys: ["identity"], allowedChannelAccess: ["phone:view"], allowedControlKinds: ["max_duration_days"] },
    ] },
  };
}
function compile(f = fixture()) { return compileCompatiblePolicyConfiguration(org, f.catalog, f.draft, f.contract); }
test("compatible operational references pass without claiming a publishable policy", () => {
  const f = fixture(), before = JSON.stringify(f), result = compile(f);
  assert.equal(result.stage, "configuration-only");
  assert.equal(result.compatibility, "operational-references-checked");
  result.actions[0].accountTypes.push("changed-locally");
  assert.equal(JSON.stringify(f), before);
});
test("an optional catalog requirement cannot be removed when an enabled action needs it", () => {
  const f = fixture(); f.draft.evidenceOverrides = [{ key: "identity", required: false }];
  assert.throws(() => compile(f), /Keep the evidence required/);
  f.draft.actionOverrides = [{ key: "statements", enabled: false }];
  assert.equal(compile(f).evidence[0].required, false);
});
test("unknown account, retention and currency references fail", () => {
  const f = fixture(); f.catalog.actions[0].accountTypes = ["unknown"];
  assert.throws(() => compile(f), /unsupported account/);
  const g = fixture(); g.catalog.evidence[0].retentionClass = "unknown";
  assert.throws(() => compile(g), /retention/);
  const h = fixture(); h.catalog.controls[0].kind = "max_amount"; h.catalog.controls[0].currency = "ZZZ";
  h.contract.actions[0].allowedControlKinds.push("max_amount");
  assert.throws(() => compile(h), /supported currency/);
});
test("a channel cannot imply a different access level, even while disabled", () => {
  const f = fixture(); f.catalog.channels[0].accessLevel = "transaction";
  assert.throws(() => compile(f), /channel and access level/);
  f.draft.channelOverrides = [{ key: "phone", enabled: false }];
  assert.throws(() => compile(f), /channel and access level/);
});
test("limits must be declared compatible with every covered action", () => {
  const f = fixture(); f.catalog.controls[0].kind = "max_amount"; f.catalog.controls[0].currency = "USD";
  assert.throws(() => compile(f), /kind of limit/);
  f.contract.actions[0].allowedControlKinds.push("max_amount");
  assert.equal(compile(f).controls[0].currency, "USD");
});
test("missing, unknown and duplicate action contracts fail closed", () => {
  const f = fixture(); f.contract.actions = [];
  assert.throws(() => compile(f), /missing its combination/);
  const g = fixture(); g.contract.actions[0].key = "unknown";
  assert.throws(() => compile(g), /unknown action/);
  const h = fixture(); h.contract.actions.push({ ...h.contract.actions[0] });
  assert.throws(() => compile(h), /only once/);
});
test("custom actions cannot bypass the missing governed semantic review path", () => {
  const f = fixture();
  f.draft.customActions = [{ key: `institution:${org}:new_action`, label: "Extra sample", meaning: "Get extra sample copies", category: "information", accountTypes: ["sample"], riskTier: "low", reviewGuidance: "Review the sample." }];
  assert.throws(() => compile(f), /Custom actions need a reviewed definition/);
});
test("malformed combination rules and nonexistent evidence fail", () => {
  for (const field of ["requiredEvidenceKeys", "allowedChannelAccess", "allowedControlKinds"] as const) {
    const f = fixture(); f.contract.actions[0][field] = ["unknown"];
    assert.throws(() => compile(f));
  }
  const f = fixture(); f.contract.accountTypes.push("sample");
  assert.throws(() => compile(f), /only once/);
  assert.throws(() => compileCompatiblePolicyConfiguration(org, f.catalog, f.draft, { ...fixture().contract, bypass: true }), /field that cannot be edited/);
});
