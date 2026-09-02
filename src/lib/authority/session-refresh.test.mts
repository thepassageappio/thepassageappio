import assert from "node:assert/strict";
import test from "node:test";
import { refreshSessionClaims } from "../supabase/session-refresh.ts";

test("a stale or unreachable browser auth session does not stall the proxy", async () => {
  assert.equal(await refreshSessionClaims(async () => {
    throw new Error("network unavailable");
  }), "unavailable");
});

test("a healthy browser auth session still refreshes normally", async () => {
  assert.equal(await refreshSessionClaims(async () => ({ claims: { sub: "user" } })), "refreshed");
});
