import assert from "node:assert/strict";
import test from "node:test";
import { authorityPurposeLabel } from "./display-copy.ts";

test("legacy financial POA purpose is presented in plain language", () => {
  assert.equal(
    authorityPurposeLabel("  Request recognition of limited financial   power of attorney authority  "),
    "Financial power of attorney request",
  );
});

test("an institution's specific purpose remains unchanged except for surrounding whitespace", () => {
  assert.equal(
    authorityPurposeLabel("  Help with the selected account-service actions  "),
    "Help with the selected account-service actions",
  );
});
