// Render the real read-only policy page with controlled query outcomes.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
const require = createRequire(import.meta.url);
let data = null, error = null, membership = { organizationId: 'fixture-org' }, queryCount = 0;
const query = {
  select: () => query,
  eq: (column, value) => { assert.equal(column, 'organization_id'); assert.equal(value, 'fixture-org'); return query; },
  maybeSingle: async () => ({ data, error }),
};
const mocks = {
  '@/lib/authority/access': { getAuthorityAccessContext: async () => ({ membership }) },
  '@/lib/supabase/server': { createClient: async () => ({ from: table => {
    assert.equal(table, 'organization_template_selections'); queryCount++; return query;
  } }) },
};
const source = readFileSync('src/app/app/policies/page.tsx', 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
const loadedModule = { exports: {} };
new Function('require', 'module', 'exports', output)(name => {
  if (mocks[name]) return mocks[name];
  if (name.endsWith('.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
  return require(name);
}, loadedModule, loadedModule.exports);
const render = async () => renderToStaticMarkup(await loadedModule.exports.default());
const screens = [];
const cases = [
  { data: null, error: null, heading: 'No policy selected' },
  { data: null, error: { message: 'private diagnostic' }, heading: 'We could not load your policy', retry: true },
  { data: { template_key: 'ny_financial_poa', template_version: '2026.1' }, error: { message: 'private diagnostic' }, heading: 'We could not load your policy', retry: true },
  { data: { template_key: 'other_policy', template_version: '2026.1' }, error: null, heading: 'This saved policy is not supported' },
  { data: { template_key: 'ny_financial_poa', template_version: 'future-version' }, error: null, heading: 'This saved policy is not supported' },
  { data: { template_key: 'ny_financial_poa', template_version: '' }, error: null, heading: 'This saved policy is not supported' },
];
for (const fixture of cases) {
  ({ data, error } = fixture);
  const html = await render();
  screens.push({ heading: fixture.heading, html });
  assert.ok(html.includes(`<h1>${fixture.heading}</h1>`));
  assert.ok(!html.includes('2026.1') && !html.includes('May be requested') && !html.includes('>Selected<'));
  assert.ok(!html.includes('private diagnostic'));
  assert.equal(html.includes('Reload policy'), Boolean(fixture.retry));
  if (fixture.retry) assert.ok(html.includes('method="get"'));
}
data = { template_key: 'ny_financial_poa', template_version: '2026.1' }; error = null;
const selected = await render();
screens.push({ heading: 'Selected', html: selected });
assert.ok(selected.includes('>Selected<') && selected.includes('2026.1') && selected.includes('May be requested'));
assert.ok(!selected.includes('>Active<'));
const before = queryCount; membership = null;
assert.equal(await render(), '');
assert.equal(queryCount, before, 'No policy read without membership');
console.log('PASS: 8 real-page policy states, organization-filter assertion and read-only retry. Query outcomes are mocked; no hosted authorization claim.');
if (process.env.PLAYWRIGHT_MODULE) {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  let count = 0;
  try {
    for (const width of [1280, 390, 360, 320]) {
      for (const [index, screen] of screens.entries()) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, javaScriptEnabled: false });
        await page.setContent(`<html lang="en"><head><style>${readFileSync('src/app/globals.css', 'utf8')}\n${readFileSync('src/components/app/app-shell.module.css', 'utf8')}</style></head><body><main class="main">${screen.html}</main></body></html>`);
        assert.ok(await page.locator('h1').isVisible());
        assert.equal(await page.locator('html').evaluate(el => el.scrollWidth > el.clientWidth), false);
        if (await page.getByRole('button', { name: 'Reload policy' }).count()) {
          await page.keyboard.press('Tab');
          assert.equal(await page.locator(':focus').textContent(), 'Reload policy');
          assert.ok((await page.locator(':focus').boundingBox()).height >= 44);
        }
        if (width === 320 && (index === 1 || index === 6)) await page.screenshot({ path: `work/policy-overview-${index}.png` });
        await page.close(); count++;
      }
    }
  } finally { await browser.close(); }
  console.log(`PASS: ${count} policy-page browser layout cases; actual page markup and styles, mocked data.`);
}
