import assert from "node:assert/strict";
import test from "node:test";
import { applyAuthorityCommand } from "./domain.ts";
import { AuthorityError } from "./errors.ts";
import { createSandboxFixture, createScenarioFixture } from "./fixture.ts";
import type { ActorRole, AuthorityCommand, AuthorityRecord } from "./types.ts";

type TestCommand = AuthorityCommand extends infer Command
  ? Command extends AuthorityCommand
    ? Omit<Command, "expectedVersion" | "idempotencyKey">
    : never
  : never;

function actorsFor(record: AuthorityRecord) {
  return {
    principal: { actorId: record.principal.id, actorRole: "principal" as const },
    representative: { actorId: record.representative.id, actorRole: "representative" as const },
    reviewer: { actorId: record.reviewer.id, actorRole: "reviewer" as const },
  };
}

function run(record: AuthorityRecord, command: TestCommand) {
  return applyAuthorityCommand(
    record,
    {
      ...command,
      expectedVersion: record.version,
      idempotencyKey: `idem_${record.version}_${command.type}`,
    } as AuthorityCommand,
    {
      now: `2026-08-23T16:${String(record.version).padStart(2, "0")}:00.000Z`,
      eventId: `evt_${record.version + 1}`,
      sequence: record.version + 1,
    },
  );
}

function advanceToReview(initial = createSandboxFixture().record) {
  let record = initial;
  const actors = actorsFor(record);
  record = run(record, { type: "confirm_grant", ...actors.principal, acknowledged: true }).record;
  record = run(record, { type: "accept_responsibility", ...actors.representative, acknowledged: true }).record;
  for (const requirementKey of [
    "power_of_attorney_document",
    "agent_certification",
    "representative_identity",
    "current_address",
  ]) {
    record = run(record, { type: "complete_requirement", ...actors.representative, requirementKey }).record;
  }
  return run(record, { type: "submit_record", ...actors.representative, consented: true }).record;
}

test("happy path crosses all three personas and preserves policy, consent, disclosure, and limits", () => {
  let record = advanceToReview();
  const actors = actorsFor(record);
  assert.equal(record.status, "under_review");
  assert.equal(record.requirements.every((requirement) => requirement.status === "complete"), true);
  assert.equal(record.consentSnapshots.length, 2);
  assert.equal(record.disclosures.length, 1);
  assert.equal(record.evidenceArtifacts.length, 6);
  const document = record.evidenceArtifacts.find(
    (artifact) => artifact.requirementKey === "power_of_attorney_document",
  );
  assert.ok(document);
  assert.equal(document.result, "review_required");
  assert.equal(document.findings?.some((finding) => finding.sourceLocator === "Page 2"), true);

  record = run(record, {
    type: "request_information",
    ...actors.reviewer,
    requirementKey: "current_address",
    message: "Confirm the address evidence is dated within the last 90 days.",
  }).record;
  assert.equal(record.status, "information_requested");
  assert.equal(record.informationRequest?.requirementKey, "current_address");

  record = run(record, {
    type: "resolve_information",
    ...actors.representative,
    response: "The synthetic statement date is within the required 90-day period.",
  }).record;

  record = run(record, {
    type: "record_decision",
    ...actors.reviewer,
    outcome: "accepted_with_limits",
    reason: "All policy requirements and their sources are visible.",
    limitations: ["No money movement", "Expires September 1, 2027"],
    acknowledged: true,
  }).record;

  assert.equal(record.status, "accepted_with_limits");
  assert.equal(record.decision?.policyVersionId, record.policy.id);
  assert.deepEqual(record.decision?.acceptedActionKeys, record.allowedActions.map((action) => action.key));

  record = run(record, {
    type: "revoke_authority",
    ...actors.principal,
    reason: "The principal no longer wants this limited access.",
    acknowledged: true,
  }).record;
  assert.equal(record.status, "revoked");
  assert.equal(record.authoritySource.status, "ended");
  assert.equal(record.version, 12);
});

test("a representative cannot skip the principal or evidence steps", () => {
  const record = createSandboxFixture().record;
  const actors = actorsFor(record);
  assert.throws(
    () => run(record, { type: "submit_record", ...actors.representative, consented: true }),
    (error) => error instanceof AuthorityError && error.code === "INVALID_TRANSITION",
  );
});

test("a valid actor cannot run another persona's command", () => {
  const record = advanceToReview();
  const actors = actorsFor(record);
  assert.throws(
    () =>
      run(record, {
        type: "record_decision",
        actorId: actors.representative.actorId,
        actorRole: actors.representative.actorRole as ActorRole,
        outcome: "accepted",
        reason: "Attempted self-approval",
        limitations: [],
        acknowledged: true,
      }),
    (error) => error instanceof AuthorityError && error.code === "UNAUTHORIZED_ACTOR",
  );
});

test("stale versions are rejected before a mutation", () => {
  const record = createSandboxFixture().record;
  const actors = actorsFor(record);
  assert.throws(
    () =>
      applyAuthorityCommand(
        record,
        {
          type: "confirm_grant",
          ...actors.principal,
          acknowledged: true,
          expectedVersion: 99,
          idempotencyKey: "stale",
        },
        { now: record.updatedAt, eventId: "evt_stale", sequence: 2 },
      ),
    (error) => error instanceof AuthorityError && error.code === "STALE_VERSION",
  );
});

test("limited acceptance requires an explicit limitation", () => {
  const record = advanceToReview();
  const actors = actorsFor(record);
  assert.throws(
    () =>
      run(record, {
        type: "record_decision",
        ...actors.reviewer,
        outcome: "accepted_with_limits",
        reason: "Evidence meets policy, subject to limits.",
        limitations: [],
        acknowledged: true,
      }),
    (error) => error instanceof AuthorityError && error.code === "INVALID_COMMAND",
  );
});

test("a representative may explicitly decline without accepting the role", () => {
  let record = createSandboxFixture().record;
  const actors = actorsFor(record);
  record = run(record, { type: "confirm_grant", ...actors.principal, acknowledged: true }).record;
  record = run(record, {
    type: "decline_responsibility",
    ...actors.representative,
    reason: "I cannot take on this responsibility.",
    acknowledged: true,
  }).record;
  assert.equal(record.status, "declined");
  assert.equal(record.authoritySource.status, "ended");
  assert.equal(record.representativeAcceptedAt, undefined);
});

test("identity mismatch is saved as a recoverable requirement failure", () => {
  let record = createScenarioFixture("ar_identity_test", "identity_mismatch").record;
  const actors = actorsFor(record);
  record = run(record, { type: "confirm_grant", ...actors.principal, acknowledged: true }).record;
  record = run(record, { type: "accept_responsibility", ...actors.representative, acknowledged: true }).record;
  const result = run(record, { type: "complete_requirement", ...actors.representative, requirementKey: "representative_identity" });
  record = result.record;
  const requirement = record.requirements.find((entry) => entry.key === "representative_identity");
  assert.equal(record.status, "evidence_required");
  assert.equal(requirement?.status, "failed");
  assert.match(requirement?.failureReason ?? "", /did not match/);
  assert.equal(record.evidenceArtifacts.at(-1)?.result, "failed");
  assert.equal(result.event.type, "requirement.failed");
});
