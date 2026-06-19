#!/usr/bin/env node

const message = String(process.env.VERCEL_GIT_COMMIT_MESSAGE || '').trim();
const ref = String(process.env.VERCEL_GIT_COMMIT_REF || '').trim();
const env = String(process.env.VERCEL_ENV || '').trim();
const projectContext = [
  process.env.VERCEL_PROJECT_NAME,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_URL,
  process.env.NEXT_PUBLIC_VERCEL_URL,
]
  .filter(Boolean)
  .join(' ')
  .toLowerCase();

const duplicateProjectPatterns = [
  /you-are-working-on-a-production/,
  /working-on-a-production/,
];

if (duplicateProjectPatterns.some(pattern => pattern.test(projectContext))) {
  console.log('Vercel build ignored: duplicate Vercel project is attached to the Passage GitHub repo. Use canonical project thepassageappio only.');
  process.exit(0);
}

const skipPatterns = [
  /\[(skip deploy|no deploy)\]/i,
  /\[(skip ci|ci skip)\]/i,
];
const deployPatterns = [
  /\[(deploy|force deploy|prod deploy|production deploy)\]/i,
  /^deploy:/i,
  /^release:/i,
];

if (skipPatterns.some(pattern => pattern.test(message))) {
  console.log('Vercel build ignored: commit explicitly opted out of deployment.');
  process.exit(0);
}

if (deployPatterns.some(pattern => pattern.test(message))) {
  console.log('Vercel build allowed: release marker found in commit message.');
  process.exit(1);
}

console.log(
  'Vercel build ignored for ' + (env || 'unknown environment') +
  ' on ' + (ref || 'unknown ref') +
  '. Batch QA/work changes and add [deploy] to the release commit when ready.'
);
process.exit(0);
