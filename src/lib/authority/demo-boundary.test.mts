import assert from "node:assert/strict";
import test from "node:test";
import { demoParticipantRecipientPair, isDemoEnvironment, mayProvisionDemoRun } from "./demo-boundary.ts";

test("Demo provisioning requires the exact environment, role, and presenter email", () => {
  const presenters = "owner@example.com, admin@example.com";
  assert.equal(mayProvisionDemoRun(" Owner@Example.com ", "owner", "demo", presenters), true);
  assert.equal(mayProvisionDemoRun("admin@example.com", "admin", "demo", presenters), true);
  assert.equal(mayProvisionDemoRun("owner@example.com", "reviewer", "demo", presenters), false);
  assert.equal(mayProvisionDemoRun("other@example.com", "owner", "demo", presenters), false);
});

test("Production, preview, missing configuration, and wildcard presenters fail closed", () => {
  assert.equal(isDemoEnvironment("production"), false);
  assert.equal(mayProvisionDemoRun("owner@example.com", "owner", "production", "owner@example.com"), false);
  assert.equal(mayProvisionDemoRun("owner@example.com", "owner", "preview", "owner@example.com"), false);
  assert.equal(mayProvisionDemoRun("owner@example.com", "owner", "demo", undefined), false);
  assert.equal(mayProvisionDemoRun("owner@example.com", "owner", "demo", "*@example.com"), false);
});

test("Demo participants use two distinct exact allowlisted recipients", () => {
  assert.deepEqual(
    demoParticipantRecipientPair(" Principal@Example.com,representative@example.com,principal@example.com"),
    ["principal@example.com", "representative@example.com"],
  );
  assert.equal(demoParticipantRecipientPair("only@example.com"), null);
  assert.equal(demoParticipantRecipientPair("*@example.com"), null);
  assert.equal(demoParticipantRecipientPair(undefined), null);
});
