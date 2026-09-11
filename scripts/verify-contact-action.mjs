import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as inquiry from '../src/lib/authority/commercial-inquiry.ts';
import { AuthorityError } from '../src/lib/authority/errors.ts';
let databaseError = null, calls = [], delivered = 0, deliveryFails = false;
const mocks = {
  '@/lib/authority/errors': { AuthorityError },
  'next/navigation': { redirect: url => { throw Object.assign(new Error('redirect'), { url }); } },
  '@/lib/authority/commercial-inquiry': inquiry,
  '@/lib/supabase/admin': { createAuthorityAdminClient: () => ({ rpc: async (name, args) => {
    calls.push({ name, args }); return { data: { reference_code: 'TEST-RECEIPT' }, error: databaseError };
  } }) },
  '@/lib/commercial/hubspot-inquiry': { deliverHubSpotInquiryOutbox: async () => { delivered++; if (deliveryFails) throw new Error('provider unavailable'); } },
};
const output = ts.transpileModule(readFileSync('src/app/commercial-actions.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const loadedModule = { exports: {} };
new Function('require', 'module', 'exports', output)(name => { assert.ok(mocks[name], name); return mocks[name]; }, loadedModule, loadedModule.exports);
const action = loadedModule.exports.createCommercialInquiryAction;
const key = '00000000-0000-4000-8000-000000000001';
function form(overrides = {}) {
  const data = new FormData();
  Object.entries({ idempotencyKey: key, contactConsent: 'on', inquiryType: 'demo', fullName: 'Demo Tester', email: 'test@example.invalid', organizationName: 'Fictional Team', organizationType: 'bank', jobRole: 'Operations', currentProcess: 'email_and_documents', annualVolumeBand: 'unknown', message: 'Fictional test', ...overrides }).forEach(([k,v]) => data.set(k,v));
  return data;
}
for (const overrides of [{ idempotencyKey: 'invalid' }, { contactConsent: '' }, { email: 'invalid' }]) {
  assert.ok((await action({ error: null }, form(overrides))).error);
  assert.equal(calls.length, 0); assert.equal(delivered, 0);
}
databaseError = { message: 'rate_limited private diagnostic' };
assert.match((await action({ error: null }, form())).error, /in an hour/);
databaseError = { message: 'private database detail' };
const failed = await action({ error: null }, form());
assert.match(failed.error, /could not confirm/); assert.ok(!failed.error.includes('private'));
assert.equal(delivered, 0);
databaseError = null; deliveryFails = true;
await assert.rejects(action(failed, form()), e => e.url === '/contact?sent=1&reference=TEST-RECEIPT');
assert.equal(delivered, 1);
assert.ok(calls.every(c => c.name === 'create_commercial_inquiry_v1' && c.args.p_idempotency_key === key && c.args.p_consent_version === inquiry.COMMERCIAL_CONSENT_VERSION));
const before = calls.length;
await assert.rejects(action({ error: null }, form({ website: 'bot' })), e => e.url === '/contact?sent=1');
assert.equal(calls.length, before);
console.log('PASS: 7 action scenarios; preflight denial, rate/generic recovery, retry key, success despite delivery failure, honeypot. RPC/provider mocked; no writes or sends.');
