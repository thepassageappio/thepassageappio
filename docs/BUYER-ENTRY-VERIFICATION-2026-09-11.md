# Live buyer entry checks

September 11, 2026. Both `thepassageapp.io` and `demo.thepassageapp.io` reported verified GitHub/main provenance at `c64299e5ed3fa49b43e7ca62278b9c5c59088264`.

The read-only browser verifier passed 32 combinations: home, start, contact and signed-out sample access on each site, at 1280, 390, 360 and 320 pixels. It checked a single visible page heading, no document overflow, the first keyboard stop on the skip link, Enter moving focus to page content and up to 30 subsequent visible/on-screen tab stops. There were no page errors. Signed-out sample access correctly redirects to sign-in while preserving the sample destination.

Both sample PDFs downloaded successfully from both sites with PDF content types and signatures: four downloads total. No form was submitted and no sign-in action was triggered. All non-read browser requests were blocked; the only observed blocked path was `/cdn-cgi/rum` (20 attempts on production, zero on Demo). No application write attempts were observed.

Run `scripts/verify-buyer-entry.mjs` with the exact origins, `PLAYWRIGHT_MODULE` and optional `EXPECTED_SHA`. It writes a timestamped local proof to ignored `work/buyer-entry-proof.json`. This does not verify authentication, inbox delivery, screen-reader behavior, browser zoom, form submission, every tab stop on long pages or a complete presenter journey.

## Wording defect found and fixed locally

Demo displays a Google sign-in button; production currently does not. The sample sign-in description nevertheless mentioned Google in both configurations. It now describes only email sign-in when Google is disabled, while retaining the Google/email wording when enabled. Provider configuration and sign-in behavior are unchanged.

An actual-page render check passed both enabled/disabled configurations with actions mocked. All 229 domain tests, TypeScript, lint and optimized build passed. This wording fix is pending in PR 109, not live. The live entry evidence above applies to c64299e, not to this new candidate.

The question for the owner's two controlled participant inboxes and test-email approval remains pending. No new messages, provider searches to recover old links, migrations or production release occurred. Continue the [buyer-demo priority plan](BUYER-DEMO-PRIORITY-2026-09-11.md).
