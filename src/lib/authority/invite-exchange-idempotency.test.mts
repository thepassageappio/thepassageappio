import assert from "node:assert/strict";
import test from "node:test";
import {
  decideInviteExchangeReplay,
  normalizeInviteExchangeBoundToken,
  normalizeInviteExchangeIdempotencyKey,
  resolveInviteExchangeIdempotencyKey,
  shouldReuseInviteExchangeIdempotencyKey,
} from "./invite-exchange-idempotency.ts";

const TOKEN_A = "a".repeat(64);
const TOKEN_B = "b".repeat(64);
const KEY_A = "f5af7066-f881-48d5-8cce-042ce9c0a43a";
const KEY_B = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

test("normalizeInviteExchangeIdempotencyKey accepts uuid v4-ish keys", () => {
  assert.equal(
    normalizeInviteExchangeIdempotencyKey("F5AF7066-F881-48D5-8CCE-042CE9C0A43A"),
    KEY_A,
  );
});

test("normalizeInviteExchangeIdempotencyKey rejects non-uuids", () => {
  assert.equal(normalizeInviteExchangeIdempotencyKey(""), null);
  assert.equal(normalizeInviteExchangeIdempotencyKey("not-a-uuid"), null);
  assert.equal(normalizeInviteExchangeIdempotencyKey(undefined), null);
});

test("normalizeInviteExchangeBoundToken accepts 64-hex invite tokens", () => {
  assert.equal(normalizeInviteExchangeBoundToken(TOKEN_A.toUpperCase()), TOKEN_A);
  assert.equal(normalizeInviteExchangeBoundToken("short"), null);
});

test("shouldReuseInviteExchangeIdempotencyKey only when bound to current token", () => {
  assert.equal(shouldReuseInviteExchangeIdempotencyKey({ inviteToken: TOKEN_A, boundToken: TOKEN_A }), true);
  assert.equal(shouldReuseInviteExchangeIdempotencyKey({ inviteToken: TOKEN_A, boundToken: TOKEN_B }), false);
  assert.equal(shouldReuseInviteExchangeIdempotencyKey({ inviteToken: TOKEN_A, boundToken: null }), false);
});

test("resolveInviteExchangeIdempotencyKey prefers cookie over form when token-bound", () => {
  assert.equal(
    resolveInviteExchangeIdempotencyKey({
      cookieValue: KEY_A,
      formValue: KEY_B,
      inviteToken: TOKEN_A,
      boundToken: TOKEN_A,
    }),
    KEY_A,
  );
});

test("resolveInviteExchangeIdempotencyKey ignores cookie when bound token differs (receipt after decision)", () => {
  assert.equal(
    resolveInviteExchangeIdempotencyKey({
      cookieValue: KEY_A,
      formValue: KEY_B,
      inviteToken: TOKEN_B,
      boundToken: TOKEN_A,
    }),
    KEY_B,
  );
});

test("resolveInviteExchangeIdempotencyKey ignores unbound legacy cookie for a concrete invite token", () => {
  assert.equal(
    resolveInviteExchangeIdempotencyKey({
      cookieValue: KEY_A,
      formValue: null,
      inviteToken: TOKEN_B,
      boundToken: null,
    }),
    null,
  );
});

test("resolveInviteExchangeIdempotencyKey falls back to form when cookie missing", () => {
  assert.equal(
    resolveInviteExchangeIdempotencyKey({
      cookieValue: null,
      formValue: "AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE",
    }),
    KEY_B,
  );
});

test("resolveInviteExchangeIdempotencyKey returns null when both invalid", () => {
  assert.equal(
    resolveInviteExchangeIdempotencyKey({ cookieValue: "x", formValue: "" }),
    null,
  );
});

test("decideInviteExchangeReplay: true double-submit replays active session", () => {
  assert.equal(
    decideInviteExchangeReplay({
      commandReceiptFound: true,
      activeSessionFound: true,
      invitationStatus: "accepted",
    }),
    "replay",
  );
});

test("decideInviteExchangeReplay: reissued pending invite with stale receipt mints fresh (P0 class)", () => {
  assert.equal(
    decideInviteExchangeReplay({
      commandReceiptFound: true,
      activeSessionFound: false,
      invitationStatus: "pending",
    }),
    "fresh_after_reissue",
  );
});

test("decideInviteExchangeReplay: stale receipt without pending invite stays session_unavailable", () => {
  assert.equal(
    decideInviteExchangeReplay({
      commandReceiptFound: true,
      activeSessionFound: false,
      invitationStatus: "accepted",
    }),
    "session_unavailable",
  );
});

test("decideInviteExchangeReplay: no prior receipt proceeds", () => {
  assert.equal(
    decideInviteExchangeReplay({
      commandReceiptFound: false,
      activeSessionFound: false,
      invitationStatus: "pending",
    }),
    "proceed",
  );
});
