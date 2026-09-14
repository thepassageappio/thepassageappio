// Native Chrome profile zoom, not CSS zoom, text injection or pinch emulation.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origins = process.argv.slice(2);
assert.ok(origins.length && process.env.EXPECTED_SHA, 'Pass origins and EXPECTED_SHA.');
mkdirSync('work', { recursive: true });
const paths = ['/', '/start', '/contact', '/sample/access', `/r/${'0'.repeat(64)}`, '/request/00000000-0000-4000-8000-000000000000/overview'];
const proof = { checkedAt: new Date().toISOString(), versions: [], calibration: [], cases: [], findings: [], blockedWrites: [] };
for (const factor of [1, 2, 4]) {
  const profile = mkdtempSync(resolve('work/native-zoom-'));
  mkdirSync(join(profile, 'Default'));
  // Chromium's default storage partition key is x; zoom factor = 1.2 ** level.
  writeFileSync(join(profile, 'Default', 'Preferences'), JSON.stringify({ partition: { default_zoom_level: { x: Math.log(factor) / Math.log(1.2) } } }));
  const context = await chromium.launchPersistentContext(profile, { channel: 'chrome', headless: true, viewport: null,
    args: ['--window-size=1296,900', '--force-device-scale-factor=1'] });
  try {
    await context.route('**/*', route => {
      if (['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) return route.continue();
      proof.blockedWrites.push(new URL(route.request().url()).pathname);
      return route.abort();
    });
    for (const origin of origins) {
      const response = await context.request.get(`${origin}/api/version`);
      assert.equal(response.status(), 200);
      const version = await response.json();
      assert.equal(version.source.sha, process.env.EXPECTED_SHA);
      assert.equal(version.source.ref, 'main');
      assert.equal(version.source.repository, 'thepassageappio/thepassageappio');
      assert.equal(version.provenance, 'verified');
      proof.versions.push({ origin, factor, sha: version.source.sha });
      for (const path of factor === 1 ? ['/start'] : paths) {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const response = await page.goto(new URL(path, origin).href, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200);
        const metrics = await page.evaluate(() => ({ width: innerWidth, outerWidth, dpr: devicePixelRatio,
          pinchScale: visualViewport.scale, scrollWidth: document.documentElement.scrollWidth }));
        assert.equal(metrics.width, 1280 / factor, 'Native zoom must change the layout viewport.');
        assert.ok(Math.abs(metrics.dpr - factor) < 0.01, 'Native zoom must change devicePixelRatio.');
        assert.equal(metrics.pinchScale, 1, 'Pinch zoom must remain unused.');
        if (factor === 1) { proof.calibration.push({ origin, ...metrics }); await page.close(); continue; }
        await page.keyboard.press('Tab');
        assert.equal(await page.locator(':focus').textContent(), 'Skip to page content');
        await page.keyboard.press('Enter');
        assert.equal(await page.locator(':focus').getAttribute('id'), 'page-content');
        const focusProblems = [];
        let focusStops = 0, reachedEnd = false;
        for (let step = 0; step < 100; step++) {
          await page.keyboard.press('Tab');
          const current = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body) return null;
            const r = el.getBoundingClientRect(), s = getComputedStyle(el);
            return { label: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('name') || '').trim().slice(0, 100),
              visible: r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none',
              inView: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth };
          });
          if (!current) { reachedEnd = true; break; }
          focusStops++;
          if (!current.visible || !current.inView) focusProblems.push(current);
        }
        const record = { origin, path, factor, ...metrics, focusStops, reachedEnd, focusProblems, pageErrors: errors };
        proof.cases.push(record);
        if (metrics.scrollWidth > metrics.width || !reachedEnd || focusStops < 1 || focusProblems.length || errors.length) proof.findings.push(record);
        if (origin.includes('demo.') && path === '/start') {
          // Playwright fullPage capture crops incorrectly with native profile zoom.
          const cdp = await context.newCDPSession(page);
          for (const part of ['top', 'bottom']) {
            await page.evaluate(part => scrollTo(0, part === 'top' ? 0 : document.documentElement.scrollHeight), part);
            const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
            writeFileSync(`work/native-zoom-${factor * 100}-${part}.png`, Buffer.from(shot.data, 'base64'));
          }
          await cdp.detach();
        }
        await page.close();
      }
      console.log(`Checked ${origin} at ${factor * 100}%`);
    }
  } finally { await context.close(); }
}
writeFileSync('work/native-zoom-proof.json', JSON.stringify(proof, null, 2));
assert.deepEqual(proof.blockedWrites.filter(path => path !== '/cdn-cgi/rum'), []);
console.log(JSON.stringify({ cases: proof.cases.length, findings: proof.findings }, null, 2));
assert.equal(proof.findings.length, 0);
