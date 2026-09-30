import assert from "node:assert/strict";
import test from "node:test";
import { authorityPurposeLabel, roleFaceLabel } from "./display-copy.ts";

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

test("roleFaceLabel uses Steve-locked Path B vocabulary", () => {
  assert.equal(roleFaceLabel("principal"), "account holder");
  assert.equal(roleFaceLabel("principal", { capitalize: true }), "Account holder");
  assert.equal(roleFaceLabel("representative"), "person acting for them");
  assert.equal(roleFaceLabel("representative", { capitalize: true }), "Person acting for them");
  assert.equal(roleFaceLabel("staff"), "staff");
  assert.equal(roleFaceLabel("staff", { capitalize: true }), "Staff");
});
