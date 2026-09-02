import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AuthorityError } from "./errors.ts";
import { AuthorityRepository } from "./repository.ts";

test("SQLite persists a mutation across repository restarts", () => {
  const directory = mkdtempSync(join(tmpdir(), "passage-authority-"));
  const path = join(directory, "authority.sqlite");
  try {
    const first = new AuthorityRepository(path);
    const initial = first.getRecord("ar_sandbox_carter");
    const result = first.execute(initial.id, {
      type: "confirm_grant",
      actorId: initial.principal.id,
      actorRole: "principal",
      acknowledged: true,
      expectedVersion: initial.version,
      idempotencyKey: "persist-confirm",
    });
    first.close();

    const second = new AuthorityRepository(path);
    const restored = second.getRecord(initial.id);
    assert.equal(restored.status, "awaiting_representative");
    assert.equal(restored.version, result.record.version);
    assert.equal(restored.events.at(-1)?.type, "principal.confirmed");
    const deliveries = second.getWebhookDeliveries(initial.id);
    assert.equal(deliveries.at(0)?.eventId, result.event.id);
    assert.equal(deliveries.at(0)?.status, "delivered");
    second.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("the sandbox seeds a multi-record institution queue", () => {
  const repository = new AuthorityRepository(":memory:");
  try {
    const records = repository.listRecords();
    assert.equal(records.length, 5);
    assert.equal(records.some((record) => record.status === "under_review"), true);
    assert.equal(records.some((record) => record.status === "information_requested"), true);
    assert.equal(records.some((record) => record.status === "declined"), true);
    assert.equal(records.every((record) => record.policyVersion.includes("1.3")), true);
  } finally {
    repository.close();
  }
});

test("a webhook retry is observable and can be replayed once", () => {
  const repository = new AuthorityRepository(":memory:");
  try {
    const retry = repository
      .getWebhookDeliveries("ar_sandbox_brooks")
      .find((delivery) => delivery.eventType === "assessment.submitted");
    assert.ok(retry);
    assert.equal(retry.status, "retrying");
    assert.equal(retry.attempts, 2);

    const replayed = repository.replayWebhook(retry.id);
    assert.equal(replayed.status, "delivered");
    assert.equal(replayed.responseCode, 200);
    assert.equal(replayed.attempts, 3);
    assert.equal(replayed.nextRetryAt, undefined);

    assert.throws(
      () => repository.replayWebhook(retry.id),
      (error) => error instanceof AuthorityError && error.code === "WEBHOOK_NOT_REPLAYABLE",
    );
  } finally {
    repository.close();
  }
});

test("creating a deterministic failure scenario adds a new durable record", () => {
  const repository = new AuthorityRepository(":memory:");
  try {
    const before = repository.listRecords().length;
    const created = repository.createScenario("identity_mismatch");
    assert.equal(created.sandboxScenario, "identity_mismatch");
    assert.equal(created.status, "awaiting_principal");
    assert.equal(repository.listRecords().length, before + 1);
    assert.equal(repository.getWebhookDeliveries(created.id).length, 1);
  } finally {
    repository.close();
  }
});

test("institution setup creates a policy-based financial POA request and opening receipt", () => {
  const repository = new AuthorityRepository(":memory:");
  try {
    const created = repository.createRequest({
      principalName: "Avery Morgan",
      principalEmail: "avery@example.test",
      representativeName: "Casey Morgan",
      representativeEmail: "casey@example.test",
      accountBoundary: "Checking account ending 2486",
      validUntil: "2027-08-26T23:59:59.000Z",
      allowedActionKeys: ["receive_duplicate_statements", "discuss_service_issues"],
    });
    assert.equal(created.status, "awaiting_principal");
    assert.equal(created.authoritySource.type, "financial_power_of_attorney");
    assert.equal(created.authoritySource.executionMode, "external_instrument");
    assert.equal(created.policy.id, "policy_hvcu_financial_poa_v1_3");
    assert.equal(created.requirements.length, 6);
    assert.equal(created.events.length, 1);
    assert.equal(created.events[0]?.type, "authority_record.created");
    assert.equal(repository.getWebhookDeliveries(created.id).length, 1);
  } finally {
    repository.close();
  }
});

test("replaying an idempotency key does not append a second event", () => {
  const repository = new AuthorityRepository(":memory:");
  try {
    const initial = repository.getRecord("ar_sandbox_carter");
    const command = {
      type: "confirm_grant" as const,
      actorId: initial.principal.id,
      actorRole: "principal" as const,
      acknowledged: true,
      expectedVersion: initial.version,
      idempotencyKey: "replay-confirm",
    };
    const first = repository.execute(initial.id, command);
    const second = repository.execute(initial.id, command);
    const restored = repository.getRecord(initial.id);
    assert.equal(first.replayed, false);
    assert.equal(second.replayed, true);
    assert.equal(second.event.id, first.event.id);
    assert.equal(restored.events.length, 2);
  } finally {
    repository.close();
  }
});

test("reusing an idempotency key for a different command is rejected", () => {
  const repository = new AuthorityRepository(":memory:");
  try {
    const initial = repository.getRecord("ar_sandbox_carter");
    repository.execute(initial.id, {
      type: "confirm_grant",
      actorId: initial.principal.id,
      actorRole: "principal",
      acknowledged: true,
      expectedVersion: initial.version,
      idempotencyKey: "same-key",
    });
    assert.throws(
      () =>
        repository.execute(initial.id, {
          type: "confirm_grant",
          actorId: initial.principal.id,
          actorRole: "principal",
          acknowledged: false,
          expectedVersion: initial.version,
          idempotencyKey: "same-key",
        }),
      (error) => error instanceof AuthorityError && error.code === "INVALID_COMMAND",
    );
  } finally {
    repository.close();
  }
});
