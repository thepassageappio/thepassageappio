// Real PostgreSQL constraints and permissions; all fixture rows roll back.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { capturePolicySnapshot } from '../src/lib/authority/policy-snapshot.ts';

const cli = process.env.LOCAL_SUPABASE_CLI;
assert.ok(cli, 'Set LOCAL_SUPABASE_CLI to the installed Supabase executable.');
const organizationId = randomUUID();
const snapshot = capturePolicySnapshot({
  format: 'passage-policy-snapshot-v1', organizationId, policyVersion: 'fixture-1',
  effectiveFrom: '2026-09-11T00:00:00.000Z',
  sources: { platform: { key: 'test-catalog', version: '1' }, jurisdiction: { key: 'test-only', version: '1' }, institution: { key: 'test-policy', version: '1' } },
  content: { actions: { statements: { label: "Account holder's café statements", source: 'platform' } }, channels: ['phone', 'branch'], controls: {}, evidence: { identity: { required: true } } },
});
const sql = readFileSync('supabase/tests/policy_snapshot_contents.sql','utf8')
  .replaceAll('__POLICY_ORGANIZATION__',organizationId)
  .replaceAll('__POLICY_CANONICAL_TEXT__',snapshot.canonicalJson.replaceAll("'","''"))
  .replaceAll('__POLICY_SHA256__',snapshot.sha256);
const replay = process.argv.includes('--replay');
const query = replay ? `DO $replay$ BEGIN BEGIN
  IF EXISTS (SELECT 1 FROM authority_private.policy_snapshot_contents) THEN RAISE EXCEPTION 'replay requires empty new storage table'; END IF;
  EXECUTE 'DROP TABLE authority_private.policy_snapshot_contents';
  EXECUTE 'DROP FUNCTION authority_private.prevent_policy_snapshot_rewrite_v1()';
  EXECUTE 'DROP FUNCTION authority_private.policy_snapshot_envelope_valid_v1(text,uuid)';
  EXECUTE $ddl$${readFileSync('supabase/migrations/20260911072009_policy_snapshot_content_storage.sql','utf8')}$ddl$;
  EXECUTE $fixtures$${sql}$fixtures$;
  RAISE EXCEPTION USING ERRCODE='P9002', MESSAGE='policy_storage_replay_rollback';
  EXCEPTION WHEN SQLSTATE 'P9002' THEN IF SQLERRM <> 'policy_storage_replay_rollback' THEN RAISE; END IF;
  END; END $replay$;` : sql;
writeFileSync('work/policy-snapshot-storage-test.sql',query);
execFileSync(cli,['db','query','--db-url','postgresql://postgres:postgres@127.0.0.1:55322/postgres?sslmode=disable','-f','work/policy-snapshot-storage-test.sql'],{
  encoding:'utf8',stdio:'pipe',env:{...process.env,SUPABASE_TELEMETRY_DISABLED:'1'},
});
console.log('Policy storage verification passed: exact Node/PostgreSQL hash, envelope and tenant checks, browser denial, service insert/read, duplicate denial, update/delete/truncate protection, preserved bytes, rolled-back fixtures.');
if (replay) console.log('Clean recreation from the migration passed in an isolated transaction; the original local objects were restored by rollback.');
