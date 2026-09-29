import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_DEFAULT_EMAIL_RECIPIENTS, isDemoEmailRecipientAllowed } from "./delivery-boundary.ts";

test("Demo delivery allows only an exact normalized recipient match", () => {
  const allowlist = "presenter@example.com, representative@example.com";

  assert.equal(isDemoEmailRecipientAllowed(" Presenter@Example.com ", "demo", allowlist), true);
  assert.equal(isDemoEmailRecipientAllowed("other@example.com", "demo", allowlist), false);
  assert.equal(isDemoEmailRecipientAllowed("presenter+other@example.com", "demo", allowlist), false);
});

test("Demo delivery fails closed when the allowlist is missing or empty", () => {
  assert.equal(isDemoEmailRecipientAllowed("presenter@example.com", "demo", undefined), false);
  assert.equal(isDemoEmailRecipientAllowed("presenter@example.com", "demo", ""), false);
});

test("the Demo-only guard does not change delivery in other environments", () => {
  assert.equal(isDemoEmailRecipientAllowed("anyone@example.com", "production", undefined), true);
  assert.equal(isDemoEmailRecipientAllowed("anyone@example.com", "preview", undefined), true);
  assert.equal(isDemoEmailRecipientAllowed("anyone@example.com", "local", undefined), true);
});

test("Demo always allows the owner-controlled default recipients, merged with the env list", () => {
  for (const allowlist of [undefined, "", "presenter@example.com"]) {
    assert.equal(isDemoEmailRecipientAllowed("thepassageappio+pilot-admin@gmail.com", "demo", allowlist), true);
    assert.equal(isDemoEmailRecipientAllowed(" ThePassageAppIO+Pilot-Reviewer@gmail.com ", "demo", allowlist), true);
    assert.equal(isDemoEmailRecipientAllowed("thepassageappio@gmail.com", "demo", allowlist), true);
    assert.equal(isDemoEmailRecipientAllowed("thepassageappio+other@gmail.com", "demo", allowlist), false);
    assert.equal(isDemoEmailRecipientAllowed("someone@gmail.com", "demo", allowlist), false);
  }
  assert.equal(isDemoEmailRecipientAllowed("presenter@example.com", "demo", "presenter@example.com"), true);
  assert.deepEqual([...DEMO_DEFAULT_EMAIL_RECIPIENTS].sort(), [
    "thepassageappio+pilot-admin@gmail.com",
    "thepassageappio+pilot-reviewer@gmail.com",
    "thepassageappio@gmail.com",
  ].sort());
});

test("the env allowlist still ignores wildcard entries", () => {
  assert.equal(isDemoEmailRecipientAllowed("*@example.com", "demo", "*@example.com"), false);
  assert.equal(isDemoEmailRecipientAllowed("a@example.com", "demo", "*@example.com"), false);
});
