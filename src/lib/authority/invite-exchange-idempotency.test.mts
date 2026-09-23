import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeInviteExchangeIdempotencyKey,
  resolveInviteExchangeIdempotencyKey,
} from "./invite-exchange-idempotency.ts";

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

test("resolveInviteExchangeIdempotencyKey prefers cookie over form", () => {
  assert.equal(
    resolveInviteExchangeIdempotencyKey({
      cookieValue: "F5AF7066-F881-48D5-8CCE-042CE9C0A43A",
      formValue: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    }),
    "f5af7066-f881-48d5-8cce-042ce9c0a43a",
  );
});

test("resolveInviteExchangeIdempotencyKey falls back to form when cookie missing", () => {
  assert.equal(
    resolveInviteExchangeIdempotencyKey({
      cookieValue: null,
      formValue: "AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE",
    }),
    "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  );
});

test("resolveInviteExchangeIdempotencyKey returns null when both invalid", () => {
  assert.equal(
    resolveInviteExchangeIdempotencyKey({ cookieValue: "x", formValue: "" }),
    null,
  );
});
