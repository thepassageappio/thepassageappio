import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runPolicySqlTest } from "./run-policy-sql-test.mjs";
import { capturePolicySource, resolvePolicySources } from '../src/lib/authority/policy-source-resolution.ts';
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
runPolicySqlTest(sql);
console.log("PASS: source storage constraints, tenant isolation, exact UTF-8 hashes, access denial, append-only protection, and rollback cleanup.");
