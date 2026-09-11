import assert from "node:assert/strict";
import test from "node:test";
import { parseMfaTeamStatus, mfaEnrollmentLabel } from "./mfa-team-status.ts";

const member = { membership_id: "member-1", display_name: null, email: "owner@local.authority.test", role: "owner", verified_totp_count: 0 };
const inventory = { captured_at: "2026-09-10T00:00:00Z", members: [member] };

test("enrollment gaps remain distinct from backup enrollment", () => {
  assert.equal(mfaEnrollmentLabel(0), "Enrollment needed");
  assert.equal(mfaEnrollmentLabel(1), "Backup authenticator needed");
  assert.equal(mfaEnrollmentLabel(2), "Backup authenticator enrolled");
  assert.equal(parseMfaTeamStatus(inventory)?.members[0].name, member.email);
});

test("missing or malformed inventory is unavailable, never an empty success", () => {
  for (const value of [null, {}, [], { ...inventory, captured_at: "invalid" }, { ...inventory, members: [] }, { ...inventory, members: [member, member] }]) {
    assert.equal(parseMfaTeamStatus(value), null);
  }
  for (const patch of [{ verified_totp_count: -1 }, { verified_totp_count: 1.5 }, { verified_totp_count: "2" }, { verified_totp_count: NaN }, { role: "staff" }, { email: "" }, { display_name: undefined }]) {
    assert.equal(parseMfaTeamStatus({ ...inventory, members: [{ ...member, ...patch }] }), null);
  }
});

test("parser drops unexpected fields rather than passing auth internals to rendering", () => {
  const parsed = parseMfaTeamStatus({ ...inventory, members: [{ ...member, role: "admin", display_name: " Admin ", verified_totp_count: 2, secret: "must-not-leave-boundary" }] });
  assert.deepEqual(parsed?.members[0], { id: "member-1", name: "Admin", email: member.email, role: "admin", verifiedCount: 2 });
});
