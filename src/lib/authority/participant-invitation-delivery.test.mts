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
    delivery.purpose,
    delivery.accountBoundary,
    delivery.secureUrl,
    "final decision",
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
  assert.match(message.subject, /recorded a decision/i);
  assert.match(message.text, /outcome, accepted actions, any limits, and later changes/i);
  assert.match(message.html, /View decision receipt/);
  assert.doesNotMatch(message.text, /Passage (approved|verified|granted)/i);
});
