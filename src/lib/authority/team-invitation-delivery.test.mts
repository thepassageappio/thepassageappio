import assert from "node:assert/strict";
import test from "node:test";

import { buildTeamInvitationEmail } from "./team-invitation-delivery.ts";

test("team invitation email names the organization, role, recipient, and expiration", () => {
  const email = buildTeamInvitationEmail({
    invitationId: "11111111-1111-4111-8111-111111111111",
    email: "reviewer@example.com",
    organizationName: "River Valley Credit Union",
    role: "reviewer",
    expiresAt: "2026-09-04T19:00:00.000Z",
    secureUrl: "https://authority.example.com/team/accept?invitation=one&token=two",
  });

  assert.equal(email.subject, "Join River Valley Credit Union in Passage Authority");
  assert.match(email.text, /Institution reviewer/);
  assert.match(email.text, /reviewer@example\.com/);
  assert.match(email.html, /Review invitation/);
  assert.match(email.html, /receiving institution keeps the final decision/);
});

test("team invitation email escapes organization and URL content", () => {
  const email = buildTeamInvitationEmail({
    invitationId: "22222222-2222-4222-8222-222222222222",
    email: "staff@example.com",
    organizationName: '<script>alert("x")</script>',
    role: "staff",
    expiresAt: "invalid",
    secureUrl: 'https://authority.example.com/team/accept?a=1&b="two"',
  });

  assert.doesNotMatch(email.html, /<script>/);
  assert.match(email.html, /&lt;script&gt;/);
  assert.match(email.html, /a=1&amp;b=&quot;two&quot;/);
  assert.match(email.text, /Operations staff/);
});
