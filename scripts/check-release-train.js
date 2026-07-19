#!/usr/bin/env node

const fs = require('node:fs');

function eventPayload() {
  if (process.env.GITHUB_ACTIONS !== 'true' || !process.env.GITHUB_EVENT_PATH) return {};
  try {
    return JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  } catch {
    return {};
  }
}

const payload = eventPayload();
const pullRequest = payload.pull_request || {};
const body = String(process.env.PR_BODY || pullRequest.body || '').replace(/\r/g, '');
const eventName = String(process.env.GITHUB_EVENT_NAME || '');

function fail(message) {
  console.error('Release train check failed:');
  console.error(message);
  process.exit(1);
}

if (eventName === 'merge_group') {
  console.log('Merge-group check uses the exact merge-group SHA; PR-body review remains enforced on the pull request.');
  process.exit(0);
}

if (eventName !== 'pull_request') {
  console.log('Release train PR check skipped for non-PR event.');
  process.exit(0);
}

if (!body.trim()) fail('PR body is empty. Use the Passage release train template.');

const draftState = String(process.env.PR_DRAFT || (pullRequest.draft ?? '')).toLowerCase();
if (!['true', 'false'].includes(draftState)) fail('PR_DRAFT must be exactly true or false.');
const isDraft = draftState === 'true';

const action = String(process.env.PR_ACTION || payload.action || '');
const allowedActions = new Set(['opened', 'synchronize', 'edited', 'ready_for_review', 'converted_to_draft']);
if (action === 'reopened') fail('A closed Passage PR cannot be reopened. Create a new PR and repeat exact-head review.');
if (!allowedActions.has(action)) fail(`Unsupported or missing pull-request action: ${action || 'missing'}.`);

const expectedAuthor = 'passage-release-bot[bot]';
if (String(process.env.PR_AUTHOR || pullRequest.user?.login || '') !== expectedAuthor) {
  fail(`Pull requests must be authored by ${expectedAuthor}.`);
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
  '## Independent QA',
  '## Dedicated Merge Review',
  '## Production Review',
  '## Owner Gate',
  '## Loop Status',
  '## Deploy Decision',
];

function countExactLine(line) {
  const escaped = line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (body.match(new RegExp(`^${escaped}$`, 'gm')) || []).length;
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
const ownerGate = oneStatus('Owner Gate', ['NOT REQUIRED', 'REQUIRED', 'APPROVED']);
const deployDecision = oneStatus('Deploy Decision', ['APPROVED', 'NOT APPROVED']);
const requiredCheck = oneField('Required check', /^`Passage Review Agent \/ merge-review`$/);
oneField('Expected source', /^Passage Release Reviewer GitHub App$/);
oneField('Required release check', /^`Passage Production Review \/ release-readiness`$/);
const cycleValue = oneField('Cycle', /^[1-9][0-9]*$/);

const checkboxItems = [
  'Product Manager scope completed',
  'UX review completed',
  'Development handoff completed',
  'Independent QA handoff completed',
  'Agent context updated',
];
const checkboxState = new Map(checkboxItems.map((item) => [item, oneCheckbox(item)]));

if (mergeReview !== 'REQUIRED CHECK' || requiredCheck !== '`Passage Review Agent / merge-review`') {
  fail('Dedicated Merge Review must remain an external required check, not a PR-body assertion.');
}

if (isDraft) {
  if (productionReview !== 'NOT REQUESTED' || deployDecision !== 'NOT APPROVED') {
    fail('Draft PRs cannot claim Production review or deploy approval.');
  }
  console.log('Release train structure passed for draft PR; external completion gates remain open.');
  process.exit(0);
}

for (const item of checkboxItems) {
  if (!checkboxState.get(item)) fail(`Before ready-for-review or merge, check this item: ${item}`);
}

if (!['PASS', 'N/A'].includes(uxStatus)) fail('UX Status must be PASS or N/A.');
if (qaStatus !== 'PASS') fail('QA Status must be PASS. Failed QA returns to Product Manager.');
if (ownerGate === 'REQUIRED') fail('A required owner gate must be resolved before merge.');
if (!Number.isFinite(Number(cycleValue))) fail('Loop Status must include a positive cycle number.');

console.log('Release train structure passed; GitHub required checks remain authoritative.');
