#!/usr/bin/env node

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const BASE_REF = 'main';
const BASE_SHA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const HEAD_SHA = '1111111111111111111111111111111111111111';
const BOT = 'passage-release-bot[bot]';

function attestation({ baseRef = 'UNASSIGNED', baseSha = 'UNASSIGNED', headSha = 'UNASSIGNED', status = 'NOT RUN' } = {}) {
  return `<!-- PASSAGE_REVIEW_ATTESTATION_START -->
Reviewed Base Ref: ${baseRef}
Reviewed Base SHA: ${baseSha}
Reviewed Head SHA: ${headSha}
Independent Agent Review Status: ${status}
<!-- PASSAGE_REVIEW_ATTESTATION_END -->`;
}

function sections({ ready = false, block = attestation() } = {}) {
  const mark = ready ? 'x' : ' ';
  return `
## Product Manager Scope
- [${mark}] Product Manager scope completed
## UX Review
- [${mark}] UX review completed
- UX Status: ${ready ? 'PASS' : 'NOT RUN'}
## Development Handoff
- [${mark}] Development handoff completed
## QA Handoff
- [${mark}] Independent QA handoff completed
- QA Status: ${ready ? 'PASS' : 'NOT RUN'}
## Independent Agent Review
- [${mark}] Independent agent review completed
- Agent Reviewer: /root/reviewer
${block}
- Findings and disposition: fixture
## Founder Review
- [${mark}] Founder review requested
- Founder Reviewer: @thepassageappio
- Founder Review: ${ready ? 'APPROVED' : 'NOT APPROVED'}
## Production Authorization
- Founder Production Authorization: NOT APPROVED
- Protected environment or release evidence: NONE
## Loop Status
- Cycle: 1
## Deploy Decision
- [${mark}] Agent context updated
- Deploy Decision: ${ready ? 'APPROVED' : 'NOT APPROVED'}
`;
}

function run(env) {
  return spawnSync(process.execPath, ['scripts/check-release-train.js'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_EVENT_NAME: 'pull_request',
      PR_ACTION: 'opened',
      PR_AUTHOR: BOT,
      PR_DRAFT: 'true',
      PR_BASE_REF: BASE_REF,
      PR_BASE_SHA: BASE_SHA,
      PR_HEAD_SHA: HEAD_SHA,
      ...env,
    },
  });
}

function expectFail(name, env) {
  const result = run(env);
  assert.notEqual(result.status, 0, `${name} unexpectedly passed`);
}

let result = run({ PR_BODY: sections() });
assert.equal(result.status, 0, result.stderr);

const boundDraft = sections({ block: attestation({ baseRef: BASE_REF, baseSha: BASE_SHA, headSha: HEAD_SHA }) });
result = run({ PR_BODY: boundDraft });
assert.equal(result.status, 0, result.stderr);

const readyBody = sections({ ready: true, block: attestation({ baseRef: BASE_REF, baseSha: BASE_SHA, headSha: HEAD_SHA, status: 'PASS' }) });
result = run({ PR_BODY: readyBody, PR_DRAFT: 'false' });
assert.equal(result.status, 0, result.stderr);

expectFail('missing start marker', { PR_BODY: boundDraft.replace('<!-- PASSAGE_REVIEW_ATTESTATION_START -->\n', '') });
expectFail('missing end marker', { PR_BODY: boundDraft.replace('\n<!-- PASSAGE_REVIEW_ATTESTATION_END -->', '') });
expectFail('duplicate block', { PR_BODY: `${boundDraft}\n${attestation()}` });
expectFail('duplicate start marker', { PR_BODY: boundDraft.replace('<!-- PASSAGE_REVIEW_ATTESTATION_START -->', '<!-- PASSAGE_REVIEW_ATTESTATION_START -->\n<!-- PASSAGE_REVIEW_ATTESTATION_START -->') });
expectFail('duplicate field outside block', { PR_BODY: `${boundDraft}\nReviewed Head SHA: ${HEAD_SHA}` });
expectFail('conflicting field outside block', { PR_BODY: `${boundDraft}\nReviewed Base SHA: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb` });
expectFail('duplicate key inside block', { PR_BODY: boundDraft.replace(`Reviewed Head SHA: ${HEAD_SHA}`, `Reviewed Head SHA: ${HEAD_SHA}\nReviewed Head SHA: ${HEAD_SHA}`) });
expectFail('missing key', { PR_BODY: boundDraft.replace(`Reviewed Base SHA: ${BASE_SHA}\n`, '') });
expectFail('unknown extra line', { PR_BODY: boundDraft.replace(`Reviewed Head SHA: ${HEAD_SHA}`, `Unexpected Field: value\nReviewed Head SHA: ${HEAD_SHA}`) });
expectFail('reordered lines', { PR_BODY: boundDraft.replace(`Reviewed Base Ref: ${BASE_REF}\nReviewed Base SHA: ${BASE_SHA}`, `Reviewed Base SHA: ${BASE_SHA}\nReviewed Base Ref: ${BASE_REF}`) });
expectFail('base ref mismatch', { PR_BODY: readyBody.replace('Reviewed Base Ref: main', 'Reviewed Base Ref: greenfield/passage-zero'), PR_DRAFT: 'false' });
expectFail('base SHA mismatch', { PR_BODY: readyBody.replace(BASE_SHA, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'), PR_DRAFT: 'false' });
expectFail('head SHA mismatch', { PR_BODY: readyBody.replace(HEAD_SHA, '2222222222222222222222222222222222222222'), PR_DRAFT: 'false' });
expectFail('ready NOT RUN', { PR_BODY: readyBody.replace('Independent Agent Review Status: PASS', 'Independent Agent Review Status: NOT RUN'), PR_DRAFT: 'false' });
expectFail('ready FAIL', { PR_BODY: readyBody.replace('Independent Agent Review Status: PASS', 'Independent Agent Review Status: FAIL'), PR_DRAFT: 'false' });
expectFail('draft concrete mismatch', { PR_BODY: boundDraft.replace(HEAD_SHA, '2222222222222222222222222222222222222222') });
expectFail('missing draft state', { PR_BODY: boundDraft, PR_DRAFT: '' });
expectFail('invalid draft state', { PR_BODY: boundDraft, PR_DRAFT: 'maybe' });
expectFail('missing base ref', { PR_BODY: boundDraft, PR_BASE_REF: '' });
expectFail('missing base SHA', { PR_BODY: boundDraft, PR_BASE_SHA: '' });
expectFail('missing head SHA', { PR_BODY: boundDraft, PR_HEAD_SHA: '' });
expectFail('reopened PR', { PR_BODY: boundDraft, PR_ACTION: 'reopened' });
expectFail('wrong author', { PR_BODY: boundDraft, PR_AUTHOR: 'thepassageappio' });
expectFail('bootstrap line', { PR_BODY: `${boundDraft}\n- Bootstrap Exception: AUTHORIZED FOR PR #25 ONLY`, PR_NUMBER: '25' });
expectFail('PR number cannot bypass stale head', { PR_BODY: readyBody.replace(HEAD_SHA, '2222222222222222222222222222222222222222'), PR_DRAFT: 'false', PR_NUMBER: '25' });

result = run({ PR_BODY: `${boundDraft}\nHistorical PR #25 is closed and grants no exception.`, PR_NUMBER: '25' });
assert.equal(result.status, 0, result.stderr);

const languageFixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'passage-language-'));
fs.mkdirSync(path.join(languageFixtureRoot, 'app'), { recursive: true });
for (const badExpression of [
  "task.status.replace('_', ' ')",
  'member.status.toUpperCase()',
  "proof.proof_type.replaceAll('_', ' ')",
  "workflow?.phase ?? 'Case work'",
  "task.automation_level.replace('_', ' ')",
  'task.audience',
]) {
  fs.writeFileSync(path.join(languageFixtureRoot, 'app', 'page.tsx'), `export default function Page(){return <p>{${badExpression}}</p>}`);
  result = spawnSync(process.execPath, ['scripts/check-persona-language.js'], { encoding: 'utf8', env: { ...process.env, CANDIDATE_ROOT: languageFixtureRoot } });
  assert.notEqual(result.status, 0, `Expected persona scanner to reject ${badExpression}`);
}
fs.writeFileSync(path.join(languageFixtureRoot, 'app', 'page.tsx'), "export default function Page(){return <p>{humanTaskStatus(task.status)}</p>}");
result = spawnSync(process.execPath, ['scripts/check-persona-language.js'], { encoding: 'utf8', env: { ...process.env, CANDIDATE_ROOT: languageFixtureRoot } });
assert.equal(result.status, 0, result.stderr);
fs.rmSync(languageFixtureRoot, { recursive: true, force: true });

console.log('PASS release governance rejects duplicate, stale, reopened, wrong-author, and bootstrap-bypass states');
