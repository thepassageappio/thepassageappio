import assert from "node:assert/strict";
import test from "node:test";
import { normalizeInviteExchangeIdempotencyKey } from "./invite-exchange-idempotency.ts";

test("normalizeInviteExchangeIdempotencyKey accepts uuid v4-ish keys", () => {
  assert.equal(
    normalizeInviteExchangeIdempotencyKey("F5AF7066-F881-48D5-8CCE-042CE9C0A43A"),
    "f5af7066-f881-48d5-8cce-042ce9c0a43a",
  );
});

test("normalizeInviteExchangeIdempotencyKey rejects non-uuids", () => {
  assert.equal(normalizeInviteExchangeIdempotencyKey(""), null);
  assert.equal(normalizeInviteExchangeIdempotencyKey("not-a-uuid"), null);
  assert.equal(normalizeInviteExchangeIdempotencyKey(undefined), null);
});
