import assert from "node:assert/strict";
import test from "node:test";
import { isDemoEmailRecipientAllowed } from "./delivery-boundary.ts";

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
