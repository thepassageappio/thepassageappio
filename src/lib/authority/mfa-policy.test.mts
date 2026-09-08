import assert from "node:assert/strict";
import test from "node:test";
import { mfaGateDecision, roleRequiresMfa } from "./mfa-policy.ts";

const unenrolled = { hasVerifiedTotp: false, currentLevel: "aal1", nextLevel: "aal1" } as const;
const enrolledButUnchallenged = { hasVerifiedTotp: true, currentLevel: "aal1", nextLevel: "aal2" } as const;
const fullyVerified = { hasVerifiedTotp: true, currentLevel: "aal2", nextLevel: "aal2" } as const;

test("only owner and admin require MFA", () => {
  assert.equal(roleRequiresMfa("owner"), true);
  assert.equal(roleRequiresMfa("admin"), true);
  assert.equal(roleRequiresMfa("staff"), false);
  assert.equal(roleRequiresMfa("reviewer"), false);
  assert.equal(roleRequiresMfa("developer"), false);
  assert.equal(roleRequiresMfa("auditor"), false);
  assert.equal(roleRequiresMfa(null), false);
  assert.equal(roleRequiresMfa(undefined), false);
});

test("non-privileged roles are always allowed regardless of MFA state", () => {
  assert.equal(mfaGateDecision("staff", unenrolled), "allow");
  assert.equal(mfaGateDecision("reviewer", unenrolled), "allow");
  assert.equal(mfaGateDecision("auditor", enrolledButUnchallenged), "allow");
});

test("owner/admin without a verified factor must enroll", () => {
  assert.equal(mfaGateDecision("owner", unenrolled), "require_enrollment");
  assert.equal(mfaGateDecision("admin", unenrolled), "require_enrollment");
});

test("owner/admin with a verified factor but an aal1 session must re-challenge", () => {
  assert.equal(mfaGateDecision("owner", enrolledButUnchallenged), "require_challenge");
  assert.equal(mfaGateDecision("admin", enrolledButUnchallenged), "require_challenge");
});

test("owner/admin who completed the aal2 challenge this session is allowed", () => {
  assert.equal(mfaGateDecision("owner", fullyVerified), "allow");
  assert.equal(mfaGateDecision("admin", fullyVerified), "allow");
});
