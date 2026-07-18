#!/usr/bin/env node

const body = String(process.env.PR_BODY || '').replace(/\r/g, '');
const isPullRequest = String(process.env.GITHUB_EVENT_NAME || '') === 'pull_request'
  || String(process.env.GITHUB_EVENT_NAME || '') === 'pull_request_review';
const draftState = String(process.env.PR_DRAFT || '').toLowerCase();
// The legacy main workflow does not pass PR_DRAFT. Treat that bootstrap-only
// invocation as structure-only; the replacement workflow always passes true/false.
const isDraft = draftState === '' || draftState === 'true';

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
  '## UX Review',
  '## Development Handoff',
  '## QA Handoff',
  '## Human Review',
  '## Loop Status',
  '## Deploy Decision',
];

for (const section of requiredSections) {
  if (!body.includes(section)) fail(`Missing PR section: ${section}`);
}

if (isDraft) {
  console.log('Release train structure passed for draft PR; completion gates remain intentionally open.');
  process.exit(0);
}

const requiredCheckedItems = [
  'Product Manager scope completed',
  'UX review completed',
  'Development handoff completed',
  'Independent QA handoff completed',
  'Agent context updated',
  'Separate human review requested',
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^()|[\]\\]/g, '\\$&').replace(/\$/g, '\\$');
}

for (const item of requiredCheckedItems) {
  const pattern = new RegExp(`\\[[xX]\\]\\s*${escapeRegExp(item)}`);
  if (!pattern.test(body)) fail(`Before ready-for-review or merge, check this item: ${item}`);
}

if (!/UX Status:\s*(PASS|N\/A)/i.test(body)) fail('UX Status must be PASS or N/A.');
if (!/QA Status:\s*PASS/i.test(body)) fail('QA Status must be PASS. Failed QA returns to Product Manager.');
const reviewerMatch = body.match(/Human Reviewer:\s*@?([A-Za-z0-9-]+)/i);
if (!reviewerMatch || /^(UNASSIGNED|TBD|NONE)$/i.test(reviewerMatch[1])) fail('Name the separate human reviewer.');
if (!/Deploy Decision:\s*APPROVED/i.test(body)) fail('Deploy Decision must be APPROVED.');

const cycleMatch = body.match(/Cycle:\s*([0-9]+)/i);
const cycle = cycleMatch ? Number(cycleMatch[1]) : NaN;
if (!Number.isFinite(cycle) || cycle < 1 || cycle > 3) {
  fail('Loop Status must include Cycle: 1, 2, or 3. After cycle 3, split, de-scope, or escalate.');
}

console.log('Release train completion gate passed.');
