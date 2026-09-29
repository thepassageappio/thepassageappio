import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");
const lockdown = read("supabase/migrations/20260929110000_security_definer_execute_lockdown.sql");
const participantDecision = read("supabase/migrations/20260929110100_participant_decision_server_only.sql");
const defaultPrivileges = read("supabase/migrations/20260929110200_function_default_privileges.sql");
const participantActions = read("src/app/participant-actions.ts");
const lockdownSqlTest = read("supabase/tests/security_definer_execute_lockdown.sql");

function sourceFiles(): { path: string; text: string }[] {
  return readdirSync(new URL("src/", root), { recursive: true, encoding: "utf8" })
    .filter((path) => /\.(ts|tsx|mts)$/.test(path) && !path.endsWith(".test.mts"))
    .map((path) => ({ path, text: read(`src/${path}`) }));
}

function actionBody(source: string, name: string) {
  const start = source.indexOf(`export async function ${name}`);
  assert.notEqual(start, -1, `${name} must exist`);
  const next = source.indexOf("export async function ", start + 1);
  return source.slice(start, next === -1 ? source.length : next);
}

test("participant decisions run through the service-role client only", () => {
  const body = actionBody(participantActions, "submitParticipantDecisionAction");
  assert.match(body, /const admin = createAuthorityAdminClient\(\);\s*(\/\/.*\n\s*)*const \{ data, error \} = await admin\.rpc\("submit_participant_decision_v1"/);
  assert.doesNotMatch(body, /createClient\(\)/, "the user client must not be used for participant decisions");

  for (const { path, text } of sourceFiles()) {
    if (path === "app/participant-actions.ts") continue;
    assert.doesNotMatch(text, /["']submit_participant_decision_v1["']/, `${path} must not call submit_participant_decision_v1`);
  }
});

test("locked RPCs have no client callers left in the app", () => {
  for (const { path, text } of sourceFiles()) {
    for (const name of [
      "create_authority_draft_v1",
      "assert_authority_record_operator",
      "require_privileged_mfa_v1",
    ]) {
      assert.doesNotMatch(text, new RegExp(`rpc\\(\\s*["']${name}["']`), `${path} must not call ${name}`);
    }
  }
});

test("lockdown migrations revoke client EXECUTE and keep the intended public RPCs", () => {
  for (const inner of [
    "create_authority_draft_v1",
    "assert_authority_record_operator",
    "change_member_role_v1",
    "invite_member_v1",
    "request_pilot_invoice_v1",
    "revoke_member_invitation_v1",
    "revoke_member_v1",
    "update_authority_draft_v1",
    "require_privileged_mfa_v1",
    "submit_participant_decision_v1",
  ]) {
    assert.match(
      lockdown,
      new RegExp(`revoke execute on function authority_private\\.${inner}\\([^;]*\\)\\s*from public, anon, authenticated, service_role;`),
      `${inner} must be revoked from client roles`,
    );
  }
  for (const wrapper of [
    "change_member_role_v1",
    "invite_member_v1",
    "request_pilot_invoice_v1",
    "revoke_member_invitation_v1",
    "revoke_member_v1",
    "update_authority_draft_v1",
    "submit_participant_decision_v1",
  ]) {
    assert.match(lockdown, new RegExp(`alter function public\\.${wrapper}\\([^;]*\\) security definer;`));
  }
  assert.match(participantDecision, /revoke execute on function public\.submit_participant_decision_v1\([^;]*\)\s*from public, anon, authenticated;/);
  assert.match(participantDecision, /APPLY ONLY AFTER the app deploy/);
  assert.match(defaultPrivileges, /alter default privileges for role postgres revoke execute on functions from public;/);

  for (const intended of [
    "exchange_participant_invitation_v1",
    "preview_participant_invitation_v1",
    "get_participant_session_context_v1",
    "verify_requester_email_v1",
    "search_institutions_v1",
  ]) {
    assert.doesNotMatch(lockdown + participantDecision, new RegExp(`revoke[^;]*${intended}`), `${intended} must stay public`);
  }
});

test("lockdown SQL gate test is present for local replay", () => {
  // CI workflow wiring needs workflow-scope on a follow-up push; keep the SQL file here.
  assert.match(lockdownSqlTest, /submit_participant_decision_v1/);
  assert.doesNotMatch(
    read(".github/workflows/verify.yml"),
    /security_definer_execute_lockdown/,
    "verify.yml must not list the suite until a workflow-scoped follow-up",
  );
});
