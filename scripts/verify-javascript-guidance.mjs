// Read-only browser verification of the JavaScript-disabled recovery message.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.VERIFY_ORIGIN || 'http://127.0.0.1:3210';
const paths = ['/', '/about', '/start', '/r/not-an-invitation'];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const javaScriptEnabled of [false, true]) {
    for (const width of [1280, 390, 360, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled });
      for (const path of paths) {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const response = await page.goto(origin + path, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200, path);
        if (!javaScriptEnabled) {
          const notice = page.locator('.javascript-notice');
          assert.ok(await notice.isVisible(), path);
          assert.equal(await notice.locator('h1').textContent(), 'Turn on JavaScript to open this page');
          assert.ok((await notice.textContent()).includes('Then reload this page.'));
          for (const loading of await page.locator('[data-route-loading]').all()) {
            assert.equal(await loading.isVisible(), false, 'No endless loading cue');
          }
          if (path === '/' && width === 320) await page.screenshot({ path: 'work/javascript-guidance-320.png' });
        } else {
          assert.equal(await page.locator('.javascript-notice').count(), 0, 'No notice when scripts work');
          assert.ok(await page.locator('h1').first().isVisible(), path);
        }
        assert.deepEqual(errors, [], path);
        assert.equal(await page.locator('html').evaluate(el => el.scrollWidth > el.clientWidth), false, path);
        results.push({ path, width, javaScriptEnabled, passed: true });
        await page.close();
      }
      await context.close();
      console.log(`Passed ${results.length} cases.`);
    }
  }
} finally { await browser.close(); }
writeFileSync('work/javascript-guidance-results.json', JSON.stringify({ origin, results }, null, 2));
console.log(`PASS: ${results.length} JavaScript recovery and normal-page checks; no forms submitted.`);
