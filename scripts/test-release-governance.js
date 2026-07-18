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
## Human Review
- [x] Separate human review requested
- Human Reviewer: @reviewer
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
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_BODY: sections,
});
assert.equal(result.status, 0, result.stderr);

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_BODY: sections.replace('## Human Review', '## Review'),
});
assert.notEqual(result.status, 0);

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_BODY: sections.replace('@reviewer', 'UNASSIGNED'),
});
assert.notEqual(result.status, 0);

result = run('scripts/check-independent-review.js', {
  PR_DRAFT: 'false', PR_AUTHOR: 'author', APPROVING_REVIEWERS: 'author,passage-bot[bot]',
});
assert.notEqual(result.status, 0);

result = run('scripts/check-independent-review.js', {
  PR_DRAFT: 'false', PR_AUTHOR: 'author', APPROVING_REVIEWERS: 'human-reviewer',
});
assert.equal(result.status, 0, result.stderr);

result = run('scripts/check-independent-review.js', {
  PR_DRAFT: 'false', PR_AUTHOR: 'author', APPROVING_REVIEWERS: 'automation-user', APPROVING_REVIEWER_TYPES: 'automation-user:Bot',
});
assert.notEqual(result.status, 0);

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

console.log('PASS release governance distinguishes drafts, completed handoffs, and separate human approval');
