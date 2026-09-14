import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { capturePolicySource, resolvePolicySources } from '../src/lib/authority/policy-source-resolution.ts';
const cli = process.env.LOCAL_SUPABASE_CLI;
assert.ok(cli, 'Set LOCAL_SUPABASE_CLI.');
const organizationId = randomUUID(), at = '2026-09-11T00:00:00.000Z';
const keys = { platform: randomUUID(), jurisdiction: randomUUID(), institution: randomUUID() };
const history = [], pins = {};
for (const kind of ['platform', 'jurisdiction', 'institution']) {
  const saved = capturePolicySource({ format: 'passage-policy-source-v1', kind, key: keys[kind], version: '1',
    organizationId: kind === 'institution' ? organizationId : null, jurisdiction: 'NY', authorityType: 'fixture',
    publishedAt: at, effectiveFrom: at, dependencies: { ...pins }, content: { label: "Account holder's café sample" } });
  history.push(saved);
  if (kind !== 'institution') pins[kind] = { key: keys[kind], version: '1', sha256: saved.sha256 };
}
assert.equal(resolvePolicySources(history, { organizationId, at, keys, jurisdiction: 'NY', authorityType: 'fixture' }).institution.source.organizationId, organizationId);
const sql = readFileSync('supabase/tests/policy_source_contents.sql', 'utf8')
  .replaceAll('__SOURCE_ORG__', organizationId)
  .replaceAll('__SOURCE_FIXTURES__', JSON.stringify(history).replaceAll("'", "''"));
const replay = process.argv.includes('--replay');
const query = replay ? `DO $replay$ BEGIN BEGIN
  IF EXISTS (SELECT 1 FROM authority_private.policy_source_contents) THEN RAISE EXCEPTION 'replay requires empty new source table'; END IF;
  EXECUTE 'DROP TABLE authority_private.policy_source_contents';
  EXECUTE 'DROP FUNCTION authority_private.prevent_policy_source_rewrite_v1()';
  EXECUTE 'DROP FUNCTION authority_private.policy_source_envelope_valid_v1(text)';
  EXECUTE $ddl$${readFileSync('supabase/migrations/20260911113719_policy_source_content_storage.sql', 'utf8')}$ddl$;
  EXECUTE $fixtures$${sql}$fixtures$;
  RAISE EXCEPTION USING ERRCODE='P9002', MESSAGE='source_replay_rollback';
  EXCEPTION WHEN SQLSTATE 'P9002' THEN IF SQLERRM <> 'source_replay_rollback' THEN RAISE; END IF;
  END; END $replay$;` : sql;
writeFileSync('work/policy-source-storage-test.sql', query);
execFileSync(cli, ['db', 'query', '--db-url', 'postgresql://postgres:postgres@127.0.0.1:55322/postgres?sslmode=disable', '-f', 'work/policy-source-storage-test.sql'],
  { encoding: 'utf8', stdio: 'pipe', env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: '1' } });
console.log('PASS: three source kinds, exact UTF-8 bytes/hash, generated metadata, tenant FK, null-owner uniqueness, version/time conflicts, browser denial, service insert/read, append-only owner protection and rollback cleanup.');
if (replay) console.log('PASS: isolated source-object migration recreation and restoration by rollback.');
