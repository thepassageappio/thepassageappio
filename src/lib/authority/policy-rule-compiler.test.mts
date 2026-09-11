import assert from "node:assert/strict";
import test from "node:test";
import { compilePolicyRules, PolicyRuleValidationError } from "./policy-rule-compiler.ts";
import { capturePolicySnapshot } from "./policy-snapshot.ts";

const org = "11111111-1111-4111-8111-111111111111";
function catalog() {
  return {
    actions: [
      { key: "statements", label: "Statement copies", meaning: "Receive copies of statements", category: "information", accountTypes: ["checking", "savings"], riskTier: "low", reviewGuidance: "Check the account and requested documents.", enabled: true, unavailableReason: null, source: "platform" },
      { key: "restricted_fixture", label: "Restricted test action", meaning: "A test restriction, not a legal rule", category: "test", accountTypes: ["checking"], riskTier: "high", reviewGuidance: "Unavailable in this fixture.", enabled: false, unavailableReason: "Test package restriction", source: "jurisdiction" },
    ],
    evidence: [
      { key: "identity", label: "Identity evidence", purpose: "Identify the representative", collectionMethod: "upload", retentionClass: "fixture-retention", reviewerRole: "reviewer", required: true, lockedRequired: true, source: "jurisdiction" },
      { key: "optional_note", label: "Extra note", purpose: "Explain the request", collectionMethod: "attestation", retentionClass: "fixture-retention", reviewerRole: "reviewer", required: false, lockedRequired: false, source: "platform" },
    ],
  };
}
function draft() { return { actionOverrides: [] as unknown[], evidenceOverrides: [] as unknown[], customActions: [] as unknown[], customEvidence: [] as unknown[] }; }
function customAction() { return { key: `institution:${org}:extra_record`, label: "Extra record", meaning: "Ask for an extra sample record", category: "information", accountTypes: ["checking"], riskTier: "low", reviewGuidance: "Review the request." }; }
function customEvidence() { return { key: `institution:${org}:supporting_note`, label: "Supporting note", purpose: "Explain the missing information", collectionMethod: "upload", retentionClass: "fixture-retention", reviewerRole: "reviewer", required: true }; }

test("standard action meaning survives an allowed label change and deactivation", () => {
  const change = draft(); change.actionOverrides = [{ key: "statements", label: "Get statement copies", enabled: false }];
  const result = compilePolicyRules(org, catalog(), change), action = result.actions.find(item => item.key === "statements")!;
  assert.equal(action.meaning, catalog().actions[0].meaning); assert.equal(action.label, "Get statement copies");
  assert.equal(action.enabled, false); assert.equal(action.source, "platform");
  assert.equal(action.labelSource, "institution"); assert.equal(action.availabilitySource, "institution");
  assert.equal(result.stage, "action-evidence-only");
});

test("a restricted action cannot be enabled by an institution override", () => {
  const change = draft(); change.actionOverrides = [{ key: "restricted_fixture", enabled: true }];
  assert.throws(() => compilePolicyRules(org, catalog(), change), /unavailable under the selected rules/);
});

test("locked evidence cannot be removed; an optional requirement can be made mandatory", () => {
  const change = draft(); change.evidenceOverrides = [{ key: "identity", required: false }];
  assert.throws(() => compilePolicyRules(org, catalog(), change), /cannot be removed/);
  change.evidenceOverrides = [{ key: "optional_note", required: true }];
  const rule = compilePolicyRules(org, catalog(), change).evidence.find(item => item.key === "optional_note")!;
  assert.equal(rule.required, true); assert.equal(rule.requirementSource, "institution");
});

test("custom rules carry organization-owned codes and complete collection metadata", () => {
  const change = draft(); change.customActions = [customAction()]; change.customEvidence = [customEvidence()];
  const result = compilePolicyRules(org, catalog(), change);
  const action = result.actions.find(item => item.key === customAction().key)!;
  const evidence = result.evidence.find(item => item.key === customEvidence().key)!;
  assert.equal(action.source, "institution"); assert.equal(evidence.source, "institution");
  assert.equal(evidence.retentionClass, "fixture-retention"); assert.equal(evidence.reviewerRole, "reviewer");
});

test("custom rules cannot use standard keys or another organization's namespace", () => {
  for (const key of ["statements", "institution:22222222-2222-4222-8222-222222222222:extra_record", `institution:${org}:__proto__`]) {
    const change = draft(); change.customActions = [{ ...customAction(), key }];
    assert.throws(() => compilePolicyRules(org, catalog(), change), /belongs to this organization/);
  }
});

test("editing standard meanings, sources, roles and other undeclared fields fails closed", () => {
  for (const extra of [{ meaning: "Move money" }, { source: "institution" }, { unavailableReason: null }, { keyOverride: "different" }]) {
    const change = draft(); change.actionOverrides = [{ key: "statements", ...extra }];
    assert.throws(() => compilePolicyRules(org, catalog(), change), /cannot be edited/);
  }
  const change = draft(); change.evidenceOverrides = [{ key: "identity", lockedRequired: false }];
  assert.throws(() => compilePolicyRules(org, catalog(), change), /cannot be edited/);
});

test("unknown channels or controls cannot be silently ignored by this partial compiler", () => {
  assert.throws(() => compilePolicyRules(org, catalog(), { ...draft(), channels: [] }), /cannot be edited/);
  assert.throws(() => compilePolicyRules(org, { ...catalog(), controls: {} }, draft()), /cannot be edited/);
});

test("missing purpose, retention, collection method or qualified reviewer rejects custom evidence", () => {
  for (const field of ["purpose", "retentionClass", "collectionMethod", "reviewerRole"]) {
    const value: Record<string, unknown> = customEvidence(); delete value[field];
    const change = draft(); change.customEvidence = [value];
    assert.throws(() => compilePolicyRules(org, catalog(), change), /required fields/);
  }
  const change = draft(); change.customEvidence = [{ ...customEvidence(), reviewerRole: "auditor" }];
  assert.throws(() => compilePolicyRules(org, catalog(), change), /available options/);
});

test("duplicate and unknown overrides are rejected instead of last-write-wins", () => {
  const change = draft(); change.actionOverrides = [{ key: "statements", enabled: true }, { key: "statements", enabled: false }];
  assert.throws(() => compilePolicyRules(org, catalog(), change), /only once/);
  change.actionOverrides = [{ key: "not_in_catalog", enabled: true }];
  assert.throws(() => compilePolicyRules(org, catalog(), change), /not in the selected catalog/);
  change.actionOverrides = []; change.customActions = [customAction(), customAction()];
  assert.throws(() => compilePolicyRules(org, catalog(), change), /only once/);
});

test("catalog contradictions fail before any draft is compiled", () => {
  const input = catalog(); input.actions[1].enabled = true;
  assert.throws(() => compilePolicyRules(org, input, draft()), /unavailable action/);
  const input2 = catalog(); input2.evidence[0].required = false;
  assert.throws(() => compilePolicyRules(org, input2, draft()), /locked requirement/);
});

test("invalid boolean values, hidden text and unsafe object access fail without running getters", () => {
  const change = draft(); change.actionOverrides = [{ key: "statements", enabled: "false" }];
  assert.throws(() => compilePolicyRules(org, catalog(), change), /yes or no/);
  change.actionOverrides = [{ key: "statements", label: "hidden\u0000text" }];
  assert.throws(() => compilePolicyRules(org, catalog(), change), /hidden characters/);
  const unsafe = Object.defineProperty({}, "actions", { enumerable: true, get() { throw Error("getter executed"); } });
  assert.throws(() => compilePolicyRules(org, unsafe, draft()), /could not read/);
});

test("compilation detaches inputs, normalizes rule order and produces stable snapshot content", () => {
  const input = catalog(), oldJson = JSON.stringify(input), change = draft();
  const first = compilePolicyRules(org, input, change);
  const reordered = catalog(); reordered.actions.reverse(); reordered.evidence.reverse(); reordered.actions[1].accountTypes.reverse();
  assert.deepEqual(first, compilePolicyRules(org, reordered, change));
  first.actions[0].accountTypes.push("changed-output"); assert.equal(JSON.stringify(input), oldJson);
  const content = compilePolicyRules(org, input, change);
  const body = { format: "passage-policy-snapshot-v1" as const, organizationId: org, policyVersion: "fixture-1", effectiveFrom: "2026-09-11T00:00:00.000Z", sources: { platform: { key: "test", version: "1" }, jurisdiction: { key: "test-only", version: "1" }, institution: { key: "test", version: "1" } }, content };
  assert.equal(capturePolicySnapshot(body).sha256, capturePolicySnapshot({ ...body, content: compilePolicyRules(org, reordered, change) }).sha256);
});

test("validation errors identify the field with a plain explanation", () => {
  const change = draft(); change.actionOverrides = [{ key: "statements", enabled: "yes" }];
  assert.throws(() => compilePolicyRules(org, catalog(), change), (error: unknown) => error instanceof PolicyRuleValidationError && error.path === "/draft/actionOverrides/0/enabled" && error.message === "Choose yes or no.");
});
