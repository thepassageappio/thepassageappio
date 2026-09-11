// Real shared-layout markup and styles in Chromium; synthetic children, no auth or database.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const css = new Set();
const mocks = {
  'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
  '@/app/account-actions': { signOutAction: '/fixture-sign-out' },
  '@/lib/authority/access': { roleLabel: role => role },
  '@/lib/authority/role-capabilities': { canCoordinateAuthorityRequests: () => true },
  '@/lib/authority/mfa-policy': { roleRequiresMfa: () => true },
};
function load(file) {
  const output = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  }}).outputText;
  const loadedModule = { exports: {} };
  new Function('require', 'module', 'exports', output)(name => {
    if (mocks[name]) return mocks[name];
    if (name.endsWith('.css')) {
      css.add(readFileSync(resolve(dirname(file), name), 'utf8'));
      return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    }
    return require(name);
  }, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const layout of ['AppShell', 'AccountFrame']) {
    css.clear();
    const directory = layout === 'AppShell' ? 'app' : 'account';
    const Component = load(resolve(`src/components/${directory}/${layout}.tsx`))[layout];
    const children = React.createElement('div', null,
      layout === 'AppShell' ? React.createElement('h1', null, 'Your requests') : null,
      React.createElement('button', { type: 'button', id: 'first-content-action' }, 'Continue'));
    const props = layout === 'AppShell'
      ? { access: { membership: { role: 'owner' }, organization: { displayName: 'Sample Bank' }, user: { email: 'sample@example.test' } } }
      : { eyebrow: 'Your request', title: 'Review your details', description: 'Check these details before you continue.' };
    const html = renderToStaticMarkup(React.createElement(Component, props, children));
    for (const width of [1280, 390, 360, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 800 }, javaScriptEnabled: false });
      const page = await context.newPage();
      await page.setContent(`<html lang="en"><head><style>${readFileSync('src/app/globals.css', 'utf8')}\n${[...css].join('\n')}</style></head><body>${html}</body></html>`);
      const hidden = await page.locator('.skip-link').boundingBox();
      assert.ok(hidden.y + hidden.height <= 0, 'Shortcut stays off screen before focus');
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').textContent(), 'Skip to page content');
      const box = await page.locator('.skip-link').boundingBox();
      assert.ok(box.y >= 0 && box.x >= 0 && box.height >= 44 && box.x + box.width <= width);
      if (width === 360) await page.screenshot({ path: `work/skip-${layout}.png` });
      await page.keyboard.press('Enter');
      assert.equal(await page.locator(':focus').getAttribute('id'), 'page-content');
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').getAttribute('id'), 'first-content-action');
      assert.equal(await page.locator('#page-content').count(), 1);
      const dimensions = await page.locator('html').evaluate(el => ({ scroll: el.scrollWidth, client: el.clientWidth }));
      assert.ok(dimensions.scroll <= dimensions.client, `${layout} overflow at ${width}`);
      results.push({ layout, width, javaScript: false, keyboard: 'passed', overflow: false });
      await context.close();
    }
  }
} finally { await browser.close(); }
writeFileSync('work/skip-navigation-results.json', JSON.stringify(results, null, 2));
console.log(`PASS: ${results.length} native skip-navigation browser cases; actual shared layouts, synthetic content, no authentication claim.`);
