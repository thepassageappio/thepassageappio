// Render the real server pages against isolated read fixtures. No network or mutations.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
let status, role = 'owner', participantRole = 'principal', hasDecision = false;
const date = '2026-09-10T12:00:00Z';
const record = () => ({ id: 'sample', organization_id: 'org', version: 4, status,
  reference_code: 'PA-SAMPLE', principal_name: 'Casey', representative_name: 'Parker',
  allowed_action_keys: ['receive_duplicate_statements'], valid_until: date,
  account_boundary: 'Sample account', purpose: 'financial_poa' });
const rows = (table) => { const fixtures = {
  authority_records: record(),
  authority_events: [{ event_id: 'event', sequence: 1, summary: 'Saved history entry', detail: 'Earlier information preserved', occurred_at: date }],
  authority_requirements: [{ id: 'requirement', title: 'Identity document', status: 'review_pending' }],
  authority_evidence_artifacts: [{ id: 'artifact', version: 1, requirement_id: 'requirement', review_status: 'pending', original_filename: 'sample.pdf', byte_size: 100 }],
  authority_information_requests: [{ id: 'question', message: 'Earlier question', requirement_key: 'identity_evidence' }],
  authority_institution_decisions: hasDecision ? { id: 'decision', outcome: 'accepted', reason: 'Original saved reason', receipt_code: 'PAR-SAMPLE', accepted_action_keys: ['receive_duplicate_statements'], limitations: [] } : null,
}; return Object.hasOwn(fixtures, table) ? fixtures[table] : []; };
const client = { from(table) {
  const query = { select: () => query, eq: () => query, order: () => query, maybeSingle: () => query,
    then: (done) => Promise.resolve({ data: rows(table), error: null }).then(done) };
  return query;
}, rpc: async () => ({ data: [], error: null }) };
const mocks = {
  './CancelRequestForm': { CancelRequestForm: () => null },
  'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
  'next/navigation': { notFound: () => { throw Error('not found'); } },
  '@/app/account-actions': new Proxy({}, { get: () => async function action() {} }),
  '@/app/participant-actions': new Proxy({}, { get: () => async function action() {} }),
  '@/lib/supabase/server': { createClient: async () => client },
  '@/lib/authority/access': { getAuthorityAccessContext: async () => ({ organization: { id: 'org' }, membership: { role }, user: { email: 'local@example.test' } }) },
  '@/lib/authority/demo-boundary': { mayProvisionDemoRun: () => false },
  '@/components/account/AccountFrame': { AccountFrame: ({ title, description, children }) => React.createElement('main', null, React.createElement('h1', null, title), React.createElement('p', null, description), children) },
  '@/lib/authority/participant-session': {
    getParticipantRequestContext: async () => ({ authorityRecordId: 'sample', recordVersion: 4, purpose: 'financial_poa', accountBoundary: 'Sample account', institutionName: 'Sample Bank', referenceCode: 'PA-SAMPLE', participantName: 'Casey', otherPersonName: 'Parker', status, participantRole, validUntil: date, allowedActionKeys: ['receive_duplicate_statements'], prohibitedActionKeys: [] }),
    getParticipantInformationRequest: async () => null,
  },
};
function load(file) {
  const output = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loadedModule = { exports: {} };
  new Function('require', 'module', 'exports', output)((name) => {
    if (mocks[name]) return mocks[name];
    if (name.endsWith('.css')) return {};
    if (name.startsWith('@/')) return load(resolve('src', name.slice(2) + '.ts'));
    if (name.startsWith('.')) return load(resolve(dirname(file), name));
    return require(name);
  }, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const institutionPage = load(resolve('src/app/app/requests/[id]/page.tsx')).default;
const participantPage = load(resolve('src/app/request/[id]/overview/page.tsx')).default;
const props = { params: Promise.resolve({ id: 'sample' }), searchParams: Promise.resolve({ notice: 'principal_confirm' }) };
let cases = 0;
for (status of ['declined', 'withdrawn', 'canceled', 'rejected', 'revoked', 'expired']) {
  for (role of ['owner', 'admin', 'staff', 'reviewer', 'auditor']) {
    for (hasDecision of [false, true]) {
      const html = renderToStaticMarkup(await institutionPage(props));
      assert.doesNotMatch(html, /Accept for this review|Request a correction|Waiting for the representative|Response needed|The decision form opens/);
      assert.match(html, /Saved history entry/);
      assert.match(html, /No response was saved/);
      assert.match(html, hasDecision ? /Original saved reason/ : /No institution decision is saved/);
      if (hasDecision) assert.match(html, /Open decision receipt/);
      cases++;
    }
  }
  for (participantRole of ['principal', 'representative']) {
    const html = renderToStaticMarkup(await participantPage(props));
    assert.doesNotMatch(html, /<form|Your confirmation was saved|Nothing changes until/);
    assert.match(html, /Requested actions/);
    cases++;
  }
}
status = 'evidence_required'; role = 'reviewer'; hasDecision = false;
assert.match(renderToStaticMarkup(await institutionPage(props)), /Accept for this review/);
role = 'auditor';
assert.doesNotMatch(renderToStaticMarkup(await institutionPage(props)), /Accept for this review/);
status = 'awaiting_principal'; participantRole = 'principal';
assert.match(renderToStaticMarkup(await participantPage(props)), /Review and decide/);
status = 'accepted'; participantRole = 'representative';
assert.match(renderToStaticMarkup(await participantPage(props)), /Withdraw from responsibility/);
console.log(`${cases + 4} rendered-page checks passed. Read fixtures only; not authenticated lifecycle verification.`);
