const { spawnSync } = require('node:child_process');
const path = require('node:path');

const gate = path.join(__dirname, 'vercel-ignore-build.js');
const canonicalProjectId = 'prj_b7CKwanQaKwFQSHInr3l6wsZy9nD';
const approvedMessage = 'release: hosted invitation cutover [deploy] [qa-approved]';
const verificationMessage = 'test: hosted invitation verification [deploy] [cycle-7a-verification-preview]';

const cases = [
  { name: 'approved preview', expected: 1, env: { VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: canonicalProjectId, VERCEL_GIT_COMMIT_REF: 'greenfield/passage-zero', VERCEL_GIT_COMMIT_MESSAGE: approvedMessage } },
  { name: 'owner-authorized verification preview', expected: 1, env: { VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: canonicalProjectId, VERCEL_GIT_COMMIT_REF: 'greenfield/passage-zero', VERCEL_GIT_COMMIT_MESSAGE: verificationMessage } },
  { name: 'skip marker wins', expected: 0, env: { VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: canonicalProjectId, VERCEL_GIT_COMMIT_REF: 'greenfield/passage-zero', VERCEL_GIT_COMMIT_MESSAGE: `${approvedMessage} [skip deploy]` } },
  { name: 'unmarked preview', expected: 0, env: { VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: canonicalProjectId, VERCEL_GIT_COMMIT_REF: 'greenfield/passage-zero', VERCEL_GIT_COMMIT_MESSAGE: 'docs: update context' } },
  { name: 'deploy without QA', expected: 0, env: { VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: canonicalProjectId, VERCEL_GIT_COMMIT_REF: 'greenfield/passage-zero', VERCEL_GIT_COMMIT_MESSAGE: 'release: hosted invitation cutover [deploy]' } },
  { name: 'QA without deploy', expected: 0, env: { VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: canonicalProjectId, VERCEL_GIT_COMMIT_REF: 'greenfield/passage-zero', VERCEL_GIT_COMMIT_MESSAGE: 'test: hosted invitation cutover [qa-approved]' } },
  { name: 'verification marker without literal deploy', expected: 0, env: { VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: canonicalProjectId, VERCEL_GIT_COMMIT_REF: 'greenfield/passage-zero', VERCEL_GIT_COMMIT_MESSAGE: 'test: hosted invitation verification [cycle-7a-verification-preview]' } },
  { name: 'release prefix does not replace preview deploy marker', expected: 0, env: { VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: canonicalProjectId, VERCEL_GIT_COMMIT_REF: 'greenfield/passage-zero', VERCEL_GIT_COMMIT_MESSAGE: 'release: hosted invitation cutover [qa-approved]' } },
  { name: 'wrong preview branch', expected: 0, env: { VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: canonicalProjectId, VERCEL_GIT_COMMIT_REF: 'feature/other', VERCEL_GIT_COMMIT_MESSAGE: approvedMessage } },
  { name: 'wrong branch verification preview', expected: 0, env: { VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: canonicalProjectId, VERCEL_GIT_COMMIT_REF: 'feature/other', VERCEL_GIT_COMMIT_MESSAGE: verificationMessage } },
  { name: 'wrong project', expected: 0, env: { VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: 'prj_not_passage', VERCEL_GIT_COMMIT_REF: 'greenfield/passage-zero', VERCEL_GIT_COMMIT_MESSAGE: approvedMessage } },
  { name: 'approved production release', expected: 1, env: { VERCEL_ENV: 'production', VERCEL_PROJECT_ID: canonicalProjectId, VERCEL_GIT_COMMIT_REF: 'main', VERCEL_GIT_COMMIT_MESSAGE: approvedMessage } },
  { name: 'feature branch cannot target production', expected: 0, env: { VERCEL_ENV: 'production', VERCEL_PROJECT_ID: canonicalProjectId, VERCEL_GIT_COMMIT_REF: 'greenfield/passage-zero', VERCEL_GIT_COMMIT_MESSAGE: approvedMessage } },
  { name: 'verification marker cannot target production', expected: 0, env: { VERCEL_ENV: 'production', VERCEL_PROJECT_ID: canonicalProjectId, VERCEL_GIT_COMMIT_REF: 'main', VERCEL_GIT_COMMIT_MESSAGE: verificationMessage } },
  { name: 'verification plus QA cannot target production', expected: 0, env: { VERCEL_ENV: 'production', VERCEL_PROJECT_ID: canonicalProjectId, VERCEL_GIT_COMMIT_REF: 'main', VERCEL_GIT_COMMIT_MESSAGE: `${verificationMessage} [qa-approved]` } },
  { name: 'local build', expected: 1, env: { VERCEL_ENV: 'development', VERCEL_GIT_COMMIT_MESSAGE: 'local build' } },
];

let failed = false;
for (const testCase of cases) {
  const result = spawnSync(process.execPath, [gate], {
    encoding: 'utf8',
    env: { ...process.env, ...testCase.env },
  });
  const passed = result.status === testCase.expected;
  console.log(`${passed ? 'PASS' : 'FAIL'} ${testCase.name}: exit ${result.status}`);
  if (!passed) {
    failed = true;
    process.stderr.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
  }
}

if (failed) process.exit(1);
