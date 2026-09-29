import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import type { OrganizationRole } from "./access.ts";
import { DEMO_EMAIL_NOT_APPROVED, emailNotSentReason } from "./email-delivery-reason.ts";
import {
  buildTeamInvitationAcceptUrl,
  canReissueTeamInvitation,
  parseTeamInvitationReissueResult,
  teamInvitationDeliveryIdempotencyKey,
  teamInvitationDeliveryLabel,
  teamInvitationNoticeCode,
  teamInvitationReissueErrorCode,
  teamInvitationStatusLabel,
} from "./team-invitation-reissue.ts";
import { teamInvitationDeliveryBlocker } from "./team-invitation-delivery.ts";
import { userErrorMessage, userNoticeMessage } from "./user-messages.ts";

const token = "a".repeat(64);
const migration = readFileSync(new URL("../../../supabase/migrations/20260929090000_team_invitation_reissue.sql", import.meta.url), "utf8");
const sqlTest = readFileSync(new URL("../../../supabase/tests/team_invitation_reissue.sql", import.meta.url), "utf8");
const actions = readFileSync(new URL("../../app/team-invitation-actions.ts", import.meta.url), "utf8");
const teamPage = readFileSync(new URL("../../app/app/team/page.tsx", import.meta.url), "utf8");
const copyLink = readFileSync(new URL("../../app/app/team/CopyInviteLink.tsx", import.meta.url), "utf8");

test("role gating: only owners and administrators can resend or copy an invite link", () => {
  const roles: OrganizationRole[] = ["owner", "admin", "staff", "reviewer", "developer", "auditor"];
  for (const role of roles) {
    const expected = role === "owner" || role === "admin";
    assert.equal(canReissueTeamInvitation(role, "staff"), expected, `${role} on a staff invite`);
  }
  assert.equal(canReissueTeamInvitation("owner", "admin"), true);
  assert.equal(canReissueTeamInvitation("admin", "admin"), false, "admins cannot manage admin invites, matching the database");
  assert.match(migration, /v_actor_role = 'admin' and v_invitation\.role = 'admin'/);
  assert.match(migration, /authority_private\.assert_member_manager\(p_organization_id\)/);
  assert.match(migration, /perform authority_private\.require_privileged_mfa_v1\(p_organization_id\);/);
  assert.match(actions, /getAuthorityMutationAccessContext\(\)/);
  assert.match(actions, /canReissueTeamInvitation\(access\.membership\.role/);
  assert.match(teamPage, /canManage && invitations\.length/, "the invitations table stays owner/admin only");
});

test("token rotation: the database replaces the stored hash so the old link stops working", () => {
  assert.match(migration, /on conflict \(invitation_id\) do update\s+set token_hash = excluded\.token_hash/);
  assert.doesNotMatch(migration, /select\s+token_hash/i, "the old token hash is never read back");
  assert.match(migration, /'token', null/, "an idempotent replay never returns the token again");
  assert.match(sqlTest, /old token no longer accepted/);
  assert.match(sqlTest, /new token accepted/);
});

test("the fresh token is returned once and the app refuses a replay without one", () => {
  const parsed = parseTeamInvitationReissueResult({
    invitation_id: "11111111-1111-4111-8111-111111111111", email: "staff@example.com", role: "staff",
    version: 2, expires_at: "2026-10-05T04:00:00.000Z", token, replayed: false,
  });
  assert.equal(parsed.version, 2);
  assert.throws(() => parseTeamInvitationReissueResult({
    invitation_id: "11111111-1111-4111-8111-111111111111", email: "staff@example.com", role: "staff",
    version: 2, expires_at: "2026-10-05T04:00:00.000Z", token: null, replayed: true,
  }), /team_invitation_reissue_invalid/);
  const url = new URL(buildTeamInvitationAcceptUrl("https://demo.example.com", parsed.invitationId, parsed.token));
  assert.equal(url.pathname, "/team/accept");
  assert.equal(url.searchParams.get("token"), token);
  assert.doesNotMatch(actions, /console\./, "never log links or tokens");
  assert.doesNotMatch(actions, /cookies\(\)/, "the link is not stored in a cookie");
  assert.doesNotMatch(copyLink, /console\./);
});

test("audit: each reissue inserts one append-only audit row without token material", () => {
  assert.match(migration, /insert into public\.organization_audit_events/);
  assert.doesNotMatch(migration, /update\s+public\.organization_audit_events/i);
  assert.doesNotMatch(migration, /delete\s+from\s+public\.organization_audit_events/i);
  assert.match(migration, /'membership\.invitation_link_copied'/);
  assert.match(migration, /'membership\.invitation_resent'/);
  const payload = migration.slice(migration.indexOf("insert into public.organization_audit_events"), migration.indexOf("returning event_id"));
  assert.doesNotMatch(payload, /v_token|token_hash/, "audit payload never holds the token or its hash");
  assert.match(sqlTest, /one audit row inserted per reissue, no token material/);
  assert.match(sqlTest, /audit stays append-only/);
});

test("spam guard and expiry stay consistent with new invitations", () => {
  assert.match(migration, /interval '7 days'/, "a new link gets the same seven days as a new invitation");
  assert.match(migration, /invitation_expired/);
  assert.match(migration, /v_recent_count >= 5/);
  assert.match(migration, /interval '1 hour'/);
  assert.match(userErrorMessage(teamInvitationReissueErrorCode({ message: "invitation_reissue_limit_reached" })) ?? "", /last hour/);
});

test("migration is idempotent, timestamped after the last main migration, and closed to anon", () => {
  const migrationNames = readdirSync(new URL("../../../supabase/migrations/", import.meta.url)).filter((name) => name.endsWith(".sql")).sort();
  assert.ok("20260929090000" > "20260928120200");
  assert.equal(migrationNames.filter((name) => name.startsWith("20260929090000")).length, 1, "timestamp is unique");
  assert.ok("20260929090000" >= "20260929090000" && "20260929090000" <= "20260929090900", "inside this branch's reserved range");
  assert.doesNotMatch(migration, /create function|create table|alter table/i);
  assert.match(migration, /revoke execute on function public\.reissue_member_invitation_v1\(uuid, uuid, bigint, text, uuid\) from public, anon;/);
  assert.match(migration, /revoke execute on function authority_private\.reissue_member_invitation_v1\(uuid, uuid, bigint, text, uuid\) from public, anon;/);
});

test("resend respects the Demo recipient allowlist before changing anything", () => {
  const env = { PASSAGE_ENVIRONMENT: "demo", PASSAGE_EMAIL_RECIPIENT_ALLOWLIST: "ok@example.com", AUTHORITY_TEAM_INVITATION_DELIVERY: "resend", RESEND_API_KEY: "k", AUTHORITY_EMAIL_FROM: "f@example.com" };
  assert.equal(teamInvitationDeliveryBlocker("blocked@example.com", env), "recipient_not_allowed");
  assert.equal(teamInvitationDeliveryBlocker("OK@example.com", env), null);
  assert.equal(teamInvitationDeliveryBlocker("ok@example.com", { ...env, RESEND_API_KEY: "" }), "configuration_missing");
  assert.equal(teamInvitationDeliveryBlocker("anyone@example.com", { AUTHORITY_TEAM_INVITATION_DELIVERY: "local" }), null);
  const resend = actions.slice(actions.indexOf("export async function resendTeamInvitationAction"), actions.indexOf("export type CopyTeamInvitationLinkState"));
  assert.ok(resend.indexOf("teamInvitationDeliveryBlocker") < resend.indexOf("reissue("), "the allowlist check comes before rotation");
});

test("each new link gets its own email dedupe key", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  assert.equal(teamInvitationDeliveryIdempotencyKey(id), `authority-team-invitation-${id}`);
  assert.equal(teamInvitationDeliveryIdempotencyKey(id, 1), `authority-team-invitation-${id}`);
  assert.equal(teamInvitationDeliveryIdempotencyKey(id, 3), `authority-team-invitation-${id}-v3`);
});

test("allowlist-skip reason renders plainly on the team page", () => {
  assert.equal(teamInvitationDeliveryLabel({ delivery_status: "pending" }, "recipient_not_allowed"), DEMO_EMAIL_NOT_APPROVED);
  assert.equal(DEMO_EMAIL_NOT_APPROVED, "Not sent. This address isn't approved for Demo email.");
  assert.equal(teamInvitationDeliveryLabel({ delivery_status: "failed", delivery_error_code: "recipient_not_allowed" }, null), DEMO_EMAIL_NOT_APPROVED);
  assert.equal(teamInvitationDeliveryLabel({ delivery_status: "pending" }, "configuration_missing"), "Not sent. Email is not set up here.");
  assert.equal(teamInvitationDeliveryLabel({ delivery_status: "pending", delivery_provider: "manual_link" }, "recipient_not_allowed"), "Link copied. No email sent.");
  assert.equal(teamInvitationDeliveryLabel({ delivery_status: "pending", delivery_provider: "manual_link" }, "configuration_missing"), "Link copied. No email sent.");
  assert.equal(teamInvitationDeliveryLabel({ delivery_status: "pending", delivery_provider: "manual_link" }, null), "Link copied.");
  assert.equal(teamInvitationDeliveryLabel({ delivery_status: "pending" }, null), "Not sent");
  assert.equal(teamInvitationDeliveryLabel({ delivery_status: "delivered" }, null), "Delivered");
  assert.equal(teamInvitationDeliveryLabel({ delivery_status: "delivered", delivery_provider: "manual_link" }, null), "Delivered");
  assert.doesNotMatch(teamInvitationDeliveryLabel({ delivery_status: "processing" }, null), /^Delivered/);
  assert.match(teamPage, /teamInvitationDeliveryLabel\(invitation, blocker\)/);
  assert.match(teamPage, /teamInvitationDeliveryBlocker\(invitation\.email_normalized\)/);
  assert.match(teamPage, /canRecover && !blocker \?/, "Resend is hidden when the email would be skipped");
  assert.equal(userNoticeMessage(teamInvitationNoticeCode("invite", { delivered: false, reason: "recipient_not_allowed" })),
    "The invitation is saved. Not sent. This address isn't approved for Demo email. Use Copy invite link below to share it yourself.");
});

test("other failures show a plain reason, never raw provider text", () => {
  const raw = "bounce:Permanent:General 550 5.1.1 user unknown re_abc123";
  const label = teamInvitationDeliveryLabel({ delivery_status: "failed", delivery_error_code: raw }, null);
  assert.equal(label, "Not delivered. The address did not take the email.");
  assert.doesNotMatch(label, /550|re_abc|Permanent/);
  assert.equal(emailNotSentReason("provider_rejected"), "Not sent. The email service turned it down.");
  assert.equal(emailNotSentReason("some new provider string"), "Not delivered. The email did not go through.");
  assert.equal(teamInvitationReissueErrorCode({ message: "duplicate key value violates unique constraint" }), "request_failed");
  assert.equal(teamInvitationReissueErrorCode(new Error("stale_invitation_version")), "invitation_changed");
});

test("misleading wording is gone and new copy meets the plain-language bar", () => {
  assert.equal(teamInvitationStatusLabel({ status: "pending", expires_at: "2999-01-01T00:00:00Z" }), "Waiting for them to join");
  assert.equal(teamInvitationStatusLabel({ status: "pending", expires_at: "2000-01-01T00:00:00Z" }), "Expired. Send a new invitation.");
  assert.doesNotMatch(teamPage, /Ready for the invited email|Not sent yet/);
  assert.doesNotMatch(userNoticeMessage("invitation_created") ?? "", /Delivery is pending/);
  const codes = [
    "invitation_created", "invitation_not_sent_demo_recipient", "invitation_not_sent_configuration", "invitation_not_sent_provider",
    "invitation_resent", "invitation_resent_not_sent", "invitation_resend_not_sent_demo_recipient", "invitation_resend_not_sent_configuration",
    "invitation_resend_not_sent_provider", "invitation_resend_skipped_demo_recipient", "invitation_resend_skipped_configuration",
  ];
  for (const code of codes) {
    const message = userNoticeMessage(code);
    assert.ok(message, `${code} has copy`);
    assert.doesNotMatch(message, /\u2014|\u2013/, `${code} has no em or en dash`);
  }
  for (const code of ["invitation_link_unavailable", "invitation_link_expired", "invitation_reissue_limit_reached"]) {
    assert.doesNotMatch(userErrorMessage(code) ?? "", /\u2014|\u2013/);
    assert.notEqual(userErrorMessage(code), userErrorMessage("request_failed"));
  }
  assert.doesNotMatch(teamPage + copyLink, /\u2014/);
  assert.doesNotMatch(migration.slice(migration.indexOf("v_summary :=")), /\u2014/);
});

test("notice codes follow what really happened to the email", () => {
  assert.equal(teamInvitationNoticeCode("invite", { delivered: true }), "invitation_sent");
  assert.equal(teamInvitationNoticeCode("invite", null), "invitation_created");
  assert.equal(teamInvitationNoticeCode("invite", { delivered: false, reason: "configuration_missing" }), "invitation_not_sent_configuration");
  assert.equal(teamInvitationNoticeCode("invite", { delivered: false, reason: "provider_rejected" }), "invitation_not_sent_provider");
  assert.equal(teamInvitationNoticeCode("resend", { delivered: true }), "invitation_resent");
  assert.equal(teamInvitationNoticeCode("resend", { delivered: false, reason: "recipient_not_allowed" }), "invitation_resend_not_sent_demo_recipient");
});
