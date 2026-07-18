#!/usr/bin/env node

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

const requiredFiles = [
  'AGENTS.md',
  'docs/agent-operating-context.md',
  'docs/release-train.md',
  'docs/product/operational-readiness-roadmap.md',
  'docs/agents/product-manager.md',
  'docs/agents/ux-review.md',
  'docs/agents/engineering.md',
  'docs/agents/qa.md',
  'docs/agents/deploy.md',
];

function fail(message) {
  console.error('Agent context check failed:');
  console.error(message);
  process.exit(1);
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

for (const file of requiredFiles) if (!fs.existsSync(file)) fail(`Missing required release-train file: ${file}`);

const guide = fs.readFileSync('AGENTS.md', 'utf8');
const releaseTrain = fs.readFileSync('docs/release-train.md', 'utf8');
for (const phrase of ['Passage Zero', 'docs/product/operational-readiness-roadmap.md', 'human review', 'direct', 'main']) {
  if (!guide.toLowerCase().includes(phrase.toLowerCase())) fail(`AGENTS.md must retain governance phrase: ${phrase}`);
}
for (const phrase of ['Product Manager', 'UX Review', 'Engineering', 'QA', 'Deploy', 'human review']) {
  if (!releaseTrain.toLowerCase().includes(phrase.toLowerCase())) fail(`Release train must retain role/gate: ${phrase}`);
}

let base = process.env.AGENT_CONTEXT_BASE || '';
const head = process.env.AGENT_CONTEXT_HEAD || 'HEAD';
if (!base || /^0{40}$/.test(base)) {
  try { base = git(['rev-parse', 'HEAD~1']); } catch (_error) {
    console.log('Agent context structure passed; no stable diff base was available.');
    process.exit(0);
  }
}

try { git(['rev-parse', '--verify', base]); } catch (_error) {
  console.log('Agent context structure passed; the selected diff base was unavailable.');
  process.exit(0);
}

const changed = git(['diff', '--name-only', base, head]).split(/\r?\n/).filter(Boolean);
const ignored = [
  /^docs\/agent-operating-context\.md$/,
  /^AGENTS\.md$/,
  /^docs\/release-train\.md$/,
  /^docs\/product\//,
  /^docs\/agents\//,
  /^\.github\//,
  /^scripts\/check-(agent-context|release-train|independent-review|persona-language)\.js$/,
  /^scripts\/test-release-governance\.js$/,
  /^package\.json$/,
];
const meaningful = changed.filter((file) => !ignored.some((pattern) => pattern.test(file)));
if (meaningful.length && !changed.includes('docs/agent-operating-context.md')) {
  fail(`Meaningful changes require docs/agent-operating-context.md in the same PR. Missing for:\n${meaningful.join('\n')}`);
}

console.log('PASS agent context structure and same-PR handoff requirement');
