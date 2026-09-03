import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canCoordinateAuthorityRequests,
  institutionWorkspacePresentation,
  requestCoordinatorRecoveryMessage,
} from "./role-capabilities.ts";

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
