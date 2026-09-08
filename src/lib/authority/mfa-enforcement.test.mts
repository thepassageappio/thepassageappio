import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../../supabase/migrations/20260908030941_enforce_privileged_mfa.sql", import.meta.url),
  "utf8",
);
const accessSource = readFileSync(new URL("./access.ts", import.meta.url), "utf8");
const accountActions = readFileSync(new URL("../../app/account-actions.ts", import.meta.url), "utf8");
const billingActions = readFileSync(new URL("../../app/billing-actions.ts", import.meta.url), "utf8");
const mfaChallenge = readFileSync(new URL("../../components/app/MfaVerification.tsx", import.meta.url), "utf8");
const factorManager = readFileSync(new URL("../../components/app/MfaFactorManager.tsx", import.meta.url), "utf8");
const securityPage = readFileSync(new URL("../../app/app/security/page.tsx", import.meta.url), "utf8");
const appShell = readFileSync(new URL("../../components/app/AppShell.tsx", import.meta.url), "utf8");

function actionBody(source: string, name: string) {
  const start = source.indexOf(`export async function ${name}`);
  assert.notEqual(start, -1, `${name} must exist`);
  const next = source.indexOf("export async function ", start + 1);
  return source.slice(start, next === -1 ? source.length : next);
}

test("owner and admin RPC mutations require an aal2 JWT at the database boundary", () => {
  assert.match(migration, /v_role in \('owner', 'admin'\)/);
  assert.match(migration, /auth\.jwt\(\)->>'aal'/);
  assert.match(migration, /message = 'mfa_verification_required'/);

  for (const rpc of [
    "invite_member_v1",
    "change_member_role_v1",
    "revoke_member_v1",
    "revoke_member_invitation_v1",
    "create_authority_draft_v1",
    "activate_authority_request_v1",
    "record_operator_participant_delivery_v1",
    "reissue_participant_invitation_v1",
    "review_evidence_artifact_v1",
    "request_pilot_invoice_v1",
  ]) {
    const start = migration.indexOf(`create or replace function public.${rpc}`);
    assert.notEqual(start, -1, `${rpc} must be replaced by the MFA migration`);
    const next = migration.indexOf("create or replace function public.", start + 1);
    const body = migration.slice(start, next === -1 ? migration.length : next);
    assert.match(body, /require_privileged_mfa_v1\(p_organization_id\)/, `${rpc} must enforce MFA`);
  }
});

test("backup factors are usable for challenge and verified-factor deletion is not exposed", () => {
  assert.match(mfaChallenge, /existingFactors\.map/);
  assert.match(mfaChallenge, /setSelectedFactorId/);
  assert.match(factorManager, /friendlyName: `Backup authenticator/);
  assert.match(factorManager, /factor\.status === "unverified"/);
  assert.doesNotMatch(factorManager, /status === "verified"[\s\S]+unenroll/);
  assert.match(factorManager, /Verified factors cannot be removed from this screen/);
});

test("only MFA-enforced roles can open factor management", () => {
  assert.match(securityPage, /roleRequiresMfa\(access\?\.membership\?\.role\)/);
  assert.match(securityPage, /redirect\("\/app"\)/);
  assert.match(appShell, /roleRequiresMfa\(access\.membership\.role\)/);
});

test("every post-onboarding organization Server Action uses the MFA-verified mutation context", () => {
  assert.match(accessSource, /if \(access\.mfaGate !== "allow"\)/);
  assert.match(accessSource, /throw new Error\("mfa_verification_required"\)/);

  for (const action of [
    "inviteTeamMemberAction",
    "changeMemberRoleAction",
    "revokeMemberAction",
    "revokeMemberInvitationAction",
    "provisionHostedDemoRunAction",
    "createHostedAuthorityDraftAction",
    "activateHostedAuthorityRequestAction",
    "reissueParticipantInvitationAction",
    "reviewEvidenceArtifactAction",
    "recordInstitutionDecisionAction",
    "requestHostedAuthorityInformationAction",
    "recordAuthorityLifecycleAction",
  ]) {
    assert.match(
      actionBody(accountActions, action),
      /getAuthorityMutationAccessContext\(\)/,
      `${action} must enforce the mutation MFA gate`,
    );
  }

  assert.match(
    actionBody(billingActions, "createFoundingPilotInvoiceAction"),
    /getAuthorityMutationAccessContext\(\)/,
  );
});
