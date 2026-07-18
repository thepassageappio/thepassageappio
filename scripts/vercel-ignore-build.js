const canonicalProjectId = 'prj_b7CKwanQaKwFQSHInr3l6wsZy9nD';
const previewBranch = 'greenfield/passage-zero';
const productionBranch = 'main';
const env = process.env.VERCEL_ENV || 'unknown';
const branch = process.env.VERCEL_GIT_COMMIT_REF || '';
const projectId = process.env.VERCEL_PROJECT_ID || '';
const message = (process.env.VERCEL_GIT_COMMIT_MESSAGE || '').toLowerCase();

const skipMarkers = ['[skip deploy]', '[no deploy]', '[skip ci]', '[ci skip]'];
const deployMarkers = ['[deploy]', '[force deploy]', '[prod deploy]', '[production deploy]'];
const qaMarkers = ['[qa-approved]', '[qa approved]'];
const verificationMarkers = ['[cycle-7a-verification-preview]'];
const explicitlySkipped = skipMarkers.some((marker) => message.includes(marker));
const deployApproved = deployMarkers.some((marker) => message.includes(marker))
  || message.startsWith('deploy:')
  || message.startsWith('release:');
const qaApproved = qaMarkers.some((marker) => message.includes(marker));
const verificationPreview = verificationMarkers.some((marker) => message.includes(marker));
const literalPreviewMarkers = message.includes('[deploy]') && message.includes('[qa-approved]');
const literalVerificationPreviewMarkers = message.includes('[deploy]') && message.includes('[cycle-7a-verification-preview]');

function finish(allowed, explanation) {
  console.log(`Passage release gate: ${allowed ? 'build allowed' : 'build canceled'} (${explanation}).`);
  process.exit(allowed ? 1 : 0);
}

if (env !== 'preview' && env !== 'production') {
  finish(true, 'non-hosted environment');
}

if (projectId !== canonicalProjectId) {
  finish(false, 'non-canonical Vercel project');
}

if (explicitlySkipped) {
  finish(false, 'skip marker present');
}

if (env === 'preview') {
  if (branch !== previewBranch) finish(false, 'preview branch is not approved');
  if (literalPreviewMarkers) finish(true, 'approved Passage Zero preview');
  if (verificationPreview && literalVerificationPreviewMarkers) {
    finish(true, 'owner-authorized Passage Zero verification preview');
  }
  finish(false, 'preview requires literal deploy plus QA approval or verification-preview markers');
}

if (verificationPreview) {
  finish(false, 'verification-preview exception is prohibited for production');
}

if (!deployApproved || !qaApproved) {
  finish(false, 'production requires deploy and QA approval markers');
}

finish(branch === productionBranch, branch === productionBranch ? 'approved production release' : 'production deployment did not originate from main');
