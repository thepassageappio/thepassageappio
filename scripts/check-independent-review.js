#!/usr/bin/env node

const https = require('node:https');

const isDraft = String(process.env.PR_DRAFT || '').toLowerCase() === 'true';
const author = String(process.env.PR_AUTHOR || '').toLowerCase();
const headSha = String(process.env.PR_HEAD_SHA || '').toLowerCase();

function fail(message) {
  console.error('Independent human review check failed:');
  console.error(message);
  process.exit(1);
}

function eligible(login) {
  const normalized = String(login || '').toLowerCase();
  return normalized && normalized !== author && !normalized.endsWith('[bot]');
}

function fromInjectedReviewers() {
  if (!Object.prototype.hasOwnProperty.call(process.env, 'APPROVING_REVIEWERS')) return null;
  const types = new Map(String(process.env.APPROVING_REVIEWER_TYPES || '').split(',').map((item) => item.trim().split(':')).filter((item) => item.length === 2));
  return String(process.env.APPROVING_REVIEWERS || '').split(',').map((item) => item.trim()).filter(Boolean).map((login) => ({ login, type: types.get(login) || 'User' }));
}

function requestReviews() {
  const repository = process.env.GITHUB_REPOSITORY;
  const number = process.env.PR_NUMBER;
  const token = process.env.GITHUB_TOKEN;
  const api = process.env.GITHUB_API_URL || 'https://api.github.com';
  if (!repository || !number || !token) fail('Missing GitHub repository, PR number, or read token.');
  const url = new URL(`/repos/${repository}/pulls/${number}/reviews?per_page=100`, api);
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'passage-release-train',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }, (response) => {
      let raw = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { raw += chunk; });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`GitHub reviews API returned ${response.statusCode}.`));
          return;
        }
        try { resolve(JSON.parse(raw)); } catch (error) { reject(error); }
      });
    });
    request.on('error', reject);
  });
}

async function main() {
  if (isDraft) {
    console.log('Independent human review is deferred while the PR remains draft.');
    return;
  }

  const injected = fromInjectedReviewers();
  if (injected) {
    if (!injected.some((reviewer) => reviewer.type === 'User' && eligible(reviewer.login))) fail('No approval from a separate human account.');
    console.log('Independent human review check passed.');
    return;
  }

  const reviews = await requestReviews();
  const latestByReviewer = new Map();
  for (const review of reviews) {
    const login = review?.user?.login;
    if (!login) continue;
    const previous = latestByReviewer.get(login);
    const submittedAt = Date.parse(review.submitted_at || '') || 0;
    if (!previous || submittedAt >= previous.submittedAt) {
      latestByReviewer.set(login, { state: review.state, submittedAt, commitId: String(review.commit_id || '').toLowerCase(), accountType: review?.user?.type });
    }
  }

  const approvers = [...latestByReviewer.entries()]
    .filter(([login, review]) => review.state === 'APPROVED' && review.accountType === 'User' && eligible(login) && (!headSha || review.commitId === headSha))
    .map(([login]) => login);
  if (!approvers.length) fail('A ready PR requires approval from a separate human GitHub account.');
  console.log(`Independent human review passed: ${approvers.join(', ')}`);
}

main().catch((error) => fail(error.message));
