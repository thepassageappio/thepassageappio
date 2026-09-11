// Read-only checks against a running application; no form submissions or auth changes.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.VERIFY_ORIGIN || 'http://127.0.0.1:3210';
// The application currently needs JavaScript to reveal streamed route content.
// Set this flag to reproduce that separate progressive-enhancement gap.
const javaScriptEnabled = process.env.VERIFY_NO_JAVASCRIPT !== '1';
const paths = ['/', '/about', '/blog', '/contact', '/faq', '/integrations', '/pilot',
  '/pricing', '/resources', '/security', '/templates',
  '/blog/how-a-bank-verifies-a-power-of-attorney-request', '/resources/decision-receipts'];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
let currentCase;
try {
    for (const width of [1280, 390, 360, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled });
      for (const path of paths) {
        currentCase = { path, width, javaScriptEnabled };
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const response = await page.goto(origin + path, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200, path);
        assert.equal(await page.locator('#page-content').count(), 1, path);
        assert.equal(await page.locator('h1#page-content').count(), 1, path);
        await page.keyboard.press('Tab');
        assert.equal(await page.locator(':focus').textContent(), 'Skip to page content', path);
        const box = await page.locator(':focus').boundingBox();
        assert.ok(box.y >= 0 && box.height >= 44 && box.x + box.width <= width, path);
        await page.keyboard.press('Enter');
        assert.equal(await page.locator(':focus').getAttribute('id'), 'page-content', path);
        await page.keyboard.press('Tab');
        assert.equal(await page.locator(':focus').evaluate(el => Boolean(el.closest('header nav, header > a, header > div'))), false, path);
        const overflow = await page.locator('html').evaluate(el => el.scrollWidth > el.clientWidth);
        assert.equal(overflow, false, `${path} overflows at ${width}`);
        assert.deepEqual(errors, [], path);
        if (path === '/' && width === 360 && javaScriptEnabled) {
          await page.screenshot({ path: 'work/public-keyboard-home.png', fullPage: true });
        }
        results.push({ path, width, javaScriptEnabled, keyboard: 'passed', overflow });
        await page.close();
      }
      await context.close();
      console.log(`Passed ${results.length} cases; completed ${width}px, JavaScript ${javaScriptEnabled}.`);
    }
} catch (error) {
  console.error('Failed case:', currentCase);
  throw error;
} finally {
  writeFileSync('work/public-keyboard-results.json', JSON.stringify({ origin, results }, null, 2));
  await browser.close();
}
writeFileSync('work/public-keyboard-results.json', JSON.stringify({ origin, results }, null, 2));
console.log(`PASS: ${results.length} public-page keyboard/reflow checks; JavaScript ${javaScriptEnabled}.`);
