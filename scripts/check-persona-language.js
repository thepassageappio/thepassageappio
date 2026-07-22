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
  [/receipt\.eventId/, 'Do not render raw event identifiers in persona receipts.'],
  [/\bmember\.email\b/, 'Render member identity through the shared safe presenter, never a direct email fallback.'],
];

const proofRouteRequirements = [
  'humanizePreviewIdentity',
  'humanizePreviewLabel',
  'humanizeSavedReason',
];
const proofRouteRawValues = [
  [/identity=\{viewer\.displayName\}/, 'Humanize the signed-in identity before rendering it.'],
  [/\{(?:proof|latestProof)\.(?:completion_summary|reference)\}/, 'Humanize saved proof text before rendering it.'],
  [/\{(?:review|latestReview)\??\.(?:reason)\}/, 'Humanize saved review reasons before rendering them.'],
  [/\{displayMember\(/, 'Humanize submitter, reviewer, and owner identities before rendering them.'],
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

for (const relativeFile of ['app/staff/work/[taskId]/page.tsx', 'app/director/cases/[workflowId]/page.tsx']) {
  const file = path.join(candidateRoot, relativeFile);
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  for (const required of proofRouteRequirements) {
    if (!source.includes(required)) failures.push(`${relativeFile}:1: missing ${required} — Dynamic proof routes must suppress Cycle, QA, fixture, test, and email labels.`);
  }
  for (const [pattern, guidance] of proofRouteRawValues) {
    const match = source.match(pattern);
    if (!match) continue;
    const line = source.slice(0, match.index).split(/\r?\n/).length;
    failures.push(`${relativeFile}:${line}: ${match[0]} — ${guidance}`);
  }
}

const helperPath = path.join(candidateRoot, 'lib', 'presentation', 'plain-language.ts');
if (fs.existsSync(helperPath)) {
  const helper = fs.readFileSync(helperPath, 'utf8');
  if (!helper.includes("from './member-identity.js'")) failures.push('lib/presentation/plain-language.ts:1: typed presentation wrapper must use the dependency-free shared identity runtime.');
}

const identityRuntimePath = path.join(candidateRoot, 'lib', 'presentation', 'member-identity.js');
if (fs.existsSync(identityRuntimePath)) {
  try {
    const present = require(identityRuntimePath).humanizeMemberIdentity;
    const cases = [
      ['staff synthetic email', null, 'cycle8-staff@test.invalid', 'staff', 'Preview staff member'],
      ['director synthetic email', null, 'qa-director@fixture.test', 'director', 'Preview director'],
      ['unknown synthetic email', null, 'unknown-test@example.invalid', undefined, 'Preview team member'],
      ['genuine display name', 'Elena Torres', 'cycle8-director@test.invalid', 'director', 'Elena Torres'],
    ];
    for (const [label, displayName, email, role, expected] of cases) {
      const actual = present(displayName, email, role);
      if (actual !== expected || /@|cycle|test|qa|fixture/i.test(actual)) failures.push(`lib/presentation/plain-language.ts:1: ${label} rendered ${JSON.stringify(actual)} — Member identity must preserve a genuine name or use a role-safe fallback.`);
    }
  } catch (error) {
    failures.push(`lib/presentation/member-identity.js:1: shared helper regression could not execute — ${error.message}`);
  }
}

const presenterPath = path.join(candidateRoot, 'lib', 'operations', 'hosted.ts');
if (fs.existsSync(presenterPath)) {
  const presenter = fs.readFileSync(presenterPath, 'utf8');
  if (!presenter.includes('humanizeMemberIdentity(member.display_name, member.email, member.role)')) failures.push('lib/operations/hosted.ts:1: displayMember must delegate to humanizeMemberIdentity.');
  if (/(?:\|\||\?\?)\s*member\??\.email/.test(presenter)) failures.push('lib/operations/hosted.ts:1: displayMember must not return member.email as a direct fallback.');
}

for (const relativeFile of ['app/staff/page.tsx', 'app/director/page.tsx', 'app/staff/work/[taskId]/page.tsx', 'app/director/cases/[workflowId]/page.tsx']) {
  const file = path.join(candidateRoot, relativeFile);
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  if (!source.includes('displayMember(')) failures.push(`${relativeFile}:1: member identity must use the shared displayMember presenter.`);
}

if (failures.length) {
  console.error('Persona language check failed:');
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('PASS persona surfaces contain no blocked internal release or architecture narration');
