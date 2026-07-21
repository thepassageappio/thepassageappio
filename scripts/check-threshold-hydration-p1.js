const { chromium } = require('playwright');

const baseUrl = String(process.env.PASSAGE_TEST_BASE_URL || 'http://127.0.0.1:3111').replace(/\/$/, '');
const routes = [
  '/pricing',
  '/resources',
  '/guides',
  '/care-providers',
  '/trust',
  '/mission',
  '/pricing?participant=1',
  '/',
  '/funeral-home',
  '/contact',
];
const affectedRoutes = new Set(['/pricing', '/resources', '/guides', '/care-providers', '/trust', '/mission']);
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-360', width: 360, height: 800 },
];
const hydrationPattern = /hydration|text content did not match|server html was replaced/i;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const failures = [];

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();

      for (const route of routes) {
        const consoleErrors = [];
        const hydrationMessages = [];
        const pageErrors = [];
        const onConsole = (message) => {
          const text = message.text();
          if (hydrationPattern.test(text)) hydrationMessages.push(`${message.type()}: ${text}`);
          if (message.type() === 'error') consoleErrors.push(text);
        };
        const onPageError = (error) => pageErrors.push(error.message || String(error));
        page.on('console', onConsole);
        page.on('pageerror', onPageError);

        let response;
        try {
          response = await page.goto(baseUrl + route, { waitUntil: 'networkidle', timeout: 30000 });
        } catch (error) {
          failures.push(`${viewport.name} ${route}: navigation failed: ${error.message}`);
          page.off('console', onConsole);
          page.off('pageerror', onPageError);
          continue;
        }

        await page.waitForTimeout(250);
        const result = await page.evaluate(async () => {
          await document.fonts.ready;
          const root = document.documentElement;
          const visibleEnabledControls = Array.from(document.querySelectorAll('a, button, input, select, textarea'))
            .filter((element) => {
              if (element.disabled || element.getAttribute('aria-disabled') === 'true') return false;
              const style = window.getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
            })
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return {
                label: (element.getAttribute('aria-label') || element.textContent || element.getAttribute('placeholder') || element.tagName).trim().replace(/\s+/g, ' ').slice(0, 80),
                width: Math.round(rect.width * 100) / 100,
                height: Math.round(rect.height * 100) / 100,
              };
            })
            .filter((control) => control.width < 44 || control.height < 44);

          const signInLink = Array.from(document.querySelectorAll('a'))
            .find((element) => element.textContent.trim() === 'Sign in');
          const loadedFontFamilies = Array.from(document.fonts)
            .filter((fontFace) => fontFace.status === 'loaded')
            .map((fontFace) => fontFace.family.replace(/["']/g, ''));
          const heading = document.querySelector('h1');

          return {
            contentLength: document.body.innerText.trim().length,
            clientWidth: root.clientWidth,
            scrollWidth: root.scrollWidth,
            undersizedControls: visibleEnabledControls,
            signInHref: signInLink ? signInLink.getAttribute('href') : '',
            bodyFontFamily: window.getComputedStyle(document.body).fontFamily,
            headingFontFamily: heading ? window.getComputedStyle(heading).fontFamily : '',
            loadedFontFamilies,
          };
        });

        const prefix = `${viewport.name} ${route}`;
        if (!response || !response.ok()) failures.push(`${prefix}: HTTP ${response ? response.status() : 'no response'}`);
        if (!result.contentLength) failures.push(`${prefix}: blank page`);
        if (result.scrollWidth > result.clientWidth) failures.push(`${prefix}: horizontal overflow ${result.scrollWidth} > ${result.clientWidth}`);
        if (hydrationMessages.length) failures.push(`${prefix}: hydration console output: ${hydrationMessages.join(' | ')}`);
        if (consoleErrors.length) failures.push(`${prefix}: console errors: ${consoleErrors.join(' | ')}`);
        if (pageErrors.length) failures.push(`${prefix}: page errors: ${pageErrors.join(' | ')}`);
        if (affectedRoutes.has(route.split('?')[0]) && result.undersizedControls.length) {
          failures.push(`${prefix}: enabled controls under 44px: ${JSON.stringify(result.undersizedControls)}`);
        }
        if (affectedRoutes.has(route.split('?')[0])) {
          const interLoaded = result.loadedFontFamilies.includes('Inter');
          const frauncesLoaded = result.loadedFontFamilies.includes('Fraunces');
          if (!result.bodyFontFamily.includes('Inter') || !result.headingFontFamily.includes('Fraunces') || !interLoaded || !frauncesLoaded) {
            failures.push(`${prefix}: intended fonts not loaded: ${JSON.stringify({ body: result.bodyFontFamily, heading: result.headingFontFamily, loaded: result.loadedFontFamilies })}`);
          }
        }
        if (route === '/pricing?participant=1' && result.signInHref !== '/login?next=%2Fpricing%3Fparticipant%3D1') {
          failures.push(`${prefix}: sign-in return path lost query: ${result.signInHref || 'missing'}`);
        }

        page.off('console', onConsole);
        page.off('pageerror', onPageError);
        console.log(`CHECKED ${prefix}`);
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error('\nThreshold hydration P1 regression failures:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
    return;
  }

  console.log('\nThreshold hydration P1 regression PASS: 10 navigations x 3 viewports; no hydration errors, page errors, overflow, blank pages, query loss, or in-scope enabled targets under 44px.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
