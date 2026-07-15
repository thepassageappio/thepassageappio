const env = process.env.VERCEL_ENV || 'unknown';
const message = process.env.VERCEL_GIT_COMMIT_MESSAGE || '';

if (env === 'preview') {
  const allowed = message.includes('[preview]');
  console.log(allowed ? 'Passage Zero preview build allowed.' : 'Passage Zero preview build skipped.');
  process.exit(allowed ? 1 : 0);
}

if (env === 'production') {
  const allowed = message.includes('[deploy]') && message.includes('[qa-approved]');
  console.log(allowed ? 'Passage Zero production build allowed.' : 'Passage Zero production build blocked by release gate.');
  process.exit(allowed ? 1 : 0);
}

console.log('Passage Zero non-hosted build allowed.');
process.exit(1);
