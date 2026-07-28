#!/usr/bin/env node

const body = String(process.env.PR_BODY || '').replace(/\r/g, '');
const isPullRequest = String(process.env.GITHUB_EVENT_NAME || '') === 'pull_request'
  || String(process.env.GITHUB_EVENT_NAME || '') === 'pull_request_review';
const draftState = String(process.env.PR_DRAFT || '').toLowerCase();
// The legacy main workflow does not pass PR_DRAFT. Treat that bootstrap-only
// invocation as structure-only; replacement workflows always pass true/false.
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
  '## Independent Agent Review',
  '## Development Head / Release Authority',
  '## Production Review',
  '## Loop Status',
  '## Deploy Decision',
];

for (const section of requiredSections) {
  if (!body.includes(section)) fail(`Missing PR section: ${section}`);
}
if (/^##\s+(Founder|Human|Owner)\s+Review\b/im.test(body) || /Founder Review:/i.test(body)) {
  fail('Routine founder/human/owner review is retired. Use Development Head and Production Review.');
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
  'Independent agent review completed',
  'Development Head review completed',
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
if (!/Independent Agent Review Status:\s*PASS/i.test(body)) fail('Independent Agent Review Status must be PASS.');
const roleValue = (label) => String((body.match(new RegExp(`${label}:\\s*([^\\r\\n]+)`, 'i')) || [])[1] || '').trim();
const isMissingRole = (value) => !value || /^(UNASSIGNED|TBD|NONE|NOT RUN)$/i.test(value);
const author = roleValue('Author/Implementer');
const qaAgent = roleValue('QA Agent');
const agentReviewer = roleValue('Agent Reviewer');
const developmentHead = roleValue('Development Head');
const deployAgent = roleValue('Deploy Agent');
for (const [label, value] of [
  ['Author/Implementer', author],
  ['QA Agent', qaAgent],
  ['Agent Reviewer', agentReviewer],
  ['Development Head', developmentHead],
  ['Deploy Agent', deployAgent],
]) {
  if (isMissingRole(value)) fail(`Name the distinct ${label}.`);
}
const normalizedRoles = [author, qaAgent, agentReviewer, developmentHead, deployAgent]
  .map((value) => value.toLowerCase());
if (new Set(normalizedRoles).size !== normalizedRoles.length) {
  fail('Author, QA, Independent Agent Reviewer, Development Head, and Deploy must be distinct role instances.');
}
const reviewedHead = String((body.match(/Agent Reviewed Head:\s*([0-9a-f]{40})\b/i) || [])[1] || '').toLowerCase();
const actualHead = String(process.env.PR_HEAD_SHA || '').toLowerCase();
if (!actualHead || reviewedHead !== actualHead) fail('Independent Agent Review must match the current PR head SHA.');
if (!/Development Head Status:\s*PASS/i.test(body)) fail('Development Head Status must be PASS.');
const developmentHeadReviewedHead = String((body.match(/Development Head Reviewed Head:\s*([0-9a-f]{40})\b/i) || [])[1] || '').toLowerCase();
if (!actualHead || developmentHeadReviewedHead !== actualHead) fail('Development Head approval must match the current PR head SHA.');
const prAuthorIdentity = roleValue('PR Author Identity');
const mergeExecutorIdentity = roleValue('Merge Executor Identity');
if (isMissingRole(prAuthorIdentity) || isMissingRole(mergeExecutorIdentity)) {
  fail('Record both PR Author Identity and Merge Executor Identity.');
}
if (prAuthorIdentity.toLowerCase() === mergeExecutorIdentity.toLowerCase()) {
  fail('The PR author identity must not execute its own merge.');
}
if (!/Deploy Decision:\s*APPROVED/i.test(body)) fail('Deploy Decision must be APPROVED.');

const productionPromotion = roleValue('Production Promotion').toUpperCase();
if (!['YES', 'NO'].includes(productionPromotion)) fail('Production Promotion must be YES or NO.');
if (productionPromotion === 'YES') {
  if (!/\[[xX]\]\s*Production review completed/.test(body)) fail('Production promotion requires completed Production Review.');
  if (!/Production Review Status:\s*PASS/i.test(body)) fail('Production Review Status must be PASS.');
  const productionReviewer = roleValue('Production Reviewer');
  if (isMissingRole(productionReviewer)) fail('Name the distinct Production Reviewer.');
  if (normalizedRoles.includes(productionReviewer.toLowerCase())) fail('Production Reviewer must be distinct from the delivery role chain.');
  const productionHead = String((body.match(/Production Reviewed Head:\s*([0-9a-f]{40})\b/i) || [])[1] || '').toLowerCase();
  if (productionHead !== actualHead) fail('Production Review must match the current PR head SHA.');
}

const cycleMatch = body.match(/Cycle:\s*([0-9]+)/i);
const cycle = cycleMatch ? Number(cycleMatch[1]) : NaN;
if (!Number.isFinite(cycle) || cycle < 1 || cycle > 3) {
  fail('Loop Status must include Cycle: 1, 2, or 3. After cycle 3, split, de-scope, or escalate.');
}

console.log('Release train completion gate passed.');
