#!/usr/bin/env node
const body = String(process.env.PR_BODY || '').replace(/\r/g, '');
const isPullRequest = String(process.env.GITHUB_EVENT_NAME || '') === 'pull_request';

function fail(message) {
  console.error('Release train check failed:');
  console.error(message);
  process.exit(1);
}

if (!isPullRequest) {
  console.log('Release train PR check skipped for non-PR event.');
  process.exit(0);
}

if (!body.trim()) fail('PR body is empty. Use the Passage release train template.');

const requiredSections = [
  '## Product Manager Scope',
  '## Development Handoff',
  '## QA Handoff',
  '## Loop Status',
  '## Deploy Decision',
];
for (const section of requiredSections) {
  if (!body.includes(section)) fail('Missing PR section: ' + section);
}

const requiredCheckedItems = [
  'Product Manager scope completed',
  'Development handoff completed',
  'QA handoff completed',
  'Agent context updated',
];
function escapeRegExp(value) {
  return value.replace(/[.*+?^()|[\]\\]/g, '\\$&').replace(/\$/g, '\\$');
}
for (const item of requiredCheckedItems) {
  const pattern = new RegExp('\\[[xX]\\]\\s*' + escapeRegExp(item));
  if (!pattern.test(body)) {
    fail('Before merge/sign-off, check this PR template item: ' + item);
  }
}

const qaPass = /QA Status:\s*PASS/i.test(body);
const deployApproved = /Deploy Decision:\s*APPROVED/i.test(body);
const cycleMatch = body.match(/Cycle:\s*([0-9]+)/i);
const cycle = cycleMatch ? Number(cycleMatch[1]) : NaN;

if (!Number.isFinite(cycle) || cycle < 1 || cycle > 3) {
  fail('Loop Status must include Cycle: 1, 2, or 3. After 3 failed cycles, split/de-scope/escalate instead of deploying.');
}

if (!qaPass) fail('QA Status must be PASS before merge/sign-off. Failed QA loops back to Product Manager first.');
if (!deployApproved) fail('Deploy Decision must be APPROVED before merge/sign-off.');

console.log('Release train check passed.');
