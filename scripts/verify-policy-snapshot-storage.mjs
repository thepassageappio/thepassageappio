// Real PostgreSQL constraints and permissions; all fixture rows roll back.
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runPolicySqlTest } from "./run-policy-sql-test.mjs";
import { capturePolicySnapshot } from '../src/lib/authority/policy-snapshot.ts';
import { compileCompatiblePolicyConfiguration } from '../src/lib/authority/policy-rule-compiler.ts';
import { capturePolicySource, resolvePolicySources } from '../src/lib/authority/policy-source-resolution.ts';

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
runPolicySqlTest(sql);
console.log("PASS: snapshot storage constraints, tenant isolation, exact UTF-8 hashes, access denial, append-only protection, and rollback cleanup.");
