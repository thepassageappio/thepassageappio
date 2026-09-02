import assert from "node:assert/strict";
import test from "node:test";
import { AuthorityError } from "./errors.ts";
import {
  prepareHostedInformationRequest,
  prepareHostedInformationResponse,
  prepareHostedWithdrawal,
} from "./hosted-information.ts";

test("hosted information request and response inputs are normalized", () => {
  assert.deepEqual(prepareHostedInformationRequest({
    requirementKey: " identity_evidence ",
    message: " Provide a current address source. ",
  }), {
    requirementKey: "identity_evidence",
    message: "Provide a current address source.",
  });
  assert.deepEqual(prepareHostedInformationResponse({ response: " Confirmed with a current statement. " }), {
    response: "Confirmed with a current statement.",
  });
});
test("hosted information requests reject missing requirement or message", () => {
  for (const input of [
    { requirementKey: "", message: "Provide a current source." },
    { requirementKey: "identity_evidence", message: "" },
  ]) {
    assert.throws(() => prepareHostedInformationRequest(input), AuthorityError);
  }
  assert.throws(() => prepareHostedInformationResponse({ response: "" }), AuthorityError);
});

test("hosted withdrawal requires a bounded reason and explicit acknowledgment", () => {
  assert.deepEqual(prepareHostedWithdrawal({ reason: " I can no longer serve. ", acknowledged: true }), {
    reason: "I can no longer serve.",
    acknowledged: true,
  });
  assert.throws(() => prepareHostedWithdrawal({ reason: "", acknowledged: true }), AuthorityError);
  assert.throws(() => prepareHostedWithdrawal({ reason: "I can no longer serve.", acknowledged: false }), AuthorityError);
});
