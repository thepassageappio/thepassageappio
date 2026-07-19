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

if (eventName !== 'pull_request') {
  console.log('Release train PR check skipped for non-PR event.');
  process.exit(0);
}

if (!body.trim()) fail('PR body is empty. Use the Passage release train template.');

// The payload fallback keeps the pre-governance main workflow compatible without
// weakening the contract: GitHub's immutable event file supplies every omitted field.
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
  '## QA Handoff',
  '## Independent Agent Review',
  '## Founder Review',
  '## Production Authorization',
  '## Loop Status',
  '## Deploy Decision',
];

for (const section of requiredSections) {
  const count = (body.match(new RegExp(`^${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'gm')) || []).length;
  if (count !== 1) fail(`PR section must appear exactly once: ${section}`);
}

const START = '<!-- PASSAGE_REVIEW_ATTESTATION_START -->';
const END = '<!-- PASSAGE_REVIEW_ATTESTATION_END -->';

function countLiteral(value, literal) {
  return value.split(literal).length - 1;
}

function parseAttestation() {
  if (countLiteral(body, START) !== 1 || countLiteral(body, END) !== 1) {
    fail('The review attestation must contain exactly one start marker and one end marker.');
  }
  const start = body.indexOf(START);
  const end = body.indexOf(END);
  if (end <= start) fail('The review attestation markers are out of order.');
  const lines = body.slice(start + START.length, end).split('\n').map((line) => line.trim()).filter(Boolean);
  const fields = [
    ['Reviewed Base Ref', /^(?:UNASSIGNED|[^\s]+)$/],
    ['Reviewed Base SHA', /^(?:UNASSIGNED|[0-9a-f]{40})$/i],
    ['Reviewed Head SHA', /^(?:UNASSIGNED|[0-9a-f]{40})$/i],
    ['Independent Agent Review Status', /^(?:NOT RUN|PASS|FAIL)$/],
  ];
  if (lines.length !== fields.length) fail('The review attestation must contain exactly four ordered fields.');
  const result = {};
  for (let index = 0; index < fields.length; index += 1) {
    const [label, valuePattern] = fields[index];
    const match = lines[index].match(new RegExp(`^${label}:\\s*(.+)$`));
    if (!match || !valuePattern.test(match[1])) fail(`Invalid or out-of-order attestation field: ${label}.`);
    const wholeBodyCount = (body.match(new RegExp(`^${label}:`, 'gm')) || []).length;
    if (wholeBodyCount !== 1) fail(`Attestation field must appear exactly once: ${label}.`);
    result[label] = match[1];
  }
  return result;
}

function oneStatus(label, allowed) {
  const pattern = new RegExp(`^- ${label}:\\s*(.+)$`, 'gm');
  const matches = [...body.matchAll(pattern)];
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
  const matches = [...body.matchAll(new RegExp(`^- \\[([ xX])\\] ${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'gm'))];
  if (matches.length !== 1) fail(`${label} checkbox must appear exactly once.`);
  return matches[0][1].toLowerCase() === 'x';
}

if (/^\s*-?\s*Bootstrap Exception:/m.test(body)) fail('Bootstrap exceptions are expired and prohibited.');
const attestation = parseAttestation();
const uxStatus = oneStatus('UX Status', ['NOT RUN', 'PASS', 'FAIL', 'PARTIAL', 'N/A']);
const qaStatus = oneStatus('QA Status', ['NOT RUN', 'PASS', 'FAIL', 'PARTIAL']);
const founderReview = oneStatus('Founder Review', ['NATIVE APPROVAL REQUIRED']);
const productionAuthorization = oneStatus('Founder Production Authorization', ['APPROVED', 'NOT APPROVED']);
const deployDecision = oneStatus('Deploy Decision', ['APPROVED', 'NOT APPROVED']);
const agentReviewer = oneField('Agent Reviewer', /^(?:UNASSIGNED|\/?[A-Za-z0-9_\/-]+)$/);
const founderReviewer = oneField('Founder Reviewer', /^@?[A-Za-z0-9-]+$/);
const cycleValue = oneField('Cycle', /^[1-3]$/);

const checkboxItems = [
  'Product Manager scope completed',
  'UX review completed',
  'Development handoff completed',
  'Independent QA handoff completed',
  'Agent context updated',
  'Independent agent review completed',
  'Founder review requested',
];
const checkboxState = new Map(checkboxItems.map((item) => [item, oneCheckbox(item)]));

if (isDraft) {
  if (attestation['Independent Agent Review Status'] !== 'NOT RUN') fail('Draft review status must be NOT RUN.');
  const draftBindings = [
    ['Reviewed Base Ref', actualBaseRef],
    ['Reviewed Base SHA', actualBaseSha],
    ['Reviewed Head SHA', actualHeadSha],
  ];
  for (const [field, actual] of draftBindings) {
    const value = attestation[field].toLowerCase();
    if (value !== 'unassigned' && value !== actual.toLowerCase()) fail(`Draft ${field} conflicts with the current PR event.`);
  }
  if (productionAuthorization !== 'NOT APPROVED' || deployDecision !== 'NOT APPROVED') {
    fail('Draft PRs cannot claim Production or deploy approval.');
  }
  console.log('Release train structure passed for draft PR; completion gates remain open.');
  process.exit(0);
}

for (const item of checkboxItems) {
  if (!checkboxState.get(item)) fail(`Before ready-for-review or merge, check this item: ${item}`);
}

if (!['PASS', 'N/A'].includes(uxStatus)) fail('UX Status must be PASS or N/A.');
if (qaStatus !== 'PASS') fail('QA Status must be PASS. Failed QA returns to Product Manager.');
if (attestation['Independent Agent Review Status'] !== 'PASS') fail('Independent Agent Review Status must be PASS.');
if (attestation['Reviewed Base Ref'] !== actualBaseRef) fail('Independent Agent Review must match the current PR base ref.');
if (attestation['Reviewed Base SHA'].toLowerCase() !== actualBaseSha) fail('Independent Agent Review must match the current PR base SHA.');
if (attestation['Reviewed Head SHA'].toLowerCase() !== actualHeadSha) fail('Independent Agent Review must match the current PR head SHA.');

if (/^(UNASSIGNED|TBD|NONE)$/i.test(agentReviewer)) fail('Name the distinct agent reviewer.');
if (/^@?(UNASSIGNED|TBD|NONE)$/i.test(founderReviewer)) fail('Name the founder reviewer.');
if (founderReview !== 'NATIVE APPROVAL REQUIRED') fail('Founder review must remain a native GitHub approval gate, never a body assertion.');
if (deployDecision !== 'APPROVED') fail('Deploy Decision must be APPROVED.');
if (!Number.isFinite(Number(cycleValue))) fail('Loop Status must include Cycle: 1, 2, or 3.');

console.log('Release train completion gate passed.');
