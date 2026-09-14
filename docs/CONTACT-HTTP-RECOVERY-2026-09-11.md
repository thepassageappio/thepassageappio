# Contact form recovery from HTTP errors

September 11, 2026 UTC.

## Defect and change

On live main ee3a5fb, an intercepted 503 HTML response to the contact submission replaced the form with “We could not load this request.” The form count became zero. No request reached the server during that reproduction.

The contact action boundary now handles the pinned Next 16.1.6 client's E394 error for a response that is not a valid Server Action response. It keeps the form and shows “We could not confirm that your request was saved. Please try again.” It never displays the response body. Entries, contact permission and the original idempotency key remain in place.

This narrowly extends the existing fetch TypeError handling. Redirects, not-found errors, errors carrying a digest, other framework error codes and unrelated errors still propagate unchanged. No action, database, consent, provider, dependency or migration logic changes.

## Verification

- 172 domain tests, TypeScript, lint and optimized production build passed on the isolated main-based release branch.
- The updated exception-boundary check passed returned state, fetch failure, E394, redirect, not-found, opaque/digested errors, other codes and unexpected errors.
- Local production browser checks passed 503 HTML, 429 plain-text and 502 JSON failures at 1280, 390, 360 and 320 pixels. Each width then passed a deliberately invalid-key server preflight. Values, selects, checkbox and key remained; fields disabled while pending; the alert received focus; no horizontal overflow or page errors occurred. The 360px image was inspected.
- The seven existing server-action mock scenarios still cover denied preflight, safe error messages, retry key, redirect and honeypot boundaries.

`scripts/verify-contact-http.mjs` uses Chrome through the installed Playwright runtime because agent-browser is unavailable. The first three POSTs per width are fulfilled in the browser. The fourth carries an invalid idempotency key and is denied before database/provider code. A final honeypot command checks actual framework redirection without creating an inquiry. Hosted runs require an exact expected source SHA and ref. An optional protection file supplies the existing preview header only to the exact tested origin.

This does not prove a saved inquiry's response was lost, concurrent database replay, actual provider delivery, opaque Server Action failures, or a fresh authenticated buyer rehearsal. E394 is an internal Next marker, not a stable public API: retain this browser regression test when upgrading Next. No broad catch or experimental rethrow API was introduced.

## Release status

PR [113](https://github.com/thepassageappio/thepassageappio/pull/113) merged candidate b27668031178099cc10dc37bcb7ab23651dc8e6d as main 326976fd1dc0a4009b18db5429dedf474d48c37c. Both exact previews were Ready and passed the complete 20-step HTTP/preflight/honeypot test: UAT dpl_F8S1hd6ZPzEToJR14dfvCxkpbrXH; Demo dpl_CJ3U1grJbBMGQypbcVJwBdPwa7o5. Both Git statuses succeeded on the candidate.

Both live sites then reported verified GitHub provenance at that exact main SHA and passed the same 20-step test each. Main deployments are Ready: UAT dpl_4exyaPibV4ZMFk3XNLuZVnFG8TMd and Demo dpl_5ZDfvx5et1bVGnyGULm78nsso168. Public smoke passed 44 routes and eight recovery states. Both deployment error queries returned zero records in their 30-minute windows. The clean main worktree passed local release provenance; that local gate reports no hosted SHA and is distinct from the live version checks.

Each tested origin passed 12 browser-injected failures, four actual server preflight denials and four actual honeypot redirects. No inquiry, provider queue item or provider send was created. Existing local disconnect/retry checks also passed. Proof files are ignored under passage-demo-polish/work/http-*-proof.json and passage-authority/work/http-*.

The owner subsequently approved rehearsal invitations and receipts. Only the two intended participant email addresses remain pending. No fresh authenticated rehearsal or inbox delivery has been completed.
