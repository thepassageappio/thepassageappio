// Read-only public accessibility checks; no native zoom or screen-reader claim.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origins = process.argv.slice(2);
assert.ok(origins.length && process.env.EXPECTED_SHA, 'Pass exact origins and EXPECTED_SHA.');
const paths = ['/', '/start', '/contact', '/sample/access', `/r/${'0'.repeat(64)}`, '/request/00000000-0000-4000-8000-000000000000/overview'];
const proof = { checkedAt: new Date().toISOString(), origins: [], cases: [], findings: [], blockedWrites: [] };
mkdirSync('work', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const origin of origins) {
    const context = await browser.newContext();
    await context.route('**/*', route => {
      if (['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) return route.continue();
      proof.blockedWrites.push({ origin, path: new URL(route.request().url()).pathname });
      return route.abort();
    });
    const response = await context.request.get(`${origin}/api/version`);
    assert.equal(response.status(), 200);
    const version = await response.json();
    assert.equal(version.source.sha, process.env.EXPECTED_SHA);
    assert.equal(version.source.ref, 'main');
    assert.equal(version.source.repository, 'thepassageappio/thepassageappio');
    assert.equal(version.provenance, 'verified');
    proof.origins.push({ origin, sha: version.source.sha });
    for (const path of paths) for (const mode of ['text-200', 'reflow-320']) {
      const page = await context.newPage();
      await page.setViewportSize({ width: mode === 'text-200' ? 1280 : 320, height: 900 });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const loaded = await page.goto(new URL(path, origin).href, { waitUntil: 'networkidle' });
      assert.equal(loaded.status(), 200);
      if (mode === 'text-200') await page.evaluate(() => {
        // Capture original computed values first to avoid doubling inherited sizes twice.
        const sizes = [...document.querySelectorAll('body, body *')].map(el => {
          const style = getComputedStyle(el);
          return { el, font: parseFloat(style.fontSize), line: parseFloat(style.lineHeight) };
        });
        for (const { el, font, line } of sizes) {
          if (Number.isFinite(font)) el.style.setProperty('font-size', `${font * 2}px`, 'important');
          if (Number.isFinite(line)) el.style.setProperty('line-height', `${line * 2}px`, 'important');
        }
      });
      const cdp = await context.newCDPSession(page);
      const { nodes } = await cdp.send('Accessibility.getFullAXTree');
      const exposed = nodes.filter(n => !n.ignored);
      const roles = ['link', 'button', 'textbox', 'checkbox', 'combobox', 'DisclosureTriangle'];
      const controls = exposed.filter(n => roles.includes(n.role?.value));
      const unnamed = controls.filter(n => !n.name?.value?.trim()).map(n => n.role.value);
      const layout = await page.evaluate(() => ({
        language: document.documentElement.lang,
        overflow: document.documentElement.scrollWidth > innerWidth,
        clippedControls: [...document.querySelectorAll('button, a, summary')].filter(el => {
          const rect = el.getBoundingClientRect(), style = getComputedStyle(el);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' &&
            ((['hidden', 'clip'].includes(style.overflowX) && el.scrollWidth > el.clientWidth + 2) ||
             (['hidden', 'clip'].includes(style.overflowY) && el.scrollHeight > el.clientHeight + 2));
        }).map(el => el.textContent.trim().slice(0, 100))
      }));
      const record = { origin, path, mode, ...layout, controls: controls.length, unnamed,
        mainLandmarks: exposed.filter(n => n.role?.value === 'main').length,
        firstLevelHeadings: exposed.filter(n => n.role?.value === 'heading' && n.properties?.some(p => p.name === 'level' && p.value?.value === 1)).length,
        pageErrors: errors };
      proof.cases.push(record);
      if (layout.overflow || layout.clippedControls.length || unnamed.length || !layout.language || record.mainLandmarks !== 1 || record.firstLevelHeadings !== 1 || errors.length) proof.findings.push(record);
      if (origin.includes('demo.') && path === '/start') await page.screenshot({ path: `work/entry-${mode}.png`, fullPage: true });
      await cdp.detach();
      await page.close();
    }
    await context.close();
    console.log(`Checked ${origin}`);
  }
} finally { await browser.close(); }
writeFileSync('work/entry-accessibility-proof.json', JSON.stringify(proof, null, 2));
assert.deepEqual(proof.blockedWrites.filter(x => x.path !== '/cdn-cgi/rum'), [], 'Unexpected application writes blocked.');
console.log(JSON.stringify({ cases: proof.cases.length, findings: proof.findings }, null, 2));
assert.equal(proof.findings.length, 0, 'Review accessibility findings in work/entry-accessibility-proof.json.');
