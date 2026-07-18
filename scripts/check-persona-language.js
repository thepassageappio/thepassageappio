#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const candidateRoot = process.env.CANDIDATE_ROOT ? path.resolve(process.env.CANDIDATE_ROOT) : process.cwd();
const roots = ['app', 'components'];
const ignored = new Set(['actions.ts', 'actions.tsx']);
const forbidden = [
  [/BROWSER SANDBOX/i, 'Use one truthful Preview Demo or Secure Preview label.'],
  [/SERVER-VERIFIED/i, 'Describe the user state, not the verification architecture.'],
  [/database authority/i, 'Explain access consequences in ordinary language.'],
  [/projection of server-created/i, 'Describe the activity the person can review.'],
  [/command events?/i, 'Use team activity or saved history.'],
  [/location-scoped membership/i, 'Use access by location.'],
  [/synthetic workload fixture/i, 'Never instruct a persona to operate QA data.'],
  [/\bCycle\s+[0-9]+[A-Z]?\b/i, 'Cycle and QA labels are internal.'],
  [/operational boundary/i, 'Explain who can see what.'],
  [/DIRECTOR COMMAND/i, 'Use the human action name.'],
  [/\.name\.replace(?:All)?\(/, 'Map backend event names through an explicit human-copy dictionary.'],
  [/\.status\.replace(?:All)?\(/, 'Map backend status values through an explicit human-copy dictionary.'],
  [/\.status\.toUpperCase\(/, 'Map member status through an explicit human-copy dictionary.'],
  [/proof_type\.replace(?:All)?\(/, 'Map proof types through an explicit human-copy dictionary.'],
  [/workflow\??\.phase\s*\?\?/, 'Map workflow phases through an explicit human-copy dictionary.'],
  [/automation_level\.replace(?:All)?\(/, 'Map automation levels through an explicit human-copy dictionary.'],
  [/\{task\.audience\}/, 'Map audience values through an explicit human-copy dictionary.'],
];

function filesUnder(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(target);
    if (!/\.(tsx|jsx)$/.test(entry.name) || ignored.has(entry.name)) return [];
    return [target];
  });
}

const failures = [];
for (const file of roots.flatMap((root) => filesUnder(path.join(candidateRoot, root)))) {
  const source = fs.readFileSync(file, 'utf8');
  for (const [pattern, guidance] of forbidden) {
    const match = source.match(pattern);
    if (!match) continue;
    const line = source.slice(0, match.index).split(/\r?\n/).length;
    failures.push(`${path.relative(candidateRoot, file)}:${line}: ${match[0]} — ${guidance}`);
  }
}

if (failures.length) {
  console.error('Persona language check failed:');
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('PASS persona surfaces contain no blocked internal release or architecture narration');
