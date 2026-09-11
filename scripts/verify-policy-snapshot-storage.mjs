// Real PostgreSQL constraints and permissions; all fixture rows roll back.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { capturePolicySnapshot } from '../src/lib/authority/policy-snapshot.ts';
import { compileCompatiblePolicyConfiguration } from '../src/lib/authority/policy-rule-compiler.ts';
import { capturePolicySource, resolvePolicySources } from '../src/lib/authority/policy-source-resolution.ts';

const cli = process.env.LOCAL_SUPABASE_CLI;
assert.ok(cli, 'Set LOCAL_SUPABASE_CLI to the installed Supabase executable.');
const organizationId = randomUUID();
const catalog = {
  actions: [{ key: 'statements', label: "Account holder's café statements", meaning: 'Receive sample copies', category: 'information', accountTypes: ['sample'], riskTier: 'low', reviewGuidance: 'Review the sample.', enabled: true, unavailableReason: null, source: 'platform' }],
  evidence: [{ key: 'identity', label: 'Identity evidence', purpose: 'Identify the sample representative', collectionMethod: 'upload', retentionClass: 'fixture-retention', reviewerRole: 'reviewer', required: true, lockedRequired: true, source: 'jurisdiction' }],
  channels: [{ key: 'phone', label: 'Phone', enabled: true, accessLevel: 'view', separateIdentity: true, requiresMfa: false, requiresAcknowledgment: true, actionKeys: ['statements'], unavailableReason: null, source: 'platform' }],
  controls: [{ key: 'duration', kind: 'max_duration_days', value: 30, currency: null, windowHours: null, actionKeys: ['statements'], locked: false, source: 'platform' }],
};
const draft = { actionOverrides: [], evidenceOverrides: [], customActions: [], customEvidence: [], channelOverrides: [], controlOverrides: [{ key: 'duration', value: 14 }] };
const at = '2026-09-11T00:00:00.000Z';
const keys = { platform: 'test-catalog', jurisdiction: 'test-only', institution: 'test-policy' };
// Explicit fictional source split, not a production package merger or legal approval.
const sourceContent = {
  platform: { actions: catalog.actions, channels: catalog.channels, controls: catalog.controls },
  jurisdiction: { evidence: catalog.evidence, compatibility: {
    accountTypes: ['sample'], retentionClasses: ['fixture-retention'], currencies: ['USD'],
    actions: [{ key: 'statements', requiredEvidenceKeys: ['identity'], allowedChannelAccess: ['phone:view'], allowedControlKinds: ['max_duration_days'] }],
  } }, institution: draft,
};
const history = [], pins = {};
for (const kind of ['platform', 'jurisdiction', 'institution']) {
  const saved = capturePolicySource({
    format: 'passage-policy-source-v1', kind, key: keys[kind], version: '1',
    organizationId: kind === 'institution' ? organizationId : null,
    jurisdiction: 'NY', authorityType: 'fixture', publishedAt: at, effectiveFrom: at,
    dependencies: { ...pins }, content: sourceContent[kind],
  });
  history.push(saved);
  if (kind !== 'institution') pins[kind] = { key: keys[kind], version: '1', sha256: saved.sha256 };
}
const resolved = resolvePolicySources(history, { organizationId, jurisdiction: 'NY', authorityType: 'fixture', at, keys });
const configuration = compileCompatiblePolicyConfiguration(organizationId, {
  ...resolved.platform.source.content, evidence: resolved.jurisdiction.source.content.evidence,
}, resolved.institution.source.content, resolved.jurisdiction.source.content.compatibility);
const content = { configuration, sourceVersions: {
  platform: resolved.platform, jurisdiction: resolved.jurisdiction, institution: resolved.institution,
} };
const snapshot = capturePolicySnapshot({
  format: 'passage-policy-snapshot-v1', organizationId, policyVersion: 'fixture-1',
  effectiveFrom: '2026-09-11T00:00:00.000Z',
  sources: Object.fromEntries(Object.keys(keys).map(kind => [kind, { key: resolved[kind].source.key, version: resolved[kind].source.version }])),
  content,
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
console.log('Policy source resolution -> compilation -> storage verification passed: exact Node/PostgreSQL hash, envelope and tenant checks, browser denial, service insert/read, duplicate denial, update/delete/truncate protection, preserved bytes, rolled-back fixtures.');
if (replay) console.log('Clean recreation from the migration passed in an isolated transaction; the original local objects were restored by rollback.');
