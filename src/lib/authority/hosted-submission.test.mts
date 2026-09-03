import assert from "node:assert/strict";
import test from "node:test";
import { HOSTED_DISCLOSURE_VERSION, prepareHostedSubmission } from "./hosted-submission.ts";

test("hosted submission requires explicit minimum-necessary disclosure acknowledgment", () => {
  assert.throws(
    () => prepareHostedSubmission({ acknowledged: false }),
    /Confirm the information sharing before sending the request/,
  );
});

test("hosted submission preserves the exact disclosure version", () => {
  assert.deepEqual(prepareHostedSubmission({ acknowledged: true }), {
    acknowledged: true,
    textVersion: HOSTED_DISCLOSURE_VERSION,
  });
});
