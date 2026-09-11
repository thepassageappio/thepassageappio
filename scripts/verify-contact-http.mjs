// Intercept HTTP failures in the browser; only invalid-key preflight retries reach the server.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.argv[2] || 'http://127.0.0.1:3121';
assert.ok(origin === 'http://127.0.0.1:3121' || new URL(origin).protocol === 'https:');
const headers = process.env.PROTECTED_PREVIEW_FILE ? { 'x-vercel-protection-bypass': Object.keys(JSON.parse(readFileSync(process.env.PROTECTED_PREVIEW_FILE, 'utf8').replace(/^\uFEFF/, '')).protectionBypass)[0] } : {};
if (origin.startsWith('https:')) {
  assert.ok(process.env.EXPECTED_SHA, 'Set EXPECTED_SHA for hosted verification');
  const version = await (await fetch(origin + '/api/version', { headers })).json();
  assert.equal(version.source.sha, process.env.EXPECTED_SHA);
  assert.equal(version.source.ref, process.env.EXPECTED_REF || 'main');
  assert.equal(version.source.repository, 'thepassageappio/thepassageappio');
  assert.equal(version.provenance, 'verified');
}
mkdirSync('work', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const proof = { origin, sha: process.env.EXPECTED_SHA || 'local-build', cases: [], posts: 0, injected: 0, preflights: 0, honeypotRedirects: 0 };
try {
  for (const width of [1280, 390, 360, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    let post = 0;
    await context.route('**/*', async route => {
      if (!route.request().url().startsWith(origin + '/')) return route.abort();
      if (!['GET', 'HEAD'].includes(route.request().method())) {
        assert.equal(new URL(route.request().url()).pathname, '/contact');
        assert.equal(route.request().method(), 'POST');
        proof.posts++; post++;
        assert.ok(post <= 5);
        assert.ok(route.request().postData()?.includes('invalid-preflight-test'), 'Only deliberately invalid commands may leave the browser');
        await new Promise(resolve => setTimeout(resolve, 400));
        const injected = [
          { status: 503, contentType: 'text/html', body: '<h1>Service temporarily unavailable</h1>' },
          { status: 429, contentType: 'text/plain', body: 'Do not show this raw upstream diagnostic' },
          { status: 502, contentType: 'application/json', body: '{"error":"private upstream detail"}' },
        ][post - 1];
        if (injected) { proof.injected++; return route.fulfill(injected); }
        if (post === 4) proof.preflights++;
        else { assert.ok(route.request().postData()?.includes('rehearsal-bot')); proof.honeypotRedirects++; }
      }
      return route.continue({ headers: { ...route.request().headers(), ...headers } });
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(origin + '/contact', { waitUntil: 'networkidle' });
    const form = page.locator('form');
    const values = { fullName: 'Demo Reviewer', email: 'demo@example.invalid', organizationName: 'Fictional Team', jobRole: 'Operations', message: 'Fictional recovery check' };
    for (const [name, value] of Object.entries(values)) await form.locator(`[name="${name}"]`).fill(value);
    await form.locator('[name="organizationType"]').selectOption('bank');
    await form.locator('[name="currentProcess"]').selectOption('email_and_documents');
    await form.locator('[name="contactConsent"]').check();
    await form.locator('[name="idempotencyKey"]').evaluate(el => { el.value = 'invalid-preflight-test'; }); const key = 'invalid-preflight-test';
    for (let attempt = 1; attempt <= 4; attempt++) {
      await page.getByRole('button', { name: 'Request walkthrough', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('fieldset')?.disabled === true);
      try {
        await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'alert' && !document.querySelector('fieldset')?.disabled, null, { timeout: 10000 });
      } catch (error) {
        const failure = { ...proof, width, attempt, headings: await page.locator('h1').allTextContents(), forms: await page.locator('form').count(), errors };
        writeFileSync('work/contact-http-failure.json', JSON.stringify(failure, null, 2));
        console.log(JSON.stringify(failure));
        throw error;
      }
      assert.match(await form.getByRole('alert').innerText(), attempt < 4 ? /could not confirm that your request was saved/ : /Check the required fields/);
      for (const [name, value] of Object.entries(values)) assert.equal(await form.locator(`[name="${name}"]`).inputValue(), value);
      assert.equal(await form.locator('[name="organizationType"]').inputValue(), 'bank');
      assert.equal(await form.locator('[name="currentProcess"]').inputValue(), 'email_and_documents');
      assert.equal(await form.locator('[name="contactConsent"]').isChecked(), true);
      assert.equal(await form.locator('[name="idempotencyKey"]').inputValue(), key);
      assert.equal(page.url(), origin + '/contact');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      proof.cases.push({ width, attempt, retainedValues: true, retainedKey: true, errorFocused: true });
    }
    if (width === 360) await page.screenshot({ path: 'work/contact-http-360.png', fullPage: true });
    await form.locator('[name="website"]').evaluate(el => { el.value = 'rehearsal-bot'; });
    await page.getByRole('button', { name: 'Request walkthrough', exact: true }).click();
    await page.waitForURL(origin + '/contact?sent=1');
    assert.deepEqual(errors, []);
    await context.close();
  }
} finally { await browser.close(); }
assert.equal(proof.posts, 20);
assert.equal(proof.injected, 12);
assert.equal(proof.preflights, 4);
assert.equal(proof.honeypotRedirects, 4);
mkdirSync('work', { recursive: true });
writeFileSync('work/contact-http-proof.json', JSON.stringify(proof, null, 2));
console.log(JSON.stringify(proof, null, 2));
