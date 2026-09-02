import assert from "node:assert/strict";
import test from "node:test";
import { prepareHostedAuthorityDraft } from "./hosted-records.ts";

const validInput = {
  principalName: "  Eleanor Carter ",
  principalEmail: " Eleanor.Carter@example.com ",
  representativeName: "Maya Carter",
  representativeEmail: "MAYA.CARTER@example.com",
  accountBoundary: " Membership account ending 4821 ",
  validUntil: "2027-08-26T23:59:59.000Z",
  allowedActionKeys: ["discuss_service_issues", "receive_duplicate_statements"],
};

test("hosted draft input is normalized without changing the requested scope", () => {
  const result = prepareHostedAuthorityDraft(validInput, new Date("2026-08-28T12:00:00.000Z"));
  assert.deepEqual(result, {
    principalName: "Eleanor Carter",
    principalEmail: "eleanor.carter@example.com",
    representativeName: "Maya Carter",
    representativeEmail: "maya.carter@example.com",
    accountBoundary: "Membership account ending 4821",
    validUntil: "2027-08-26T23:59:59.000Z",
    allowedActionKeys: ["discuss_service_issues", "receive_duplicate_statements"],
  });
});

test("hosted draft rejects the same person in both roles", () => {
  assert.throws(
    () => prepareHostedAuthorityDraft(
      { ...validInput, representativeEmail: "eleanor.carter@example.com" },
      new Date("2026-08-28T12:00:00.000Z"),
    ),
    /different email address/,
  );
});

test("hosted draft rejects unsupported authority", () => {
  assert.throws(
    () => prepareHostedAuthorityDraft(
      { ...validInput, allowedActionKeys: ["move_money"] },
      new Date("2026-08-28T12:00:00.000Z"),
    ),
    /not supported/,
  );
});

test("hosted draft rejects an end date that has already passed", () => {
  assert.throws(
    () => prepareHostedAuthorityDraft(
      { ...validInput, validUntil: "2026-08-27T23:59:59.000Z" },
      new Date("2026-08-28T12:00:00.000Z"),
    ),
    /future/,
  );
});
