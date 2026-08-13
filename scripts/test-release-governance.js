#!/usr/bin/env node

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const sections = `
## Product Manager Scope
- [x] Product Manager scope completed
- Material Product Direction or Scope Change: NO
- Canonical Roadmap Updated: NOT REQUIRED
- Consecutive Unresolved Branch-Divergence Reviews: 0
- Reconciliation Proposal: NOT REQUIRED
## UX Review
- [x] UX review completed
- UX Status: PASS
## Development Handoff
- [x] Development handoff completed
- Implementation Role: /root/engineer
- PR Author GitHub Identity: passage-author[bot]
## QA Handoff
- [x] Independent QA handoff completed
- QA Role: /root/qa
- QA Status: PASS
- QA Infrastructure Status: CLEAR
- QA Infrastructure Fix-it Item: NOT REQUIRED
- QA Infrastructure Owner Role: NOT REQUIRED
- QA Infrastructure Recovery Test: NOT REQUIRED
## Independent Agent Review
- [x] Independent agent review completed
- Agent Reviewer: /root/reviewer
- Reviewed Head: 1111111111111111111111111111111111111111
- Independent Agent Review Status: PASS
## Development Head / Release Authority
- [x] Development Head approval recorded
- Development Head Role: /root/development_head
- Development Head Reviewed Head: 1111111111111111111111111111111111111111
- Development Head Approval: APPROVED
- Merge Authority GitHub Identity: github-actions[bot]
## Production Authorization
- Owner Gate: NOT REQUIRED
- Production Reviewer Authorization: NOT REQUESTED
- Protected environment or release evidence: NONE
- Production Reviewer Role: /root/production_reviewer
## Platform Readiness Gate
- Current Certified Platform Readiness: 0
- Proposed Certified Platform Readiness: 0
- Domain Floors: NOT RUN
- Whole-Platform E2E: NOT REQUIRED
- Massive 75% Full-Platform QA: NOT REQUIRED
## Loop Status
- Cycle: 1
## Deploy Decision
- [x] Agent context updated
- Deploy Role: /root/deploy
- Deploy Decision: APPROVED
`;

function run(script, env) {
  return spawnSync(process.execPath, [script], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

let mergeIdentity = run('scripts/check-merge-identity.js', {
  PR_AUTHOR_LOGIN: 'passage-author[bot]', PR_MERGED_BY_LOGIN: 'github-actions[bot]',
});
assert.equal(mergeIdentity.status, 0, mergeIdentity.stderr);
mergeIdentity = run('scripts/check-merge-identity.js', {
  PR_AUTHOR_LOGIN: 'passage-author[bot]', PR_MERGED_BY_LOGIN: 'passage-author[bot]',
});
assert.notEqual(mergeIdentity.status, 0, 'Expected actual same-identity merge to fail.');

let result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'true', PR_BODY: sections,
});
assert.equal(result.status, 0, result.stderr);

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_AUTHOR_LOGIN: 'passage-author[bot]', PR_BODY: sections,
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
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_BODY: sections.replace('Development Head Approval: APPROVED', 'Development Head Approval: REQUIRED'),
});
assert.notEqual(result.status, 0);

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_BODY: sections.replace('Development Head Reviewed Head: 1111111111111111111111111111111111111111', 'Development Head Reviewed Head: 2222222222222222222222222222222222222222'),
});
assert.notEqual(result.status, 0);

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_BODY: sections.replace('Development Head Role: /root/development_head', 'Development Head Role: /root/reviewer'),
});
assert.notEqual(result.status, 0);

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_AUTHOR_LOGIN: 'passage-author[bot]', PR_BODY: sections.replace('Merge Authority GitHub Identity: github-actions[bot]', 'Merge Authority GitHub Identity: passage-author[bot]'),
});
assert.notEqual(result.status, 0, 'Expected author-equals-merger to fail.');

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_AUTHOR_LOGIN: 'passage-author[bot]', PR_BODY: sections.replace('Material Product Direction or Scope Change: NO', 'Material Product Direction or Scope Change: YES'),
});
assert.notEqual(result.status, 0, 'Expected material scope change without roadmap evidence to fail.');

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_AUTHOR_LOGIN: 'passage-author[bot]', PR_BODY: sections.replace('Consecutive Unresolved Branch-Divergence Reviews: 0', 'Consecutive Unresolved Branch-Divergence Reviews: 2'),
});
assert.notEqual(result.status, 0, 'Expected repeated divergence without reconciliation proposal to fail.');

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_AUTHOR_LOGIN: 'passage-author[bot]', PR_BODY: sections.replace('Proposed Certified Platform Readiness: 0', 'Proposed Certified Platform Readiness: 20'),
});
assert.notEqual(result.status, 0, 'Expected a multi-checkpoint readiness jump to fail.');

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_AUTHOR_LOGIN: 'passage-author[bot]', PR_BODY: sections.replace('Proposed Certified Platform Readiness: 0', 'Proposed Certified Platform Readiness: 10'),
});
assert.notEqual(result.status, 0, 'Expected readiness advance without domain-floor/E2E proof to fail.');

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_BODY: `${sections}\n## Founder Review\nFounder Review: APPROVED`,
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

console.log('PASS release governance enforces independent roles, author/merger separation, roadmap freshness, divergence forcing, QA infrastructure, and readiness checkpoints');
