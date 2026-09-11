import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// Read-only public preflight. Never signs in, creates a draft or sends an email.
const expectedSha = execFileSync('git', ['rev-parse', 'origin/main'], { encoding: 'utf8' }).trim();
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const evidence = { checkedAt: new Date().toISOString(), expectedSha, sites: [] };
for (const origin of ['https://demo.thepassageapp.io', 'https://thepassageapp.io']) {
  const get = async path => {
    const response = await fetch(origin + path, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200, `${origin}${path}: expected 200 without redirect`);
    return response;
  };
  const version = await (await get('/api/version')).json();
  assert.equal(version.source.sha, expectedSha);
  assert.equal(version.source.ref, 'main');
  assert.equal(version.source.repository, 'thepassageappio/thepassageappio');
  assert.equal(version.source.provider, 'github');
  assert.equal(version.provenance, 'verified');
  const pages = [];
  for (const path of ['/', '/start?intent=sign-in', '/start?intent=sample&next=/sample', '/contact']) {
    const response = await get(path);
    assert.match(response.headers.get('content-type'), /text\/html/);
    const body = await response.text();
    assert.ok(/<main[\s>]/.test(body), `${path}: missing main landmark`);
    assert.ok(/<h1[\s>]/.test(body), `${path}: missing page heading`);
    pages.push(path);
  }
  const sample = await (await get('/sample')).text();
  assert.ok(sample.includes('id="__next-page-redirect"')
    && sample.includes('url=/start?intent=sample&amp;next=/sample'), 'Sample must send signed-out visitors to its sign-in gate');
  const files = [];
  for (const name of ['fictional-poa.pdf', 'fictional-identity.pdf']) {
    const response = await get(`/samples/${name}`);
    assert.match(response.headers.get('content-type'), /application\/pdf/);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
    const hash = sha256(bytes);
    assert.equal(hash, sha256(readFileSync(`public/samples/${name}`)));
    files.push({ name, bytes: bytes.length, sha256: hash });
  }
  evidence.sites.push({ origin, source: version.source, pages, sampleSignInGate: true, files });
}
writeFileSync('work/presenter-assets-proof.json', JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
