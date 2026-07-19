#!/usr/bin/env node

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const BASE_SHA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const HEAD_SHA = '1111111111111111111111111111111111111111';
const BOT = 'passage-release-bot[bot]';

function sections({ ready = false } = {}) {
  const mark = ready ? 'x' : ' ';
  return `
## Product Manager Scope
- [${mark}] Product Manager scope completed
## UX Review
- [${mark}] UX review completed
- UX Status: ${ready ? 'N/A' : 'NOT RUN'}
## Development Handoff
- [${mark}] Development handoff completed
## Independent QA
- [${mark}] Independent QA handoff completed
- QA Status: ${ready ? 'PASS' : 'NOT RUN'}
## Dedicated Merge Review
- Dedicated Merge Review: REQUIRED CHECK
- Required check: \`Passage Review Agent / merge-review\`
- Expected source: Passage Release Reviewer GitHub App
- Findings and disposition: SEE CHECK RUN
## Production Review
- Production Review: NOT REQUESTED
- Required release check: \`Passage Production Review / release-readiness\`
- Release evidence: NONE
## Owner Gate
- Owner Gate: NOT REQUIRED
- Gate reason or recorded approval: NONE
## Loop Status
- Cycle: 1
## Deploy Decision
- [${mark}] Agent context updated
- Deploy Decision: NOT APPROVED
`;
}

function run(env = {}) {
  return spawnSync(process.execPath, ['scripts/check-release-train.js'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_ACTIONS: 'false',
      GITHUB_EVENT_PATH: '',
      GITHUB_EVENT_NAME: 'pull_request',
      PR_ACTION: 'opened',
      PR_AUTHOR: BOT,
      PR_DRAFT: 'true',
      PR_BASE_REF: 'main',
      PR_BASE_SHA: BASE_SHA,
      PR_HEAD_SHA: HEAD_SHA,
      PR_BODY: sections(),
      ...env,
    },
  });
}

function expectPass(name, env) {
  const result = run(env);
  assert.equal(result.status, 0, `${name}: ${result.stderr}`);
}

function expectFail(name, env) {
  const result = run(env);
  assert.notEqual(result.status, 0, `${name} unexpectedly passed`);
}

expectPass('draft structure', {});
expectPass('ready structure defers to required checks', { PR_BODY: sections({ ready: true }), PR_DRAFT: 'false' });
expectPass('merge group emits candidate contexts', { GITHUB_EVENT_NAME: 'merge_group', PR_BODY: '', PR_AUTHOR: '', PR_DRAFT: '', PR_BASE_REF: '', PR_BASE_SHA: '', PR_HEAD_SHA: '' });

const draft = sections();
const ready = sections({ ready: true });
expectFail('wrong author', { PR_AUTHOR: 'thepassageappio' });
expectFail('reopened PR', { PR_ACTION: 'reopened' });
expectFail('missing section', { PR_BODY: draft.replace('## Dedicated Merge Review', '## Review') });
expectFail('duplicate section', { PR_BODY: `${draft}\n## Dedicated Merge Review` });
expectFail('body asserted review pass', { PR_BODY: draft.replace('Dedicated Merge Review: REQUIRED CHECK', 'Dedicated Merge Review: PASS') });
expectFail('wrong required check name', { PR_BODY: draft.replace('Passage Review Agent / merge-review', 'Passage Review Agent / fake') });
expectFail('wrong expected source', { PR_BODY: draft.replace('Passage Release Reviewer GitHub App', 'GitHub Actions') });
expectFail('founder merge review returns', { PR_BODY: `${draft}\n- Founder Review: APPROVED` });
expectFail('human inference returns', { PR_BODY: `${draft}\n- human reviewer: somebody` });
expectFail('ready QA not passed', { PR_BODY: ready.replace('QA Status: PASS', 'QA Status: PARTIAL'), PR_DRAFT: 'false' });
expectFail('ready owner gate unresolved', { PR_BODY: ready.replace('Owner Gate: NOT REQUIRED', 'Owner Gate: REQUIRED'), PR_DRAFT: 'false' });
expectFail('draft deploy assertion', { PR_BODY: draft.replace('Deploy Decision: NOT APPROVED', 'Deploy Decision: APPROVED') });
expectFail('missing base SHA', { PR_BASE_SHA: '' });
expectFail('missing head SHA', { PR_HEAD_SHA: '' });

console.log('PASS dedicated-review governance rejects founder inference, body self-approval, stale structure, and wrong identity contracts');
