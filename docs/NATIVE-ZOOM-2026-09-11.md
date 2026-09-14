# Native browser zoom verification

Both live sites reported verified main `b207fb8bd60c84f73ddee326245064571fdfbae2`. Twenty-four entry/recovery cases passed at native Chrome 200% and 400% zoom, with 180 keyboard focus stops. No horizontal document overflow, hidden/offscreen focus stop, incomplete tab traversal or browser page error was found. The skip link moved focus to the main content in every case. No product fix was needed for these checks.

Coverage: home, workspace start, contact, signed-out sample entry, invalid participant link and unavailable receipt session on each live origin. All visits were signed out. Non-read browser requests were blocked; only the known analytics path was observed. No form submission, email or authenticated workflow occurred.

## Method and evidence

`scripts/verify-native-zoom.mjs` creates isolated Chrome profiles under ignored `work/`, sets the native default zoom preference and closes each browser afterward. The owner's browser profile is untouched. A 100% calibration measured 1280 layout pixels and devicePixelRatio 1 on both sites; 200% measured 640 and 2; 400% measured 320 and 4. Pinch scale remained 1. The script asserts those measurements before counting a case. It does not inject CSS, change text sizes or use mobile viewport emulation.

The preference uses Chromium's [partition zoom implementation](https://chromium.googlesource.com/chromium/src/+/lkgr/chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc) and [zoom-factor conversion](https://chromium.googlesource.com/chromium/src/+/938b37a6d2886bf8335fc7db792f1eb46c65b2ae/third_party/blink/common/page/page_zoom.cc). An initial test-profile probe used the wrong partition key and stayed at 100%; correcting it to the documented key produced the asserted native metrics. That probe is not counted as zoom proof.

Raw results are in `work/native-zoom-proof.json`, starting 2026-09-11T14:53:41Z. The first Playwright full-page screenshot cropped at native zoom despite correct page metrics. A separate direct Chrome viewport capture at 400% confirmed the header and lower recovery guidance fit horizontally; those top/bottom images were visually inspected. The committed capture code uses that verified direct capture method. A cropped test screenshot is not a product defect. Focused ESLint passed.

## Remaining work

This closes native zoom for these public entry/recovery surfaces only. It does not establish complete clipping/overlap detection, contrast, real screen-reader spoken output, authenticated controls or form-error usability. Continue the screen-reader and authenticated first-use checks, and the fresh timed inbox-to-receipt rehearsal once the pending participant addresses and test-email permission arrive. No additional approval question, deployment, migration or provider send was made.
