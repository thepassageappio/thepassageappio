import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assignableRolesFor,
  canManageBilling,
  canManageMembers,
  canManageTargetMember,
  canCoordinateAuthorityRequests,
  canRecordAuthorityDecision,
  canReviewAuthorityEvidence,
  canViewOrganizationAudit,
  capabilitiesForRole,
  hasOrganizationCapability,
  institutionWorkspacePresentation,
  invitableRolesFor,
  organizationCapabilities,
  organizationAccessActivityLabel,
  organizationAccessEventTypes,
  requestCoordinatorRecoveryMessage,
  roleCapabilityMap,
} from "./role-capabilities.ts";

test("the people page audit feed is limited to legible access lifecycle events", () => {
  assert.deepEqual(organizationAccessEventTypes, [
    "organization.created",
    "membership.activated",
    "membership.invited",
    "membership.role_changed",
    "membership.revoked",
    "membership.invitation_revoked",
  ]);
  assert.equal(organizationAccessActivityLabel("membership.invited"), "Team invitation created");
  assert.equal(organizationAccessActivityLabel("institution.decision_recorded"), "Organization access updated");
});

const migration = readFileSync(
  new URL("../../../supabase/migrations/20260903234403_reviewer_least_privilege.sql", import.meta.url),
  "utf8",
);

test("only organization coordinators can create or activate requests", () => {
  for (const role of ["owner", "admin", "staff"] as const) {
    assert.equal(canCoordinateAuthorityRequests(role), true);
  }
  for (const role of ["reviewer", "developer", "auditor"] as const) {
    assert.equal(canCoordinateAuthorityRequests(role), false);
  }
});

test("every organization role has an explicit, duplicate-free capability template", () => {
  assert.deepEqual(Object.keys(roleCapabilityMap).sort(), ["admin", "auditor", "developer", "owner", "reviewer", "staff"]);
  for (const capabilities of Object.values(roleCapabilityMap)) {
    assert.equal(new Set(capabilities).size, capabilities.length);
    assert.equal(capabilities.every((capability) => organizationCapabilities.includes(capability)), true);
  }
  assert.deepEqual(capabilitiesForRole("owner"), organizationCapabilities);
});

test("role templates preserve least privilege and separation of duties", () => {
  assert.equal(canManageMembers("owner"), true);
  assert.equal(canManageMembers("admin"), true);
  assert.equal(canManageMembers("staff"), false);
  assert.equal(canManageBilling("admin"), true);
  assert.equal(canManageBilling("auditor"), false);
  assert.equal(canReviewAuthorityEvidence("reviewer"), true);
  assert.equal(canRecordAuthorityDecision("reviewer"), true);
  assert.equal(hasOrganizationCapability("reviewer", "requests.create"), false);
  assert.equal(hasOrganizationCapability("developer", "requests.view"), false);
  assert.equal(hasOrganizationCapability("developer", "integrations.manage"), true);
  assert.equal(canViewOrganizationAudit("auditor"), true);
});

test("owner and administrator protections are explicit", () => {
  assert.deepEqual(assignableRolesFor("admin"), ["staff", "reviewer", "developer", "auditor"]);
  assert.deepEqual(invitableRolesFor("owner"), ["admin", "staff", "reviewer", "developer", "auditor"]);
  assert.equal(invitableRolesFor("reviewer").length, 0);
  assert.equal(canManageTargetMember({ actorRole: "owner", targetRole: "admin", targetIsSoleOwner: false }), true);
  assert.equal(canManageTargetMember({ actorRole: "owner", targetRole: "owner", targetIsSoleOwner: true }), false);
  assert.equal(canManageTargetMember({ actorRole: "admin", targetRole: "owner", targetIsSoleOwner: false }), false);
  assert.equal(canManageTargetMember({ actorRole: "admin", targetRole: "admin", targetIsSoleOwner: false }), false);
  assert.equal(canManageTargetMember({ actorRole: "admin", targetRole: "reviewer", targetIsSoleOwner: false }), true);
});

test("the reviewer workspace names the review job and recovery owner plainly", () => {
  assert.deepEqual(institutionWorkspacePresentation("reviewer"), {
    eyebrow: "Institution review queue",
    title: "Requests ready for your review",
    description: "Review submitted evidence, ask for a specific correction, and record your institution's decision.",
    emptyTitle: "Nothing needs your review",
    emptyDescription: "Requests appear here after a representative sends the completed information. An owner or operations staff member can confirm request setup.",
  });
  assert.equal(
    requestCoordinatorRecoveryMessage,
    "Only an owner, administrator, or operations staff member can start and send a request. Ask one of them to prepare the draft.",
  );
});

test("the database denies reviewer draft creation and activation before mutation", () => {
  assert.match(migration, /new\.status = 'draft'/);
  assert.match(migration, /old\.status = 'draft' and new\.status = 'awaiting_principal'/);
  assert.match(migration, /authority_request_creation_not_allowed/);
  assert.match(migration, /authority_request_activation_not_allowed/);
  assert.match(migration, /role = 'reviewer'/);
});
