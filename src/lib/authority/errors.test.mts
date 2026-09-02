import assert from "node:assert/strict";
import test from "node:test";
import { AuthorityError, isAuthorityError } from "./errors.ts";

test("authority errors survive a structural server bundle boundary", () => {
  const serializedBoundaryError = {
    name: "AuthorityError",
    message: "The synthetic identity result did not match.",
    code: "REQUIREMENT_FAILED",
    status: 422,
  };
  assert.equal(isAuthorityError(serializedBoundaryError), true);
  assert.equal(isAuthorityError(new AuthorityError("Not found.", "NOT_FOUND", 404)), true);
});

test("arbitrary exceptions cannot expose their message through the authority boundary", () => {
  assert.equal(isAuthorityError(new Error("database secret")), false);
  assert.equal(isAuthorityError({ name: "AuthorityError", message: "spoof", code: "UNKNOWN", status: 400 }), false);
});
