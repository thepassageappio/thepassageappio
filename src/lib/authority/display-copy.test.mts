import assert from "node:assert/strict";
import test from "node:test";
import { authorityPurposeLabel, requirementFaceTitle, roleFaceLabel } from "./display-copy.ts";

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

test("requirementFaceTitle remaps representative certification for the face", () => {
  assert.equal(
    requirementFaceTitle("representative_certification", "Representative certification"),
    "Certification from the person acting for them",
  );
  assert.equal(
    requirementFaceTitle("power_of_attorney", "Power of attorney document"),
    "Power of attorney document",
  );
});
