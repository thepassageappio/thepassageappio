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
- Author/Implementer: /root/engineering
- PR Author Identity: passage-author[bot]
## QA Handoff
- [x] Independent QA handoff completed
- QA Agent: /root/qa
- QA Status: PASS
## Independent Agent Review
- [x] Independent agent review completed
- Agent Reviewer: /root/reviewer
- Agent Reviewed Head: 1111111111111111111111111111111111111111
- Independent Agent Review Status: PASS
## Development Head / Release Authority
- [x] Development Head review completed
- Development Head: /root/development_head
- Development Head Reviewed Head: 1111111111111111111111111111111111111111
- Development Head Status: PASS
## Production Review
- Production Promotion: NO
- [ ] Production review completed
- Production Reviewer: UNASSIGNED
- Production Reviewed Head: UNASSIGNED
- Production Review Status: NOT RUN
## Loop Status
- Cycle: 1
## Deploy Decision
- [x] Agent context updated
- Deploy Agent: /root/deploy
- Merge Executor Identity: passage-release-automation
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
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_BODY: sections.replace('Development Head Status: PASS', 'Development Head Status: FAIL'),
});
assert.notEqual(result.status, 0, 'Expected failed Development Head review to fail.');

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_BODY: sections.replace('Development Head Reviewed Head: 1111111111111111111111111111111111111111', 'Development Head Reviewed Head: 2222222222222222222222222222222222222222'),
});
assert.notEqual(result.status, 0, 'Expected stale Development Head review to fail.');

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_BODY: sections.replace('Development Head: /root/development_head', 'Development Head: /root/reviewer'),
});
assert.notEqual(result.status, 0, 'Expected duplicate reviewer/Development Head roles to fail.');

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_BODY: sections.replace('Merge Executor Identity: passage-release-automation', 'Merge Executor Identity: passage-author[bot]'),
});
assert.notEqual(result.status, 0, 'Expected author-equals-merge-executor to fail.');

const retiredRoutineReview = sections.replace(
  /## Development Head \/ Release Authority[\s\S]*?(?=## Production Review)/,
  '## Founder Review\n- [x] Founder review requested\n- Founder Reviewer: owner\n- Founder Review: APPROVED\n',
);
result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_BODY: retiredRoutineReview,
});
assert.notEqual(result.status, 0, 'Expected the retired routine founder-review model to fail closed.');

const productionSections = sections
  .replace('Production Promotion: NO', 'Production Promotion: YES')
  .replace('[ ] Production review completed', '[x] Production review completed')
  .replace('Production Reviewer: UNASSIGNED', 'Production Reviewer: /root/production_reviewer')
  .replace('Production Reviewed Head: UNASSIGNED', 'Production Reviewed Head: 1111111111111111111111111111111111111111')
  .replace('Production Review Status: NOT RUN', 'Production Review Status: PASS');
result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_BODY: productionSections,
});
assert.equal(result.status, 0, result.stderr);

result = run('scripts/check-release-train.js', {
  GITHUB_EVENT_NAME: 'pull_request', PR_DRAFT: 'false', PR_HEAD_SHA: '1111111111111111111111111111111111111111', PR_BODY: productionSections.replace('Production Reviewed Head: 1111111111111111111111111111111111111111', 'Production Reviewed Head: 2222222222222222222222222222222222222222'),
});
assert.notEqual(result.status, 0, 'Expected stale Production Review to fail.');

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

const activeGovernanceFiles = [
  'AGENTS.md',
  'docs/release-train.md',
  'docs/product/passage-zero-cutover-plan.md',
  'docs/product/release-governance-and-plain-language-policy.md',
  'docs/product/operational-readiness-roadmap.md',
  '.github/pull_request_template.md',
  '.github/workflows/governance-integrity.yml',
  'scripts/check-release-train.js',
  'scripts/check-agent-context.js',
];
const retiredPatterns = [
  /^##\s+Founder Review\b/im,
  /Founder Review:\s*APPROVED/i,
  /founder review requested/i,
  /founder approval before merge/i,
  /founder Production authorization/i,
];
for (const file of activeGovernanceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const pattern of retiredPatterns) {
    assert.equal(pattern.test(source), false, `${file} retains retired routine-review language: ${pattern}`);
  }
}

const cutoverSource = fs.readFileSync('docs/product/passage-zero-cutover-plan.md', 'utf8');
const legacyCutoverMutation = cutoverSource.replace(
  'a distinct Development Head / Release Authority approves or rejects merge readiness for that same head',
  'Founder review requested; Founder Review: APPROVED before merge',
);
assert.notEqual(legacyCutoverMutation, cutoverSource, 'Cutover legacy-review mutation must alter the binding authority clause.');
assert.equal(
  retiredPatterns.some((pattern) => pattern.test(legacyCutoverMutation)),
  true,
  'The active-governance scan must reject legacy founder-review language in the cutover contract.',
);

console.log('PASS release governance requires distinct exact-head agent authorities and rejects the retired routine-review model, including cutover-contract regression');
