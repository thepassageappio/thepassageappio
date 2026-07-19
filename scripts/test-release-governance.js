#!/usr/bin/env node

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const sections = `
## Product Manager Scope
- [x] Product Manager scope completed
## UX Review
- [x] UX review completed
- UX Status: PASS
## Development Handoff
- [x] Development handoff completed
## QA Handoff
- [x] Independent QA handoff completed
- QA Status: PASS
## Independent Agent Review
- [x] Independent agent review completed
- Agent Reviewer: /root/reviewer
- Reviewed Head: 1111111111111111111111111111111111111111
- Independent Agent Review Status: PASS
## Founder Review
- [x] Founder review requested
- Founder Reviewer: @thepassageappio
- Founder Review: APPROVED
- Bootstrap Exception: NONE
## Production Authorization
- Founder Production Authorization: NOT APPROVED
- Protected environment or release evidence: NONE
## Loop Status
- Cycle: 1
## Deploy Decision
- [x] Agent context updated
- Deploy Decision: APPROVED
`;

function run(script, env) {
  return spawnSync(process.execPath, [script], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

let result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'true', PR_BODY: sections,
});
assert.equal(result.status, 0, result.stderr);

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_BODY: sections,
});
assert.equal(result.status, 0, result.stderr);

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_BODY: sections.replace('## Independent Agent Review', '## Review'),
});
assert.notEqual(result.status, 0);

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_BODY: sections.replace('Independent Agent Review Status: PASS', 'Independent Agent Review Status: FAIL'),
});
assert.notEqual(result.status, 0);

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_BODY: sections.replace('Founder Review: APPROVED', 'Founder Review: NOT APPROVED'),
});
assert.notEqual(result.status, 0);

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '2222222222222222222222222222222222222222', PR_BODY: sections,
});
assert.notEqual(result.status, 0, 'Expected stale or wrong reviewed head to fail.');

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
  result = run('scripts/check-persona-language.js', { CANDIDATE_ROOT: languageFixtureRoot });
  assert.notEqual(result.status, 0, `Expected persona scanner to reject ${badExpression}`);
}
fs.writeFileSync(path.join(languageFixtureRoot, 'app', 'page.tsx'), "export default function Page(){return <p>{humanTaskStatus(task.status)}</p>}");
result = run('scripts/check-persona-language.js', { CANDIDATE_ROOT: languageFixtureRoot });
assert.equal(result.status, 0, result.stderr);
fs.rmSync(languageFixtureRoot, { recursive: true, force: true });

console.log('PASS release governance distinguishes drafts, agent review, founder review, and Production authorization');
