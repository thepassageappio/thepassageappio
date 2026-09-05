import assert from "node:assert/strict";
import test from "node:test";
import { buildParticipantInvitationEmail, participantInvitationIdempotencyKey } from "./participant-invitation-delivery.ts";

const delivery = {
  invitationId: "invitation-1",
  invitationVersion: 3,
  participantRole: "principal" as const,
  email: "eleanor@example.com",
  institutionName: "Hudson Community Bank",
  participantName: "Eleanor Carter",
  otherPersonName: "Maya Carter",
  purpose: "Request recognition of limited financial power of attorney authority",
  accountBoundary: "Membership account ending 4821",
  expiresAt: "2026-09-01T12:00:00.000Z",
  secureUrl: "https://authority.example/r/secure-token",
};

test("participant invitation explains the sender, role, other person, scope, expiration, and decision boundary", () => {
  const message = buildParticipantInvitationEmail(delivery);
  for (const expected of [
    delivery.institutionName,
    "person granting authority",
    delivery.otherPersonName,
    "Financial power of attorney request",
    delivery.accountBoundary,
    delivery.secureUrl,
    "final decision",
    "newest Passage email",
    "every earlier link stops working",
  ]) {
    assert.match(message.text, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});

test("participant invitation HTML escapes institution and secure URL content", () => {
  const message = buildParticipantInvitationEmail({
    ...delivery,
    institutionName: '<script>alert("bank")</script>',
    secureUrl: 'https://authority.example/r/a" onclick="alert(1)',
  });
  assert.doesNotMatch(message.html, /<script>/);
  assert.doesNotMatch(message.html, /onclick="alert/);
  assert.match(message.html, /&lt;script&gt;/);
  assert.match(message.html, /&quot; onclick=&quot;/);
});

test("delivery idempotency changes when an invitation is reissued", () => {
  assert.equal(participantInvitationIdempotencyKey(delivery), "authority-participant-invitation-1-v3");
  assert.notEqual(participantInvitationIdempotencyKey(delivery), participantInvitationIdempotencyKey({ ...delivery, invitationVersion: 4 }));
});

test("representative resume email preserves the prior decision and directs the next work", () => {
  const message = buildParticipantInvitationEmail({
    ...delivery,
    participantRole: "representative",
    participantName: "Maya Carter",
    otherPersonName: "Eleanor Carter",
    accessPurpose: "resume",
  });
  assert.match(message.subject, /fresh secure access link/i);
  assert.match(message.text, /finish the remaining requirements/i);
  assert.match(message.text, /earlier answers are still saved/i);
  assert.match(message.html, /Resume secure request/);
  assert.doesNotMatch(message.text, /accept or decline/i);
});

test("participant receipt email directs both roles to the institution decision without claiming Passage granted authority", () => {
  const message = buildParticipantInvitationEmail({
    ...delivery,
    accessPurpose: "receipt",
  });
  assert.match(message.subject, /decision receipt ready/i);
  assert.match(message.text, /outcome, accepted actions, and any limits/i);
  assert.match(message.text, /Financial power of attorney request/i);
  assert.doesNotMatch(message.text, /request recognition of limited financial power of attorney authority/i);
  assert.match(message.html, /View decision receipt/);
  assert.match(message.html, /-webkit-text-size-adjust: 100%/);
  assert.match(message.html, /@media only screen and \(max-width: 480px\)/);
  assert.match(message.html, /min-height: 44px/);
  assert.doesNotMatch(message.text, /Passage (approved|verified|granted)/i);
});
