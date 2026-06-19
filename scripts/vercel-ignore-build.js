#!/usr/bin/env node

const message = String(process.env.VERCEL_GIT_COMMIT_MESSAGE || '').trim();
const ref = String(process.env.VERCEL_GIT_COMMIT_REF || '').trim();
const env = String(process.env.VERCEL_ENV || '').trim();

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
