# Clear guidance when JavaScript is disabled

Passage currently needs JavaScript to reveal streamed route content and operate the interactive application. Previously a visitor with scripts disabled saw an indefinite loading indicator. The root layout now renders a native `noscript` message: “Turn on JavaScript to open this page,” followed by instructions to turn it on in browser settings and reload. A noscript-only style hides the route-loading cue. With JavaScript enabled, the message and that style are inactive.

This fixes the unexplained waiting state. It does not make the application usable without JavaScript, detect blocked individual bundles, or change request processing, access checks, legal content or saved history.

## Evidence

`scripts/verify-javascript-guidance.mjs` passed 32 actual optimized-local-app browser cases: home, about, start/sign-in and an invalid invitation route, each at 1280/390/360/320px with JavaScript disabled and enabled. Disabled-script cases showed readable recovery guidance and no visible route-loading cue. Enabled-script cases showed their normal heading and no recovery message. No document overflow or page errors were observed. No forms were submitted. The 320px screenshot was visually inspected; JSON results and screenshots remain in ignored `work/` files.

TypeScript, full ESLint, 172 domain tests and the optimized build passed. The local test server was stopped after verification. These checks are not authenticated hosted replay, full screen-reader/zoom testing or proof of operation without JavaScript.

Both Vercel Git checks for prior commit `1d2066fd4fcf0124e544f9038e550f97d4d84454` were successful. This does not establish deployment status for this subsequent change. No migration, provider send, merge or production release occurred. Hosted cancellation replay and UAT preview SSO remain open; policy publication, first-use review and the other product gates remain on the roadmap.
