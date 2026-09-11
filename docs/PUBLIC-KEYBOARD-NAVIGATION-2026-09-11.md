# Public-page keyboard navigation

Commercial and sample-portal headers now provide “Skip to page content.” Each of their 17 consuming page components has a matching focusable page heading. The link moves past repeated header navigation without adding a permanent tab stop to the heading. Article headings receive the same treatment; page wording and saved legal content are unchanged.

Real browser verification found two additional presentation defects. Global link transitions delayed shortcut visibility for 120ms, so the shortcut now opts out of that animation. At 320px the commercial logo's minimum width pushed sign-in/demo actions outside the page. The logo can now shrink within its grid column while the actions retain their touch sizes.

`scripts/verify-public-keyboard.mjs` uses the running optimized local application, without auth or database mocks. It reads 13 public pages (home, about, blog, contact, FAQ, integrations, pilot, pricing, resources, security, templates, a blog article and a resource article) at 1280/390/360/320px, with JavaScript enabled. An optional `VERIFY_NO_JAVASCRIPT=1` run reproduces the separate loading limitation described below. It checks HTTP status, unique heading target, first-Tab shortcut, immediate visibility and 44px height, Enter focus transfer, next Tab beyond the header, document overflow and page errors. No forms are submitted. The earlier shared-layout verifier now includes the global interaction styles that exposed the animation issue.

Limitations: the signed-in sample and institution/developer portal pages have matching source targets but are not part of this unauthenticated browser run. Narrow viewport checks are not actual browser zoom or screen-reader tests. Independent first-use review, full authenticated hosted cancellation replay, and UAT preview SSO remain open. No migration, provider send, merge, outreach or production release is part of this work.

Before this change, both Vercel Git status checks were confirmed successful for `ca4ce25f9fcfee920f27068f64cff4f3740c1145`. That does not establish deployment status for the next commit. Hosted migration evidence is unchanged; do not reapply those migrations.


## Verification and discovered gap

All 52 real public-page cases passed with JavaScript enabled, including 320px after the header repair. Eight shared-layout Chromium checks passed with JavaScript disabled and the actual global interaction styles included. TypeScript, full ESLint, all 172 domain tests and the final optimized build passed. The 320px viewport and 360px full-page screenshot were inspected.

The attempted no-JavaScript application run failed on the home page: streamed route content remained inside a hidden server-rendered container while the root loading screen remained visible. This is a separate application loading/progressive-enhancement gap. A native shortcut requiring no JavaScript does not mean the complete Next.js page currently works without JavaScript. Do not count the attempted 104-case matrix as passed; only the 52 enabled-JavaScript public cases and eight isolated layout cases passed. The verifier retains completed cases and prints the exact failing case. Fixing or explicitly documenting the application loading requirement is an open UX2 item.
