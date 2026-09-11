# Contact form connection recovery

The contact form now handles the TypeError produced by a failed browser fetch in place. The person gets connection/retry guidance while entries and the original request key remain in the form. Returned server validation messages are preserved. Framework redirect errors and other Error objects are rethrown unchanged. No server action, database command, provider invocation or permissions changed.

Four real browser connection aborts and four subsequent server preflight responses passed at 1280/390/360/320 using a local production build. Each first POST was aborted by Playwright before reaching the server; each retry used an intentionally invalid key so the server rejected it before database/provider code. All values, selections and the checkbox survived both attempts; pending state cleared, error focus worked, and no overflow or page error occurred. The local server also ran with its Supabase URL/service key unset.

Four direct boundary checks loaded the actual component's action reducer: normal server state and TypeError recovery passed; a framework redirect and an unexpected Error were rethrown as the exact original objects. This verifies exception handling, not a full successful hosted inquiry. Reproducible checks are `scripts/verify-contact-network.mjs` and `scripts/verify-contact-network-boundary.mjs`.

The policy branch passed 229 tests, TypeScript, lint and build. The separate main-based release must record its own 172-test verification, preview and live evidence before being described as shipped. No new dependency or migration is included.

## Limits

Preserving the key supports the existing idempotent retry boundary; an interrupted connection does not prove that a request was never received or saved. This test aborts before delivery and does not establish a lost-response-after-commit scenario. HTTP error responses, no-JavaScript use, reload persistence and spoken screen-reader output remain separate. No email, hosted inquiry, customer data or fresh timed buyer demo is claimed.


## Release checkpoint

PR [112](https://github.com/thepassageappio/thepassageappio/pull/112) merged as `ee3a5fbf6e83fadc320be3c11002af7055c566c8`. Candidate `f3fc04b512656df8d32ae5c59ef98e0a7571f2cc` passed 172 domain tests, TypeScript, lint and optimized build. Both preview version endpoints matched this candidate and both Git checks were green. Each preview passed four browser-aborted requests followed by four malformed-key server preflight responses. No inquiry was created or provider contacted.

Git main deployments: Demo `dpl_2HDK2fV8iJSPmTGbJPionkXEJzUM`; Production/UAT `dpl_5NxZ4Mekg6zVuo66wxguqa51bnTU`. Clean local main provenance verification passed. Both deployments are Ready from GitHub main and both live version endpoints report ee3a5fb with verified provenance. Each live site passed four browser connection aborts and four invalid-key preflight retries across 1280/390/360/320. Values/key, pending recovery and error focus passed with no overflow/page errors. Public smoke passed 44 routes and eight recovery states. Deployment-specific 30-minute error queries returned zero records; this is a point-in-time scan, not full monitoring assurance. Raw preview/live proofs are in the isolated release worktree under ignored work/network-{uat,demo}-preview-proof.json and work/network-{prod,demo}-live-proof.json.
