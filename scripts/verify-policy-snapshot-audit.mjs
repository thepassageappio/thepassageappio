// Exercise the aggregate audit with read-only VALUES fixtures; no database writes.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const cli = process.env.LOCAL_SUPABASE_CLI;
assert.ok(cli, 'Set LOCAL_SUPABASE_CLI to the installed Supabase executable.');
const fixture = `with fixture_records(id,organization_id,template_key,template_version,activated_at) as (
  values ('a','org','ny_financial_poa','2026.1','2026-09-11'::date),
    ('b','org','ny_financial_poa','2026.1',null), ('c','org','ny_financial_poa','2026.1',null),
    ('d','org','ny_financial_poa','2026.1',null), ('e','org','ny_financial_poa','2026.1',null),
    ('f','org','ny_financial_poa','2026.1',null), ('g','org','ny_financial_poa','2026.1',null)
), fixture_events(event_id,authority_record_id,organization_id,event_type,payload) as (
  values
    ('1','a','org','authority.draft_created','{"template_key":"ny_financial_poa","template_version":"2026.1"}'::jsonb),
    ('2','c','org','authority.draft_created','{"template_key":"ny_financial_poa","template_version":"2026.1","policy_snapshot":{}}'::jsonb),
    ('3','c','org','authority.draft_created','{"template_key":"ny_financial_poa","template_version":"2026.1"}'::jsonb),
    ('4','d','org','authority.draft_created','{}'::jsonb),
    ('5','e','org','authority.draft_created','{"template_key":"ny_financial_poa","template_version":"older"}'::jsonb),
    ('6','f','other-org','authority.draft_created','{"template_key":"ny_financial_poa","template_version":"2026.1"}'::jsonb),
    ('7','g','org','authority.draft_created','{"template_key":"ny_financial_poa","template_version":"2026.1","policy_snapshot":"not an object"}'::jsonb),
    ('8','b','org','authority.other','{}'::jsonb)
)`;
const original = readFileSync('supabase/queries/policy_snapshot_readiness.sql', 'utf8');
const query = original.replace('with per_record as', `${fixture}, per_record as`)
  .replaceAll('public.authority_records', 'fixture_records').replaceAll('public.authority_events', 'fixture_events');
function run(sql) {
  writeFileSync('work/policy-snapshot-audit-fixture.sql', sql);
  const output = execFileSync(cli, ['db', 'query', '--db-url',
    'postgresql://postgres:postgres@127.0.0.1:55322/postgres?sslmode=disable',
    '-f', 'work/policy-snapshot-audit-fixture.sql'], {
    encoding: 'utf8', env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: '1' },
  });
  return JSON.parse(output.slice(output.indexOf('{'))).rows;
}
const [row] = run(query);
assert.equal(row.records, 7);
assert.equal(row.activated_records, 1);
assert.equal(row.records_without_creation_event, 2);
assert.equal(row.records_with_multiple_creation_events, 1);
assert.equal(Number(row.creation_events_missing_identifiers), 1);
assert.equal(Number(row.creation_events_with_different_identifiers), 2);
assert.equal(Number(row.creation_events_with_snapshot_object), 1);
assert.deepEqual(run(query.replace('from fixture_records r', 'from (select * from fixture_records where false) r')), []);
console.log('PASS: policy audit distinguishes missing, duplicate, mismatched and cross-organization events, object presence and empty datasets; all fixtures were read-only.');
