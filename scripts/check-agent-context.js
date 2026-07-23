#!/usr/bin/env node
const { execFileSync } = require('child_process');
const fs = require('fs');

const CONTEXT_FILE = 'docs/agent-operating-context.md';
const GUIDE_FILE = 'AGENTS.md';
const RELEASE_TRAIN_FILE = 'docs/release-train.md';
const REDESIGN_TRACKER_FILE = 'docs/redesign/12-threshold-rollout-tracker.md';
const CONTEXT_ADDENDUM_PATTERN = /^docs\/agent-operating-context-.+\.md$/;
const ROLE_FILES = [
  'docs/agents/product-manager.md',
  'docs/agents/development-engineer.md',
  'docs/agents/qa-agent.md',
  'docs/agents/deploy-agent.md',
  'docs/agents/development-head-release-authority.md',
];
const REQUIRED_CONTEXT_SECTIONS = [
  '## Current Objective',
  '## Canonical Sources',
  '## Current Deployment Model',
  '## Current Release Train',
  '## Open Work / Next Actions',
  '## Handoff Format For Future Agents',
];

function runGit(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function fail(message) {
  console.error('Agent context check failed:');
  console.error(message);
  process.exit(1);
}

for (const path of [GUIDE_FILE, CONTEXT_FILE, RELEASE_TRAIN_FILE, ...ROLE_FILES]) {
  if (!fs.existsSync(path)) fail('Missing required agent collaboration file: ' + path);
}

const guide = fs.readFileSync(GUIDE_FILE, 'utf8');
const context = fs.readFileSync(CONTEXT_FILE, 'utf8');
const releaseTrain = fs.readFileSync(RELEASE_TRAIN_FILE, 'utf8');

if (!guide.includes(CONTEXT_FILE)) fail('AGENTS.md must point agents to docs/agent-operating-context.md.');
if (!guide.includes(RELEASE_TRAIN_FILE)) fail('AGENTS.md must point agents to docs/release-train.md.');
for (const section of REQUIRED_CONTEXT_SECTIONS) {
  if (!context.includes(section)) fail(CONTEXT_FILE + ' is missing required section: ' + section);
}
for (const phrase of ['Product Manager', 'Development Engineer', 'QA Agent', 'Deploy Agent', 'maximum of 3', 'docs/agents/product-manager.md']) {
  if (!releaseTrain.includes(phrase)) fail(RELEASE_TRAIN_FILE + ' must describe the release train phrase: ' + phrase);
}

let base = process.env.AGENT_CONTEXT_BASE || '';
const head = process.env.AGENT_CONTEXT_HEAD || 'HEAD';
if (!base || /^0{40}$/.test(base)) {
  try {
    base = runGit(['rev-parse', 'HEAD~1']);
  } catch (_err) {
    console.log('Agent context check: no stable diff base found; structural files are present.');
    process.exit(0);
  }
}

try {
  runGit(['rev-parse', '--verify', base]);
} catch (_err) {
  console.log('Agent context check: diff base is not available locally; structural files are present.');
  process.exit(0);
}

const changed = runGit(['diff', '--name-only', base, head]).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
if (!changed.length) {
  console.log('Agent context check: no changed files.');
  process.exit(0);
}

// contextTouched recognizes the canonical context file, AGENTS.md, the release-train
// doc, the legacy rebuild-progress doc, any dated agent-operating-context addendum
// (docs/agent-operating-context-YYYY-MM-DD-runN.md — the sanctioned substitute once
// the canonical file gets too large to safely read-and-rewrite in one pass, per every
// run since run 2), or the Threshold redesign tracker (the actual status source of
// truth for UX redesign work per AGENTS.md's UX Redesign Directive).
const contextTouched = changed.some((path) => (
  path === CONTEXT_FILE
  || path === GUIDE_FILE
  || path === RELEASE_TRAIN_FILE
  || path === 'docs/rebuild-progress.md'
  || path === REDESIGN_TRACKER_FILE
  || CONTEXT_ADDENDUM_PATTERN.test(path)
));
const ignoredPatterns = [
  /^docs\/agent-operating-context\.md$/,
  /^docs\/agent-operating-context-.+\.md$/,
  /^docs\/release-train\.md$/,
  /^AGENTS\.md$/,
  /^\.github\/pull_request_template\.md$/,
  /^\.github\/workflows\/agent-context\.yml$/,
  /^scripts\/check-agent-context\.js$/,
  /^scripts\/check-release-train\.js$/,
  /^package\.json$/,
];
const meaningful = changed.filter(path => !ignoredPatterns.some(pattern => pattern.test(path)));

let headMessage = '';
try { headMessage = runGit(['log', '-1', '--format=%B', head]); } catch (_err) { headMessage = ''; }
const isSkipDeploy = /\[skip deploy\]/i.test(headMessage) || /\[skip deploy\]/i.test(process.env.HEAD_COMMIT_MESSAGE || '');

if (meaningful.length && !contextTouched && !isSkipDeploy) {
  fail([
    'Meaningful repo changes must update the agent loop.',
    '',
    'Changed files:',
    ...meaningful.map(path => '- ' + path),
    '',
    'Before handoff, update docs/agent-operating-context.md (or a dated docs/agent-operating-context-*.md addendum) and/or docs/redesign/12-threshold-rollout-tracker.md with what changed, what was tested, deploy status, blockers, and next action — ideally in the same commit as the release.',
    'Start each session by reading AGENTS.md, docs/agent-operating-context.md, and docs/release-train.md.',
  ].join('\n'));
}

console.log('Agent context check passed.');
