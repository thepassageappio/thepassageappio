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

test("participant emails skipped by the Demo allowlist say so plainly", async () => {
  const { participantDeliveryFaceLabel, freshLinkHelpText } = await import("./hosted-request-notice.ts");
  const blocked = "Not sent. This address isn't approved for Demo email.";
  assert.equal(participantDeliveryFaceLabel({ status: "failed", lastErrorCode: "recipient_not_allowed" }), blocked);
  assert.equal(participantDeliveryFaceLabel({ status: "pending", demoRecipientBlocked: true }), blocked);
  assert.match(participantDeliveryFaceLabel({ status: "canceled", demoRecipientBlocked: true }), /isn't approved for Demo email, so it will not be sent/);
  assert.equal(participantDeliveryFaceLabel({ status: "delivered", demoRecipientBlocked: true }), "Delivered to the recipient’s mail server");
  assert.equal(participantDeliveryFaceLabel({ status: "failed", lastErrorCode: "provider_rejected" }), "Not sent. The email service turned it down.");
  assert.doesNotMatch(participantDeliveryFaceLabel({ status: "failed", lastErrorCode: "bounce:Permanent:General" }), /Permanent|bounce/);
  assert.equal(participantDeliveryFaceLabel({ status: "pending" }), "Delivery pending");

  assert.equal(
    hostedRequestNoticeMessage("request_activated_delivery_pending", "failed", "recipient_not_allowed"),
    `${blocked} A fresh link will not reach it either. Use Copy secure link to share it yourself.`,
  );
  assert.doesNotMatch(hostedRequestNoticeMessage("request_activated_delivery_pending", "failed", "recipient_not_allowed") ?? "", /Send a fresh/);
  assert.match(hostedRequestNoticeMessage("request_activated_delivery_pending", "failed", "recipient_not_allowed") ?? "", /Copy secure link/);
  assert.equal(hostedRequestNoticeMessage("participant_invitation_delivery_pending", "failed", "configuration_missing"), "Not sent. Email is not set up here.");
  assert.equal(
    hostedRequestNoticeMessage("participant_invitation_delivery_pending", "failed", "provider_rejected"),
    "Not sent. The email service turned it down. You can send a fresh secure link.",
  );
  assert.doesNotMatch(freshLinkHelpText(true), /turns every earlier link/);
  assert.match(freshLinkHelpText(true), /will not be emailed/);
  assert.match(freshLinkHelpText(true), /Copy secure link/);
  assert.equal(freshLinkHelpText(false), "Sending a fresh link turns every earlier link for this person off.");
  for (const text of [blocked, freshLinkHelpText(true), participantDeliveryFaceLabel({ status: "canceled", demoRecipientBlocked: true })]) {
    assert.doesNotMatch(text, /\u2014|\u2013/);
  }
});

test("Demo pre-send allowlist rejection uses honest face copy without exposing the allowlist", async () => {
  const { userErrorMessage } = await import("./user-messages.ts");
  const message = userErrorMessage("demo_email_recipient_not_allowed");
  assert.match(message ?? "", /isn't approved for Demo email/);
  assert.match(message ?? "", /Nothing was counted/);
  assert.doesNotMatch(message ?? "", /PASSAGE_EMAIL|allowlist|pilot-admin|\+/i);
  assert.doesNotMatch(message ?? "", /\u2014|\u2013/);
});
