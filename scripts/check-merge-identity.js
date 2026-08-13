#!/usr/bin/env node

const author = String(process.env.PR_AUTHOR_LOGIN || '').trim().toLowerCase();
const merger = String(process.env.PR_MERGED_BY_LOGIN || '').trim().toLowerCase();

function fail(message) {
  console.error('Merge identity check failed:');
  console.error(message);
  process.exit(1);
}

if (!author) fail('Missing actual pull-request author identity.');
if (!merger) fail('Missing actual pull-request merger identity.');
if (author === merger) fail(`Pull request author and merger are the same identity: ${author}.`);

console.log(`PASS merge identity separation: author=${author}, merger=${merger}`);
