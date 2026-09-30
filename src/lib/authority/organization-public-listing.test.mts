import assert from "node:assert/strict";
import test from "node:test";
import {
  organizationPublicListingErrorCode,
  organizationPublicListingState,
} from "./organization-public-listing.ts";

test("missing listed_for_public_requests means the setting is not ready", () => {
  assert.deepEqual(organizationPublicListingState(null), { ready: false });
  assert.deepEqual(organizationPublicListingState(undefined), { ready: false });
  assert.deepEqual(organizationPublicListingState({ version: 1 }), { ready: false });
  assert.deepEqual(
    organizationPublicListingState({ version: 1, listed_for_public_requests: null }),
    { ready: false },
  );
});

test("boolean listed and positive version are ready", () => {
  assert.deepEqual(
    organizationPublicListingState({ version: 1, listed_for_public_requests: false }),
    { ready: true, listed: false, version: 1 },
  );
  assert.deepEqual(
    organizationPublicListingState({ version: 4, listed_for_public_requests: true }),
    { ready: true, listed: true, version: 4 },
  );
});

test("maps missing RPC and MFA/stale errors to face codes", () => {
  assert.equal(organizationPublicListingErrorCode({ code: "PGRST202", message: "Could not find the function" }), "try_again_later");
  assert.equal(organizationPublicListingErrorCode({ code: "42883", message: "function does not exist" }), "try_again_later");
  assert.equal(organizationPublicListingErrorCode({ message: "mfa_verification_required" }), "mfa_required");
  assert.equal(organizationPublicListingErrorCode({ message: "stale_organization_version" }), "organization_changed");
  assert.equal(organizationPublicListingErrorCode({ message: "member_management_not_allowed" }), "member_management_not_allowed");
  assert.equal(organizationPublicListingErrorCode({ message: "something else" }), "request_failed");
});
