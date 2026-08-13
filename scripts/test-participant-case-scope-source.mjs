import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8').toLowerCase();

const legacy = read('supabase/migrations/20260726040000_family_case_workflow_grant.sql');
const projection = read('supabase/migrations/20260810230000_participant_case_update_for_workflow.sql');
const reconciliation = read('supabase/migrations/20260811162128_participant_case_scope_source_reconciliation.sql');
const rollbackTest = read('supabase/tests/participant_case_scope_source_reconciliation.sql');

assert.match(legacy, /can_view_continuity_space\(w\.continuity_space_id\)/,
  'historical broad participant predicate must remain visible as defect evidence');
assert.match(reconciliation, /space_row\.owner_user_id = \(select auth\.uid\(\)\)/,
  'raw workflow authority must be limited to the continuity-space owner');

const privateBody = reconciliation.match(
  /create or replace function passage_private\.can_view_workflow_as_family[\s\S]*?\$\$;/,
)?.[0];
assert.ok(privateBody, 'owner-only private predicate replacement must exist');
assert.doesNotMatch(privateBody, /continuity_participants|can_view_continuity_space/,
  'raw workflow authority must not inherit participant visibility');
assert.match(privateBody, /security definer[\s\S]*set search_path = ''/,
  'private predicate must use SECURITY DEFINER with an empty search path');

for (const token of [
  "participant_row.user_id = (select auth.uid())",
  "participant_row.status = 'active'",
  "'updates' = any (participant_row.category_scope)",
  'workflow_row.id = p_workflow_id',
  "set search_path = ''",
]) {
  assert.ok(projection.includes(token), `bounded projection is missing ${token}`);
}

assert.match(reconciliation,
  /revoke execute on function public\.get_family_case_update_for_workflow\(uuid\)[\s\S]*from public, anon, service_role;/,
  'projection EXECUTE must be revoked from PUBLIC, anon, and service_role');
assert.match(reconciliation,
  /grant execute on function public\.get_family_case_update_for_workflow\(uuid\)[\s\S]*to authenticated;/,
  'projection EXECUTE must be granted only to authenticated');

for (const token of [
  'owner_matrix',
  'active_updates_participant_matrix',
  'revoked_matrix',
  'wrong_category_matrix',
  'wrong_user_matrix',
  'anon_matrix',
  'legacy_escape_proof',
  'rollback to savepoint legacy_predicate_probe',
  'rollback;',
  'public.tasks',
  'public.task_proofs',
  'public.task_proof_reviews',
  'public.workflow_events',
]) {
  assert.ok(rollbackTest.includes(token), `rollback authority test is missing ${token}`);
}

console.log('PASS participant case scope source guard (25 assertions)');
