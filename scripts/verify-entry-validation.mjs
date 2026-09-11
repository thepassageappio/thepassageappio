// Native invalid-form checks only. Never submit a valid form or send email.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origins = process.argv.slice(2);
assert.ok(origins.length && process.env.EXPECTED_SHA);
const proof = { checkedAt: new Date().toISOString(), origins: [], cases: [], blockedWrites: [] };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const origin of origins) {
    const context = await browser.newContext();
    await context.route('**/*', route => {
      if (['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) return route.continue();
      proof.blockedWrites.push(new URL(route.request().url()).pathname);
      return route.abort();
    });
    await context.addInitScript(() => {
      window.__blockedSubmits = 0;
      document.addEventListener('submit', e => { window.__blockedSubmits++; e.preventDefault(); e.stopImmediatePropagation(); }, true);
    });
    const response = await context.request.get(`${origin}/api/version`);
    assert.equal(response.status(), 200);
    const version = await response.json();
    assert.equal(version.source.sha, process.env.EXPECTED_SHA);
    assert.equal(version.source.ref, 'main');
    assert.equal(version.source.repository, 'thepassageappio/thepassageappio');
    assert.equal(version.provenance, 'verified');
    proof.origins.push({ origin, sha: version.source.sha });
    for (const path of ['/start', '/start?intent=sample&next=/sample', '/contact']) for (const width of [1280, 390, 360]) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: 900 });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(new URL(path, origin).href, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      const form = page.locator('form').filter({ has: page.locator('input[name="email"]') });
      assert.equal(await form.count(), 1);
      const fields = form.locator('input:not([type="hidden"]):not([name="website"]), select, textarea');
      assert.ok(await fields.evaluateAll(els => els.every(el => el.labels?.length && [...el.labels].some(label => label.textContent.trim()))), 'Every field needs an associated label.');
      const invalidChecks = [];
      async function invalid(expectedName) {
        assert.equal(await form.evaluate(el => el.checkValidity()), false, 'Never click a valid form.');
        await form.locator('button[type="submit"]').click();
        const state = await page.evaluate(() => {
          const el = document.activeElement, r = el.getBoundingClientRect();
          return { name: el.getAttribute('name'), message: el.validationMessage, valid: el.validity?.valid,
            inView: r.top >= -1 && r.bottom <= innerHeight + 1 && r.left >= -1 && r.right <= innerWidth + 1,
            blockedSubmits: window.__blockedSubmits };
        });
        assert.equal(state.name, expectedName);
        assert.equal(state.valid, false);
        assert.ok(state.message && state.inView, JSON.stringify({ origin, path, width, state }));
        assert.equal(state.blockedSubmits, 0, 'Native invalidity must stop the submit event.');
        invalidChecks.push({ field: state.name, message: state.message });
      }
      const contact = path === '/contact', sample = path.includes('intent=sample');
      await invalid(contact || sample ? 'fullName' : 'email');
      await form.locator('[name="fullName"]').fill('Demo Reviewer');
      await form.locator('[name="email"]').fill('not-an-email');
      await invalid('email');
      assert.equal(await form.locator('[name="fullName"]').inputValue(), 'Demo Reviewer');
      await form.locator('[name="email"]').fill('demo-reviewer@example.invalid');
      if (contact) {
        await form.locator('[name="organizationName"]').fill('Fictional Evaluation Team');
        await form.locator('[name="jobRole"]').fill('Operations');
        await form.locator('[name="organizationType"]').selectOption('bank');
        await form.locator('[name="currentProcess"]').selectOption('email_and_documents');
        await form.locator('[name="message"]').fill('Fictional browser validation check. Not submitted.');
        await invalid('contactConsent');
        assert.equal(await form.locator('[name="organizationName"]').inputValue(), 'Fictional Evaluation Team');
        assert.equal(await form.locator('[name="message"]').inputValue(), 'Fictional browser validation check. Not submitted.');
        await form.locator('[name="contactConsent"]').check();
      }
      assert.equal(await form.evaluate(el => el.checkValidity()), true, 'Correcting fields should clear native invalidity.');
      assert.equal(await page.evaluate(() => window.__blockedSubmits), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.deepEqual(errors, []);
      proof.cases.push({ origin, path, width, invalidChecks, correctedValidity: true, retainedValues: true, pageErrors: errors });
      await page.close();
    }
    await context.close();
    console.log(`Checked ${origin}`);
  }
} finally { await browser.close(); }
mkdirSync('work', { recursive: true });
writeFileSync('work/entry-validation-proof.json', JSON.stringify(proof, null, 2));
assert.deepEqual(proof.blockedWrites.filter(x => x !== '/cdn-cgi/rum'), []);
console.log(`PASS: ${proof.cases.length} form cases, ${proof.cases.reduce((n, c) => n + c.invalidChecks.length, 0)} invalid attempts. No submit events or application writes.`);
