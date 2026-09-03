import assert from "node:assert/strict";
import test from "node:test";
import {
  isLocalAuthoritySandboxAvailable,
  localAuthoritySandboxNotFoundResponse,
  requireLocalAuthoritySandbox,
} from "./sandbox-boundary.ts";

test("the SQLite sample environment is available to local development and tests", () => {
  assert.equal(isLocalAuthoritySandboxAvailable("development"), true);
  assert.equal(isLocalAuthoritySandboxAvailable("test"), true);
});

test("the production boundary returns a private generic not-found response", async () => {
  const response = localAuthoritySandboxNotFoundResponse();
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await response.json(), {
    error: { code: "NOT_FOUND", message: "The requested resource is not available." },
  });
});

test("the SQLite sample environment is unavailable in production", () => {
  assert.equal(isLocalAuthoritySandboxAvailable("production"), false);
  assert.throws(
    () => requireLocalAuthoritySandbox("production"),
    (error: unknown) => {
      assert.equal((error as { code?: string }).code, "NOT_FOUND");
      assert.equal((error as { status?: number }).status, 404);
      return true;
    },
  );
});
