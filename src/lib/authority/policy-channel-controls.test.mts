import assert from "node:assert/strict";
import test from "node:test";
import { compilePolicyConfiguration } from "./policy-rule-compiler.ts";

const org = "11111111-1111-4111-8111-111111111111";
function catalog() {
  return {
    actions: [{ key: "sample_action", label: "Sample action", meaning: "Fictional test action", category: "test", accountTypes: ["test"], riskTier: "low", reviewGuidance: "Review the sample.", enabled: true, unavailableReason: null, source: "platform" }],
    evidence: [],
    channels: [{ key: "online", label: "Online", enabled: true, accessLevel: "transaction", separateIdentity: true, requiresMfa: true, requiresAcknowledgment: true, actionKeys: ["sample_action"], unavailableReason: null as string | null, source: "platform" }],
    controls: [
      { key: "amount", kind: "max_amount", value: 10000, currency: "USD" as string | null, windowHours: null as number | null, actionKeys: ["sample_action"], locked: false, source: "platform" },
      { key: "duration", kind: "max_duration_days", value: 30, currency: null as string | null, windowHours: null as number | null, actionKeys: ["sample_action"], locked: false, source: "platform" },
      { key: "approval", kind: "min_approvers", value: 2, currency: null as string | null, windowHours: null as number | null, actionKeys: ["sample_action"], locked: false, source: "platform" },
      { key: "frequency", kind: "max_count", value: 10, currency: null as string | null, windowHours: 24 as number | null, actionKeys: ["sample_action"], locked: false, source: "platform" },
    ],
  };
}
function draft() { return { actionOverrides: [], evidenceOverrides: [], customActions: [], customEvidence: [], channelOverrides: [] as unknown[], controlOverrides: [] as unknown[] }; }

test("configuration preserves channel security and typed units without claiming applied access", () => {
  const result = compilePolicyConfiguration(org, catalog(), draft());
  assert.equal(result.stage, "configuration-only");
  assert.equal(result.channels[0].separateIdentity, true);
  assert.equal(result.channels[0].requiresAcknowledgment, true);
  assert.equal(result.controls.find(item => item.key === "amount")?.currency, "USD");
  assert.equal(result.controls.find(item => item.key === "frequency")?.windowHours, 24);
  assert.equal(Object.hasOwn(result.channels[0], "accessGranted"), false);
});

test("enabled digital channels require separate identity and institution acknowledgment", () => {
  for (const channel of ["online", "mobile", "api"]) {
    for (const missing of ["separateIdentity", "requiresAcknowledgment"] as const) {
      const input = catalog(); input.channels[0].key = channel; input.channels[0][missing] = false;
      assert.throws(() => compilePolicyConfiguration(org, input, draft()), /own sign-in|confirm when access/);
    }
  }
});

test("digital transaction access cannot omit MFA or remove a catalog security minimum", () => {
  const input = catalog(); input.channels[0].requiresMfa = false;
  assert.throws(() => compilePolicyConfiguration(org, input, draft()), /extra sign-in check/);
  const change = draft(); change.channelOverrides = [{ key: "online", requiresMfa: false }];
  assert.throws(() => compilePolicyConfiguration(org, catalog(), change), /cannot be removed/);
});

test("institution can strengthen MFA or disable an available channel", () => {
  const input = catalog(); input.channels[0].accessLevel = "view"; input.channels[0].requiresMfa = false;
  const change = draft(); change.channelOverrides = [{ key: "online", requiresMfa: true }];
  const strengthened = compilePolicyConfiguration(org, input, change).channels[0];
  assert.equal(strengthened.requiresMfa, true); assert.equal(strengthened.securitySource, "institution");
  change.channelOverrides = [{ key: "online", enabled: false }];
  assert.equal(compilePolicyConfiguration(org, input, change).channels[0].enabled, false);
});

test("restricted channels cannot be enabled or have their access level rewritten", () => {
  const input = catalog(); input.channels[0].enabled = false; input.channels[0].unavailableReason = "Fictional restriction";
  const change = draft(); change.channelOverrides = [{ key: "online", enabled: true }];
  assert.throws(() => compilePolicyConfiguration(org, input, change), /unavailable/);
  change.channelOverrides = [{ key: "online", accessLevel: "view" }];
  assert.throws(() => compilePolicyConfiguration(org, input, change), /cannot be edited/);
});

test("all supported limits allow stricter values and retain definition provenance", () => {
  const change = draft(); change.controlOverrides = [{ key: "amount", value: 5000 }, { key: "duration", value: 10 }, { key: "approval", value: 3 }, { key: "frequency", value: 5 }];
  const output = compilePolicyConfiguration(org, catalog(), change);
  for (const control of output.controls) {
    assert.equal(control.source, "platform"); assert.equal(control.valueSource, "institution");
  }
  assert.deepEqual(output.controls.map(item => item.value), [5000, 3, 10, 5]);
});

test("weaker, locked, fractional, zero and unsafe numeric limits are rejected", () => {
  for (const [key, value] of [["amount", 10001], ["duration", 31], ["approval", 1], ["frequency", 11], ["amount", 1.5], ["duration", 0], ["amount", Number.MAX_SAFE_INTEGER + 1]]) {
    const change = draft(); change.controlOverrides = [{ key, value }];
    assert.throws(() => compilePolicyConfiguration(org, catalog(), change), /weaken|positive whole/);
  }
  const input = catalog(); input.controls[0].locked = true;
  const change = draft(); change.controlOverrides = [{ key: "amount", value: 5000 }];
  assert.throws(() => compilePolicyConfiguration(org, input, change), /cannot be changed/);
});

test("a limit override cannot change currency, time window, scope or kind", () => {
  for (const extra of [{ currency: "EUR" }, { windowHours: 48 }, { actionKeys: [] }, { kind: "max_count" }]) {
    const change = draft(); change.controlOverrides = [{ key: "amount", value: 5000, ...extra }];
    assert.throws(() => compilePolicyConfiguration(org, catalog(), change), /cannot be edited/);
  }
});

test("catalog control units and minimum approval count are validated", () => {
  const invalidCatalogs = [catalog(), catalog(), catalog(), catalog()];
  invalidCatalogs[0].controls[0].currency = null;
  invalidCatalogs[1].controls[1].currency = "USD";
  invalidCatalogs[2].controls[2].value = 1;
  invalidCatalogs[3].controls[3].windowHours = null;
  for (const input of invalidCatalogs) assert.throws(() => compilePolicyConfiguration(org, input, draft()), /currency|two people|time window/);
});

test("unknown action references and duplicate or unknown channel/control overrides fail", () => {
  const input = catalog(); input.channels[0].actionKeys = ["missing"];
  assert.throws(() => compilePolicyConfiguration(org, input, draft()), /existing actions/);
  const change = draft(); change.channelOverrides = [{ key: "online" }, { key: "online" }];
  assert.throws(() => compilePolicyConfiguration(org, catalog(), change), /only once/);
  change.channelOverrides = [{ key: "new_channel" }];
  assert.throws(() => compilePolicyConfiguration(org, catalog(), change), /not in the selected catalog/);
  change.channelOverrides = []; change.controlOverrides = [{ key: "new_limit", value: 2 }];
  assert.throws(() => compilePolicyConfiguration(org, catalog(), change), /not in the selected catalog/);
});

test("catalog ordering and compilation cannot rewrite the caller's previous configuration", () => {
  const input = catalog(), original = JSON.stringify(input);
  const compiled = compilePolicyConfiguration(org, input, draft());
  const reordered = catalog(); reordered.controls.reverse();
  assert.deepEqual(compiled, compilePolicyConfiguration(org, reordered, draft()));
  compiled.controls[0].actionKeys.push("changed"); compiled.channels[0].enabled = false;
  assert.equal(JSON.stringify(input), original);
});
