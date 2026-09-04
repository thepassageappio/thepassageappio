import assert from "node:assert/strict";
import test from "node:test";
import { prepareCommercialInquiry } from "./commercial-inquiry.ts";

const valid = {
  inquiryType: "demo", fullName: " Alex Rivera ", email: " Alex@Example.Bank ",
  organizationName: " River Bank ", organizationType: "bank", jobRole: "Operations leader",
  currentProcess: "email_and_documents", annualVolumeBand: "500_1999", message: " Show the review flow. ",
};

test("commercial inquiry normalizes prospect fields without authority data", () => {
  assert.deepEqual(prepareCommercialInquiry(valid), {
    inquiryType: "demo", fullName: "Alex Rivera", email: "alex@example.bank",
    organizationName: "River Bank", organizationType: "bank", jobRole: "Operations leader",
    currentProcess: "email_and_documents", annualVolumeBand: "500_1999", message: "Show the review flow.",
  });
});

test("commercial inquiry rejects invalid options and email", () => {
  assert.throws(() => prepareCommercialInquiry({ ...valid, inquiryType: "other-thing" }), /Choose each required option/);
  assert.throws(() => prepareCommercialInquiry({ ...valid, email: "not-an-email" }), /valid work email/);
});

test("commercial inquiry bounds free text", () => {
  assert.throws(() => prepareCommercialInquiry({ ...valid, message: "x".repeat(1201) }), /under 1,200/);
});
