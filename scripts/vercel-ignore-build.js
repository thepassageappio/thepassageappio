#!/usr/bin/env node

const CANONICAL_PROJECT_ID = 'prj_b7CKwanQaKwFQSHInr3l6wsZy9nD';
const CANONICAL_PROJECT_NAME = 'thepassageappio';

const message = String(process.env.VERCEL_GIT_COMMIT_MESSAGE || '').trim();
const ref = String(process.env.VERCEL_GIT_COMMIT_REF || '').trim();
const env = String(process.env.VERCEL_ENV || '').trim();
const projectId = String(process.env.VERCEL_PROJECT_ID || '').trim();
const projectName = String(process.env.VERCEL_PROJECT_NAME || '').trim();
const projectProductionUrl = String(process.env.VERCEL_PROJECT_PRODUCTION_URL || '').trim();
const deploymentUrl = String(process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || '').trim();
const projectContext = [projectId, projectName, projectProductionUrl, deploymentUrl]
  .filter(Boolean)
  .join(' ')
  .toLowerCase();

function ignore(reason) {
  console.log('Vercel build ignored: ' + reason);
  console.log(
    'Vercel context: env=' + (env || 'unknown') +
    ' ref=' + (ref || 'unknown') +
    ' projectId=' + (projectId || 'unknown') +
    ' projectName=' + (projectName || 'unknown') +
    ' productionUrl=' + (projectProductionUrl || 'unknown') +
    ' deploymentUrl=' + (deploymentUrl || 'unknown')
  );
  process.exit(0);
}

function allow(reason) {
  console.log('Vercel build allowed: ' + reason);
  console.log(
    'Vercel context: env=' + (env || 'unknown') +
    ' ref=' + (ref || 'unknown') +
    ' projectId=' + (projectId || 'unknown') +
    ' projectName=' + (projectName || 'unknown') +
    ' productionUrl=' + (projectProductionUrl || 'unknown') +
    ' deploymentUrl=' + (deploymentUrl || 'unknown')
  );
  process.exit(1);
}

const duplicateProjectPatterns = [
  /you-are-working-on-a-production/,
  /working-on-a-production/,
];

if (projectId && projectId !== CANONICAL_PROJECT_ID) {
  ignore('non-canonical Vercel project id ' + projectId + ' is attached to this GitHub repo. Use ' + CANONICAL_PROJECT_NAME + ' only.');
}

if (duplicateProjectPatterns.some(pattern => pattern.test(projectContext))) {
  ignore('duplicate Vercel project is attached to the Passage GitHub repo. Use canonical project ' + CANONICAL_PROJECT_NAME + ' only.');
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
const qaApprovalPatterns = [
  /\[qa-approved\]/i,
  /\[qa approved\]/i,
];

if (skipPatterns.some(pattern => pattern.test(message))) {
  ignore('commit explicitly opted out of deployment.');
}

if (deployPatterns.some(pattern => pattern.test(message))) {
  if (!qaApprovalPatterns.some(pattern => pattern.test(message))) {
    ignore('deploy marker found without [qa-approved]. Finish Product Manager, Development Engineer, and QA handoffs before release.');
  }
  allow('release marker and QA approval marker found in commit message for canonical project guard.');
}

ignore('batch QA/work changes and add [deploy] [qa-approved] to the release commit when ready.');
