import assert from "node:assert/strict";
import test from "node:test";
import { hostedRequestNoticeMessage } from "./user-messages.ts";

test("hosted request notices use the current delivery state", () => {
  assert.equal(
    hostedRequestNoticeMessage("participant_invitation_submitted", "delivered"),
    "Email delivery confirmed.",
  );
  assert.equal(
    hostedRequestNoticeMessage("participant_invitation_submitted", "failed"),
    "Email delivery needs attention. Send a fresh secure link.",
  );
  assert.equal(
    hostedRequestNoticeMessage("participant_invitation_submitted", "retrying"),
    "Email delivery is being retried.",
  );
});

test("delivery notices disappear after the request moves beyond delivery", () => {
  assert.equal(hostedRequestNoticeMessage("participant_invitation_submitted", null), null);
});

test("unrelated notices keep their saved user-facing message", () => {
  assert.equal(
    hostedRequestNoticeMessage("draft_created", null),
    "The draft is saved. No invitation was sent and no transaction was counted.",
  );
});
