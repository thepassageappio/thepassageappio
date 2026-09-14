// Hosted malformed-key checks: the verified action rejects before database/provider code.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.argv[2]; assert.ok(['https://thepassageapp.io','https://demo.thepassageapp.io'].includes(origin)); const v = await (await fetch(origin + '/api/version')).json(); assert.equal(v.source.sha, process.env.EXPECTED_SHA); assert.equal(v.provenance,'verified');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const proof = { cases: [], posts: 0 };
try {
  for (const width of [1280, 390, 360, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.route('**/*', async route => {
      if (!route.request().url().startsWith(origin + '/')) return route.abort();
      if (route.request().method() === 'POST') {
        assert.equal(new URL(route.request().url()).pathname, '/contact');
        proof.posts++;
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      return route.continue();
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
    for (let attempt = 1; attempt <= 2; attempt++) {
      await page.getByRole('button', { name: 'Request walkthrough', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('fieldset')?.disabled === true);
      await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'alert' && !document.querySelector('fieldset')?.disabled);
      assert.match(await form.getByRole('alert').innerText(), /Check the required fields/);
      for (const [name, value] of Object.entries(values)) assert.equal(await form.locator(`[name="${name}"]`).inputValue(), value);
      assert.equal(await form.locator('[name="organizationType"]').inputValue(), 'bank');
      assert.equal(await form.locator('[name="currentProcess"]').inputValue(), 'email_and_documents');
      assert.equal(await form.locator('[name="contactConsent"]').isChecked(), true);
      assert.equal(await form.locator('[name="idempotencyKey"]').inputValue(), key);
      assert.equal(page.url(), origin + '/contact');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      proof.cases.push({ width, attempt, retainedValues: true, retainedKey: true, errorFocused: true });
    }
    assert.deepEqual(errors, []);
    if (width === 360) await page.screenshot({ path: 'work/contact-hosted-preflight-360.png', fullPage: true });
    await context.close();
  }
} finally { await browser.close(); }
assert.equal(proof.posts, 8);
mkdirSync('work', { recursive: true });
writeFileSync('work/contact-hosted-preflight-proof.json', JSON.stringify(proof, null, 2));
console.log('PASS: 8 hosted malformed-key preflight denials at four widths, values/key retained and error focused. Invalid key returns before database/provider code.');
