// Read-only live entry checks. Never submit forms or follow sign-in actions.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origins = process.argv.slice(2);
assert.ok(origins.length, 'Pass the exact live origin(s) to verify.');
const paths = ['/', '/start', '/contact', '/sample/access'];
const proof = { checkedAt: new Date().toISOString(), origins: [], cases: [], downloads: [], blockedRequests: [] };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const origin of origins) {
    const context = await browser.newContext();
    const blockedWrites = [];
    await context.route('**/*', route => {
      if (['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) return route.continue();
      blockedWrites.push(new URL(route.request().url()).pathname);
      return route.abort();
    });
    const versionResponse = await context.request.get(new URL('/api/version', origin).href);
    assert.equal(versionResponse.status(), 200);
    const version = await versionResponse.json();
    assert.equal(version.provenance, 'verified');
    assert.equal(version.source.ref, 'main');
    assert.equal(version.source.repository, 'thepassageappio/thepassageappio');
    if (process.env.EXPECTED_SHA) assert.equal(version.source.sha, process.env.EXPECTED_SHA);
    proof.origins.push({ origin, sha: version.source.sha });
    for (const path of paths) for (const width of [1280, 390, 360, 320]) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: 900 });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(new URL(path, origin).href, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200, `${origin}${path}`);
      const destination = new URL(page.url());
      assert.equal(destination.pathname, path === '/sample/access' ? '/start' : path);
      if (path === '/sample/access') {
        assert.equal(destination.searchParams.get('intent'), 'sample');
        assert.equal(destination.searchParams.get('next'), '/sample');
        assert.ok(await page.getByRole('heading', { name: 'Sign in to view the sample', exact: true }).isVisible());
      }
      assert.equal(await page.locator('h1:visible').count(), 1);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow ${path} ${width}`);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').textContent(), 'Skip to page content');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator(':focus').getAttribute('id'), 'page-content');
      let focusedControls = 0;
      for (let step = 0; step < 30; step++) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const rect = el.getBoundingClientRect(), style = getComputedStyle(el);
          return { tag: el.tagName, text: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('name') || '').trim().slice(0,100),
            visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none',
            onScreen: rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth };
        });
        if (!focused) break;
        assert.ok(focused.visible && focused.onScreen, `hidden/offscreen focus ${origin}${path} ${width}: ${JSON.stringify(focused)}`);
        focusedControls++;
      }
      assert.ok(focusedControls >= 2, `No useful keyboard path: ${path}`);
      assert.deepEqual(errors, [], `${origin}${path} ${width}`);
      proof.cases.push({ origin, path, destination: destination.pathname, width, focusedControls, pageErrors: errors.length });
      await page.close();
    }
    for (const name of ['fictional-poa.pdf', 'fictional-identity.pdf']) {
      const response = await context.request.get(new URL(`/samples/${name}`, origin).href);
      assert.equal(response.status(), 200);
      assert.match(response.headers()['content-type'], /application\/pdf/);
      assert.equal((await response.body()).subarray(0, 4).toString(), '%PDF');
      proof.downloads.push({ origin, name, status: response.status() });
    }
    // Keep blocking the observed RUM endpoint too; it is not an application form submission.
    assert.deepEqual(blockedWrites.filter(path => path !== '/cdn-cgi/rum'), [], 'Unexpected application write attempts were blocked.');
    proof.blockedRequests.push({ origin, path: '/cdn-cgi/rum', count: blockedWrites.length });
    await context.close();
  }
} finally { await browser.close(); }
writeFileSync('work/buyer-entry-proof.json', JSON.stringify(proof, null, 2));
console.log(`PASS: ${proof.cases.length} live entry cases, ${proof.downloads.length} sample downloads, skip links, keyboard traversal, reflow and no page errors. No form submitted; no authenticated or inbox-delivery claim.`);
