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
  '## Production Authorization',
  '## Platform Readiness Gate',
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
  'Independent agent review completed',
  'Development Head approval recorded',
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
const qaInfrastructureStatus = String((body.match(/QA Infrastructure Status:\s*(CLEAR|PARTIAL|BLOCKED)/i) || [])[1] || '').toUpperCase();
if (qaInfrastructureStatus !== 'CLEAR') fail('Required QA infrastructure must be CLEAR before merge; PARTIAL/BLOCKED requires a tracked fix-it item and recovery test.');

function requiredField(label, pattern = '[^\\n]+') {
  const match = body.match(new RegExp(`${label}:\\s*(${pattern})`, 'i'));
  const value = String(match?.[1] || '').trim();
  if (!value || /^(UNASSIGNED|TBD|NONE)$/i.test(value)) fail(`Provide ${label}.`);
  return value;
}

const implementationRole = requiredField('Implementation Role', '\\/?[A-Za-z0-9_\\/-]+');
const qaRole = requiredField('QA Role', '\\/?[A-Za-z0-9_\\/-]+');
const deployRole = requiredField('Deploy Role', '\\/?[A-Za-z0-9_\\/-]+');
const productionReviewerRole = requiredField('Production Reviewer Role', '\\/?[A-Za-z0-9_\\/-]+');
const declaredAuthorIdentity = requiredField('PR Author GitHub Identity', '[A-Za-z0-9_\\[\\].-]+');
const mergeAuthorityIdentity = requiredField('Merge Authority GitHub Identity', '[A-Za-z0-9_\\[\\].-]+');
const actualAuthorIdentity = String(process.env.PR_AUTHOR_LOGIN || '').trim();
if (actualAuthorIdentity && declaredAuthorIdentity.toLowerCase() !== actualAuthorIdentity.toLowerCase()) fail('Declared PR Author GitHub Identity must match the actual PR author.');
if (declaredAuthorIdentity.toLowerCase() === mergeAuthorityIdentity.toLowerCase()) fail('The PR author identity may never be the merge-authority identity.');

const materialScopeMatch = body.match(/Material Product Direction or Scope Change:\s*(YES|NO)/i);
if (!materialScopeMatch) fail('Classify Material Product Direction or Scope Change as YES or NO; missing is stale by default.');
const materialScopeChange = materialScopeMatch[1].toUpperCase() === 'YES';
const roadmapUpdated = String((body.match(/Canonical Roadmap Updated:\s*(YES|NOT REQUIRED)/i) || [])[1] || '').toUpperCase();
if (!roadmapUpdated) fail('Record Canonical Roadmap Updated as YES or NOT REQUIRED.');
const changedFiles = String(process.env.CHANGED_FILES || '').split(/[\r\n,]+/).map((value) => value.trim()).filter(Boolean);
if (materialScopeChange) {
  if (roadmapUpdated !== 'YES') fail('Material product direction/scope changes require the canonical roadmap in the same PR.');
  if (changedFiles.length && !changedFiles.includes('docs/product/operational-readiness-roadmap.md')) fail('Changed-file evidence does not include the canonical roadmap.');
  if (changedFiles.length && !changedFiles.includes('docs/agent-operating-context.md')) fail('Changed-file evidence does not include the living operating context.');
}

const divergenceCycles = Number((body.match(/Consecutive Unresolved Branch-Divergence Reviews:\s*([0-9]+)/i) || [])[1]);
if (!Number.isInteger(divergenceCycles) || divergenceCycles < 0) fail('Record the consecutive unresolved branch-divergence review count.');
if (divergenceCycles >= 2) {
  const proposal = String((body.match(/Reconciliation Proposal:\s*([^\n]+)/i) || [])[1] || '').trim();
  if (!proposal || /^(NOT REQUIRED|NONE|TBD|UNASSIGNED)$/i.test(proposal)) fail('Two consecutive divergence findings require an actionable reconciliation proposal.');
}

if (!/Independent Agent Review Status:\s*PASS/i.test(body)) fail('Independent Agent Review Status must be PASS.');
const agentReviewerMatch = body.match(/Agent Reviewer:\s*\/?([A-Za-z0-9_\/-]+)/i);
if (!agentReviewerMatch || /^(UNASSIGNED|TBD|NONE)$/i.test(agentReviewerMatch[1])) fail('Name the distinct agent reviewer.');
const reviewedHead = String((body.match(/Reviewed Head:\s*([0-9a-f]{40})\b/i) || [])[1] || '').toLowerCase();
const actualHead = String(process.env.PR_HEAD_SHA || '').toLowerCase();
if (!actualHead || reviewedHead !== actualHead) fail('Independent Agent Review must match the current PR head SHA.');
const developmentHeadMatch = body.match(/Development Head Role:\s*(\/?[A-Za-z0-9_\/-]+)/i);
if (!developmentHeadMatch || /^(UNASSIGNED|TBD|NONE)$/i.test(developmentHeadMatch[1])) fail('Name the distinct Development Head / Release Authority role.');
const developmentHeadReviewedHead = String((body.match(/Development Head Reviewed Head:\s*([0-9a-f]{40})\b/i) || [])[1] || '').toLowerCase();
if (!actualHead || developmentHeadReviewedHead !== actualHead) fail('Development Head approval must match the current PR head SHA.');
if (!/Development Head Approval:\s*APPROVED/i.test(body)) fail('Development Head Approval must be APPROVED.');
if (developmentHeadMatch[1].replace(/^\//, '') === agentReviewerMatch[1].replace(/^\//, '')) fail('Development Head / Release Authority must be distinct from the Independent Agent Reviewer.');
const roleValues = [implementationRole, qaRole, deployRole, productionReviewerRole, agentReviewerMatch[1], developmentHeadMatch[1]].map((role) => role.replace(/^\//, '').toLowerCase());
if (new Set(roleValues).size !== roleValues.length) fail('Implementation, QA, Independent Agent Review, Development Head, Deploy, and Production Reviewer roles must be distinct.');
if (/## Founder Review|Founder Reviewer:|Founder Review:\s*(?:APPROVED|REQUIRED|STALE|NOT APPROVED)/i.test(body)) fail('Routine founder review is not part of the Passage release chain.');
if (!/Deploy Decision:\s*APPROVED/i.test(body)) fail('Deploy Decision must be APPROVED.');

const checkpoints = [0, 10, 20, 30, 40, 50, 60, 70, 75];
const currentReadiness = Number((body.match(/Current Certified Platform Readiness:\s*([0-9]+)/i) || [])[1]);
const proposedReadiness = Number((body.match(/Proposed Certified Platform Readiness:\s*([0-9]+)/i) || [])[1]);
if (!checkpoints.includes(currentReadiness) || !checkpoints.includes(proposedReadiness)) fail('Platform readiness must use a certified checkpoint: 0,10,20,30,40,50,60,70,75.');
if (proposedReadiness > currentReadiness) {
  const expectedNext = checkpoints[checkpoints.indexOf(currentReadiness) + 1];
  if (proposedReadiness !== expectedNext) fail('Platform readiness may advance only one certified checkpoint per fresh E2E gate.');
  if (!/Domain Floors:\s*PASS/i.test(body)) fail('Every domain floor must PASS before a platform-readiness advance.');
  if (!/Whole-Platform E2E:\s*PASS/i.test(body)) fail('A fresh complete whole-platform E2E PASS is required for every readiness advance.');
}
if (proposedReadiness === 75 && !/Massive 75% Full-Platform QA:\s*PASS/i.test(body)) fail('The 75% checkpoint requires a separate massive full-platform QA PASS.');

const cycleMatch = body.match(/Cycle:\s*([0-9]+)/i);
const cycle = cycleMatch ? Number(cycleMatch[1]) : NaN;
if (!Number.isFinite(cycle) || cycle < 1 || cycle > 3) {
  fail('Loop Status must include Cycle: 1, 2, or 3. After cycle 3, split, de-scope, or escalate.');
}

console.log('Release train completion gate passed with identity separation, roadmap freshness, QA-infrastructure, divergence, and platform-readiness controls.');
