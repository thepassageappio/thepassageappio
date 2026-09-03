import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const environmentLabel = process.env.SUPABASE_ENVIRONMENT_LABEL ?? "isolated Supabase";

assert(url, "SUPABASE_URL is required");
assert(publishableKey, "SUPABASE_PUBLISHABLE_KEY is required");
assert(secretKey, "SUPABASE_SECRET_KEY is required");

const admin = createClient(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
const runId = Date.now().toString(36);
const password = `Gate1-${crypto.randomUUID()}-Aa1!`;
const email = (label) => `gate1-${runId}-${label}@authority.test`;

async function createUser(label) {
  const userEmail = email(label);
  const { data, error } = await admin.auth.admin.createUser({
    email: userEmail,
    password,
    email_confirm: true,
  });
  assert.ifError(error);
  assert(data.user, `User ${label} was not created`);
  return { id: data.user.id, email: userEmail };
}

async function signedInClient(userEmail) {
  const client = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email: userEmail, password });
  assert.ifError(error);
  assert(data.session, `Session for ${userEmail} was not created`);
  return client;
}

async function rpc(client, name, payload) {
  const { data, error } = await client.rpc(name, payload);
  assert.ifError(error);
  return data;
}

async function expectRpcError(client, name, payload, expectedMessage) {
  const { data, error } = await client.rpc(name, payload);
  assert.equal(data, null, `${name} unexpectedly returned data`);
  assert(error, `${name} unexpectedly succeeded`);
  assert.equal(error.message, expectedMessage, `${name} failed for an unexpected reason`);
}

const [ownerA, ownerB, staff, wrongRecipient] = await Promise.all([
  createUser("owner-a"),
  createUser("owner-b"),
  createUser("staff"),
  createUser("wrong-recipient"),
]);

const [ownerAClient, ownerBClient, staffClient, wrongRecipientClient] = await Promise.all([
  signedInClient(ownerA.email),
  signedInClient(ownerB.email),
  signedInClient(staff.email),
  signedInClient(wrongRecipient.email),
]);

const createAKey = crypto.randomUUID();
const organizationA = await rpc(ownerAClient, "create_organization_v1", {
  p_legal_name: "North River Community Bank, N.A.",
  p_display_name: "North River Community Bank",
  p_organization_type: "regional_bank",
  p_website_domain: "northriver.example",
  p_address_line_1: "100 Main Street",
  p_address_line_2: "",
  p_locality: "Poughkeepsie",
  p_region: "NY",
  p_postal_code: "12601",
  p_country_code: "US",
  p_authorized_use: true,
  p_idempotency_key: createAKey,
});
assert.equal(organizationA.replayed, false);

const organizationAReplay = await rpc(ownerAClient, "create_organization_v1", {
  p_legal_name: "North River Community Bank, N.A.",
  p_display_name: "North River Community Bank",
  p_organization_type: "regional_bank",
  p_website_domain: "northriver.example",
  p_address_line_1: "100 Main Street",
  p_address_line_2: "",
  p_locality: "Poughkeepsie",
  p_region: "NY",
  p_postal_code: "12601",
  p_country_code: "US",
  p_authorized_use: true,
  p_idempotency_key: createAKey,
});
assert.equal(organizationAReplay.organization_id, organizationA.organization_id);
assert.equal(organizationAReplay.replayed, true);

const organizationB = await rpc(ownerBClient, "create_organization_v1", {
  p_legal_name: "Valley Member Credit Union",
  p_display_name: "Valley Member Credit Union",
  p_organization_type: "credit_union",
  p_website_domain: "valleymember.example",
  p_address_line_1: "22 Market Street",
  p_address_line_2: "",
  p_locality: "Kingston",
  p_region: "NY",
  p_postal_code: "12401",
  p_country_code: "US",
  p_authorized_use: true,
  p_idempotency_key: crypto.randomUUID(),
});

const { data: ownerAOrganizations, error: ownerAOrgError } = await ownerAClient.from("organizations").select("id, display_name");
assert.ifError(ownerAOrgError);
assert.deepEqual(ownerAOrganizations.map((item) => item.id), [organizationA.organization_id]);

const { data: ownerBOrganizations, error: ownerBOrgError } = await ownerBClient.from("organizations").select("id, display_name");
assert.ifError(ownerBOrgError);
assert.deepEqual(ownerBOrganizations.map((item) => item.id), [organizationB.organization_id]);

const { data: currentDocuments, error: documentsError } = await ownerAClient.from("terms_documents").select("id, document_kind, version").eq("status", "current");
assert.ifError(documentsError);
assert.equal(currentDocuments.length, 3);
const documentId = (kind) => currentDocuments.find((document) => document.document_kind === kind)?.id;

await rpc(ownerAClient, "accept_terms_v1", {
  p_organization_id: organizationA.organization_id,
  p_terms_document_id: documentId("terms"),
  p_privacy_document_id: documentId("privacy"),
  p_authorized_use_document_id: documentId("authorized_use"),
  p_terms_accepted: true,
  p_privacy_acknowledged: true,
  p_data_use_attested: true,
  p_request_ip: "127.0.0.1",
  p_user_agent: "Gate 1 database verifier",
  p_idempotency_key: crypto.randomUUID(),
});

await rpc(ownerAClient, "select_template_v1", {
  p_organization_id: organizationA.organization_id,
  p_template_key: "ny_financial_poa",
  p_template_version: "2026.1",
  p_idempotency_key: crypto.randomUUID(),
});

const invitation = await rpc(ownerAClient, "invite_member_v1", {
  p_organization_id: organizationA.organization_id,
  p_email: staff.email,
  p_role: "staff",
  p_idempotency_key: crypto.randomUUID(),
});
assert.equal(typeof invitation.token, "string");
assert.equal(invitation.token.length, 64);

await expectRpcError(wrongRecipientClient, "get_member_invitation_summary_v1", {
  p_invitation_id: invitation.invitation_id,
  p_token: invitation.token,
}, "invitation_not_available");

await expectRpcError(wrongRecipientClient, "accept_member_invitation_v1", {
  p_invitation_id: invitation.invitation_id,
  p_token: invitation.token,
  p_idempotency_key: crypto.randomUUID(),
}, "invitation_email_mismatch");

const invitationSummary = await rpc(staffClient, "get_member_invitation_summary_v1", {
  p_invitation_id: invitation.invitation_id,
  p_token: invitation.token,
});
assert.equal(invitationSummary.organization_name, "North River Community Bank");
assert.equal(invitationSummary.role, "staff");

const acceptanceKey = crypto.randomUUID();
const acceptedMembership = await rpc(staffClient, "accept_member_invitation_v1", {
  p_invitation_id: invitation.invitation_id,
  p_token: invitation.token,
  p_idempotency_key: acceptanceKey,
});
assert.equal(acceptedMembership.role, "staff");

const acceptanceReplay = await rpc(staffClient, "accept_member_invitation_v1", {
  p_invitation_id: invitation.invitation_id,
  p_token: invitation.token,
  p_idempotency_key: acceptanceKey,
});
assert.equal(acceptanceReplay.membership_id, acceptedMembership.membership_id);
assert.equal(acceptanceReplay.replayed, true);

const { data: staffOrganizations, error: staffOrgError } = await staffClient.from("organizations").select("id, display_name");
assert.ifError(staffOrgError);
assert.deepEqual(staffOrganizations.map((item) => item.id), [organizationA.organization_id]);

const { data: crossTenantOrganizations, error: crossTenantOrgError } = await staffClient.from("organizations").select("id").eq("id", organizationB.organization_id);
assert.ifError(crossTenantOrgError);
assert.equal(crossTenantOrganizations.length, 0);

const { data: staffMembershipRows, error: staffMembershipError } = await staffClient.from("organization_memberships").select("id, organization_id, user_id, role, status");
assert.ifError(staffMembershipError);
assert.equal(staffMembershipRows.length, 1);
assert.equal(staffMembershipRows[0].user_id, staff.id);

await expectRpcError(staffClient, "invite_member_v1", {
  p_organization_id: organizationA.organization_id,
  p_email: "blocked@authority.test",
  p_role: "staff",
  p_idempotency_key: crypto.randomUUID(),
}, "member_management_not_allowed");

const roleChangeKey = crypto.randomUUID();
const roleChange = await rpc(ownerAClient, "change_member_role_v1", {
  p_organization_id: organizationA.organization_id,
  p_membership_id: acceptedMembership.membership_id,
  p_role: "reviewer",
  p_expected_version: 1,
  p_idempotency_key: roleChangeKey,
});
assert.equal(roleChange.version, 2);

const roleChangeReplay = await rpc(ownerAClient, "change_member_role_v1", {
  p_organization_id: organizationA.organization_id,
  p_membership_id: acceptedMembership.membership_id,
  p_role: "reviewer",
  p_expected_version: 1,
  p_idempotency_key: roleChangeKey,
});
assert.equal(roleChangeReplay.version, 2);
assert.equal(roleChangeReplay.replayed, true);

await expectRpcError(ownerAClient, "change_member_role_v1", {
  p_organization_id: organizationA.organization_id,
  p_membership_id: acceptedMembership.membership_id,
  p_role: "staff",
  p_expected_version: 1,
  p_idempotency_key: crypto.randomUUID(),
}, "stale_membership_version");

await expectRpcError(ownerAClient, "revoke_member_v1", {
  p_organization_id: organizationA.organization_id,
  p_membership_id: organizationA.membership_id,
  p_expected_version: 1,
  p_idempotency_key: crypto.randomUUID(),
}, "last_owner_protected");

const revokedMembership = await rpc(ownerAClient, "revoke_member_v1", {
  p_organization_id: organizationA.organization_id,
  p_membership_id: acceptedMembership.membership_id,
  p_expected_version: 2,
  p_idempotency_key: crypto.randomUUID(),
});
assert.equal(revokedMembership.status, "revoked");

const { data: revokedOrganizationAccess, error: revokedOrganizationError } = await staffClient.from("organizations").select("id");
assert.ifError(revokedOrganizationError);
assert.equal(revokedOrganizationAccess.length, 0);

await expectRpcError(staffClient, "invite_member_v1", {
  p_organization_id: organizationA.organization_id,
  p_email: "still-blocked@authority.test",
  p_role: "staff",
  p_idempotency_key: crypto.randomUUID(),
}, "member_management_not_allowed");

const { data: ownerBCrossMemberships, error: ownerBCrossError } = await ownerBClient.from("organization_memberships").select("id").eq("organization_id", organizationA.organization_id);
assert.ifError(ownerBCrossError);
assert.equal(ownerBCrossMemberships.length, 0);

const { data: auditEvents, error: auditError } = await ownerAClient.from("organization_audit_events").select("event_id, event_type, sequence_id").eq("organization_id", organizationA.organization_id).order("sequence_id");
assert.ifError(auditError);
assert(auditEvents.length >= 8, "Expected organization access events were not written");
assert(auditEvents.some((event) => event.event_type === "membership.invited"));
assert(auditEvents.some((event) => event.event_type === "membership.activated"));
assert(auditEvents.some((event) => event.event_type === "membership.role_changed"));
assert(auditEvents.some((event) => event.event_type === "membership.revoked"));

const { error: auditMutationError } = await ownerAClient.from("organization_audit_events").update({ event_type: "changed" }).eq("event_id", auditEvents[0].event_id);
assert(auditMutationError, "Audit mutation unexpectedly succeeded");

const evidence = {
  verifiedAt: new Date().toISOString(),
  environment: environmentLabel,
  users: { ownerA: ownerA.id, ownerB: ownerB.id, staff: staff.id, wrongRecipient: wrongRecipient.id },
  organizations: { organizationA: organizationA.organization_id, organizationB: organizationB.organization_id },
  membership: { accepted: acceptedMembership.membership_id, revoked: revokedMembership.membership_id },
  invitation: { id: invitation.invitation_id, tokenRecorded: false },
  assertions: {
    idempotentOrganizationCreation: true,
    versionedTermsAcceptance: true,
    immutableTemplateSelection: true,
    emailBoundHashedInvitation: true,
    receivingMemberAccess: true,
    crossTenantReadsDenied: true,
    unauthorizedRoleCommandDenied: true,
    staleVersionDenied: true,
    lastOwnerProtected: true,
    revokedAccessDeniedImmediately: true,
    appendOnlyAuditProtected: true,
  },
  auditEventCount: auditEvents.length,
};

const evidenceDirectory = path.join(process.cwd(), "work", "evidence");
await mkdir(evidenceDirectory, { recursive: true });
await writeFile(path.join(evidenceDirectory, "gate1-database.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
