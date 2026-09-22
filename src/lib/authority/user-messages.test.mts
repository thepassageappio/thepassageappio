import assert from "node:assert/strict";
import test from "node:test";
import { deliveryStatusFaceLabel, hostedRequestNoticeMessage } from "./hosted-request-notice.ts";

test("hosted request notices use the current delivery state without claiming Inbox", () => {
  assert.equal(
    hostedRequestNoticeMessage("participant_invitation_submitted", "delivered"),
    "Delivered to the recipient’s mail server.",
  );
  assert.equal(
    hostedRequestNoticeMessage("participant_invitation_submitted", "failed"),
    "Email delivery needs attention. Send a fresh secure link.",
  );
  assert.equal(
    hostedRequestNoticeMessage("participant_invitation_submitted", "retrying"),
    "Email delivery is being retried.",
  );
  assert.equal(
    hostedRequestNoticeMessage("participant_invitation_submitted", "processing"),
    "The email service accepted the new invitation. Delivery is not yet confirmed.",
  );
  assert.doesNotMatch(
    hostedRequestNoticeMessage("participant_invitation_submitted", "delivered") ?? "",
    /inbox/i,
  );
});

test("delivery face labels never claim Inbox from provider delivered", () => {
  assert.equal(
    deliveryStatusFaceLabel("delivered"),
    "Delivered to the recipient’s mail server",
  );
  assert.doesNotMatch(deliveryStatusFaceLabel("delivered"), /inbox/i);
  assert.doesNotMatch(deliveryStatusFaceLabel("processing"), /inbox/i);
  assert.match(deliveryStatusFaceLabel("processing"), /mail-server delivery not confirmed/i);
});

test("delivery notices disappear after the request moves beyond delivery", () => {
  assert.equal(hostedRequestNoticeMessage("participant_invitation_submitted", null), null);
});

test("unrelated notices keep their saved user-facing message", () => {
  assert.equal(
    hostedRequestNoticeMessage("draft_created", null),
    "Your draft is saved. Nothing was sent or counted.",
  );
});
