import assert from "node:assert/strict";
import test from "node:test";
import { prepareHostedInstitutionDecision, prepareHostedLifecycleChange } from "./hosted-decisions.ts";

test("institution decision normalizes a limited acceptance", () => {
  assert.deepEqual(prepareHostedInstitutionDecision({
    outcome: "accepted_with_limits",
    reason: "  The submitted scope meets the institution policy. ",
    limitations: [" No transfers ", "No transfers", "Statements only"],
    acknowledged: true,
  }), {
    outcome: "accepted_with_limits",
    reason: "The submitted scope meets the institution policy.",
    limitations: ["No transfers", "Statements only"],
  });
});

test("institution decision requires an explicit confirmation", () => {
  assert.throws(() => prepareHostedInstitutionDecision({
    outcome: "accepted",
    reason: "Policy requirements are complete.",
    limitations: [],
    acknowledged: false,
  }), /Confirm that this is the institution's decision/);
});

test("limited acceptance requires at least one limit", () => {
  assert.throws(() => prepareHostedInstitutionDecision({
    outcome: "accepted_with_limits",
    reason: "Policy requirements are complete.",
    limitations: [],
    acknowledged: true,
  }), /at least one limit/);
});

test("unlimited outcomes reject hidden limitations", () => {
  assert.throws(() => prepareHostedInstitutionDecision({
    outcome: "accepted",
    reason: "Policy requirements are complete.",
    limitations: ["Statements only"],
    acknowledged: true,
  }), /only when the institution accepts with limits/);
});

test("expiration cannot be recorded before the request end date", () => {
  assert.throws(() => prepareHostedLifecycleChange({
    action: "expire",
    reason: "",
    acknowledged: true,
    currentStatus: "accepted",
    validUntil: "2026-09-30T23:59:59.000Z",
    now: new Date("2026-08-31T12:00:00.000Z"),
  }), /has not reached/);
});

test("revocation requires a reason and an accepted current decision", () => {
  assert.throws(() => prepareHostedLifecycleChange({
    action: "revoke",
    reason: "",
    acknowledged: true,
    currentStatus: "accepted_with_limits",
    validUntil: "2026-09-30T23:59:59.000Z",
  }), /revocation reason/);
  assert.throws(() => prepareHostedLifecycleChange({
    action: "revoke",
    reason: "Notice received from the principal.",
    acknowledged: true,
    currentStatus: "evidence_required",
    validUntil: "2026-09-30T23:59:59.000Z",
  }), /only after an accepted institution decision/);
});
