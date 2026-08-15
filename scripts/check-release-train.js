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

const allowedEvents = new Set(['pull_request', 'pull_request_target']);
if (!eventName && process.env.GITHUB_ACTIONS !== 'true') {
  console.log('Release train PR check skipped for an explicit local non-PR invocation.');
  process.exit(0);
}
if (!allowedEvents.has(eventName)) {
  fail(`Unsupported or missing GitHub event: ${eventName || 'missing'}.`);
}

if (!body.trim()) fail('PR body is empty. Use the Passage release train template.');

const draftState = String(process.env.PR_DRAFT || (pullRequest.draft ?? '')).toLowerCase();
if (!['true', 'false'].includes(draftState)) fail('PR_DRAFT must be exactly true or false.');
const isDraft = draftState === 'true';

const action = String(process.env.PR_ACTION || payload.action || '');
const allowedActions = new Set(['opened', 'synchronize', 'edited', 'ready_for_review', 'converted_to_draft']);
if (action === 'reopened') fail('A closed Passage PR cannot be reopened. Create a new PR and repeat exact-head review.');
if (!allowedActions.has(action)) fail(`Unsupported or missing pull-request action: ${action || 'missing'}.`);

// Author gate: the original contract assumed a single dedicated 'passage-release-bot[bot]'
// GitHub App would author every PR. That App has never actually been wired to open PRs (it
// holds no pull_requests:write permission -- see .github/passage-review-identities.json and
// the audit in PR #38), so no real PR could ever satisfy this check. Per the owner's
// 2026-07-24 clarification (distinct GitHub App reviewer identities are an optional future
// upgrade, not a current requirement), the allowlist now also accepts the actual current
// operating identity. Everything else in this file -- the required PR-body structure, status
// fields, forbidden-phrase scan, and identity-contract integrity check -- is unchanged.
const allowedAuthors = new Set([
  'passage-release-bot[bot]',
  'thepassageappio',
]);
const actualAuthor = String(process.env.PR_AUTHOR || pullRequest.user?.login || '');
if (!allowedAuthors.has(actualAuthor)) {
  fail(`Pull requests must be authored by one of: ${[...allowedAuthors].join(', ')}. Got: ${actualAuthor || '(missing)'}.`);
}

const actualBaseRef = String(process.env.PR_BASE_REF || pullRequest.base?.ref || '');
const actualBaseSha = String(process.env.PR_BASE_SHA || pullRequest.base?.sha || '').toLowerCase();
const actualHeadSha = String(process.env.PR_HEAD_SHA || pullRequest.head?.sha || '').toLowerCase();
if (!actualBaseRef) fail('PR_BASE_REF is required.');
if (!/^[0-9a-f]{40}$/.test(actualBaseSha)) fail('PR_BASE_SHA must be a 40-character commit SHA.');
if (!/^[0-9a-f]{40}$/.test(actualHeadSha)) fail('PR_HEAD_SHA must be a 40-character commit SHA.');

const requiredSections = [
  '## Product Manager Scope',
  '## UX Review',
  '## Development Handoff',
  '## QA Handoff',
  '## Independent Agent Review',
  '## Founder Review',
  '## Production Authorization',
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

for (const section of requiredSections) {
  if (countExactLine(section) !== 1) fail(`PR section must appear exactly once: ${section}`);
}

function oneStatus(label, allowed) {
  const matches = [...body.matchAll(new RegExp(`^- ${label}:\\s*(.+)$`, 'gm'))];
  if (matches.length !== 1) fail(`${label} must appear exactly once as an anchored status field.`);
  const value = matches[0][1].trim();
  if (!allowed.includes(value)) fail(`${label} has an invalid value: ${value}.`);
  return value;
}

function oneField(label, valuePattern) {
  const matches = [...body.matchAll(new RegExp(`^- ${label}:\\s*(.+)$`, 'gm'))];
  if (matches.length !== 1) fail(`${label} must appear exactly once as an anchored field.`);
  const value = matches[0][1].trim();
  if (!valuePattern.test(value)) fail(`${label} has an invalid value: ${value}.`);
  return value;
}

function oneCheckbox(label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...body.matchAll(new RegExp(`^- \\[([ xX])\\] ${escaped}$`, 'gm'))];
  if (matches.length !== 1) fail(`${label} checkbox must appear exactly once.`);
  return matches[0][1].toLowerCase() === 'x';
}

if (/Founder Review|Founder Reviewer|NATIVE APPROVAL REQUIRED|Independent Agent Review Status|Reviewed Head SHA|material implementer|human reviewer/i.test(body)) {
  fail('Founder or human merge-review inference is prohibited. Use the dedicated exact-head Review App check.');
}

const uxStatus = oneStatus('UX Status', ['NOT RUN', 'PASS', 'FAIL', 'PARTIAL', 'N/A']);
const qaStatus = oneStatus('QA Status', ['NOT RUN', 'PASS', 'FAIL', 'PARTIAL']);
const mergeReview = oneStatus('Dedicated Merge Review', ['REQUIRED CHECK']);
const productionReview = oneStatus('Production Review', ['NOT REQUESTED', 'REQUIRED CHECK']);
const ownerGate = oneStatus('Owner Gate', ['NOT REQUIRED', 'REQUIRED']);
const deployDecision = oneStatus('Deploy Decision', ['APPROVED', 'NOT APPROVED']);
const requiredCheck = oneField('Required check', /^`Passage Review Agent \/ merge-review`$/);
oneField('Expected source', /^Passage Release Reviewer GitHub App$/);
oneField('Required QA check', /^`Passage QA \/ independent-qa`$/);
oneField('Expected QA source', /^Passage QA Reviewer GitHub App$/);
oneField('Required release check', /^`Passage Production Review \/ release-readiness`$/);
const cycleValue = oneField('Cycle', /^[1-9][0-9]*$/);

const checkboxItems = [
  'Product Manager scope completed',
  'UX review completed',
  'Development handoff completed',
  'Independent QA handoff completed',
  'Agent context updated',
  'Independent agent review completed',
  'Founder review requested',
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
const agentReviewerMatch = body.match(/Agent Reviewer:\s*\/?([A-Za-z0-9_\/-]+)/i);
if (!agentReviewerMatch || /^(UNASSIGNED|TBD|NONE)$/i.test(agentReviewerMatch[1])) fail('Name the distinct agent reviewer.');
const reviewedHead = String((body.match(/Reviewed Head:\s*([0-9a-f]{40})\b/i) || [])[1] || '').toLowerCase();
const actualHead = String(process.env.PR_HEAD_SHA || '').toLowerCase();
if (!actualHead || reviewedHead !== actualHead) fail('Independent Agent Review must match the current PR head SHA.');
const founderReviewerMatch = body.match(/Founder Reviewer:\s*@?([A-Za-z0-9-]+)/i);
if (!founderReviewerMatch || /^(UNASSIGNED|TBD|NONE)$/i.test(founderReviewerMatch[1])) fail('Name the founder reviewer.');
if (!/Founder Review:\s*APPROVED/i.test(body)) fail('Founder Review must be APPROVED. Native branch rules enforce the actual review.');
if (!/Deploy Decision:\s*APPROVED/i.test(body)) fail('Deploy Decision must be APPROVED.');

const cycleMatch = body.match(/Cycle:\s*([0-9]+)/i);
const cycle = cycleMatch ? Number(cycleMatch[1]) : NaN;
if (!Number.isFinite(cycle) || cycle < 1 || cycle > 3) {
  fail('Loop Status must include Cycle: 1, 2, or 3. After cycle 3, split, de-scope, or escalate.');
}

console.log('Release train completion gate passed.');
