# Contact form server-error recovery

Before this change, failed contact inquiries redirected to a new empty form. The form now receives an in-place error, retains entered values and the original idempotency key, focuses the error summary and disables its fields while waiting. Success still redirects to the existing receipt screen. Consent, honeypot, input validation, RPC arguments, consent version and delivery invocation remain enforced on the server. Plain-object rate-limit errors now receive the intended retry-later guidance. Provider diagnostics are not shown to the browser.

The client wrapper uses the same prevented-submit/startTransition pattern as existing request recovery to avoid React resetting uncontrolled inputs after an error result. Inputs remain server-rendered children. There are no new dependencies, data fetches, persistence stores, provider permissions or migrations.

## Verification

- Seven actual action-module scenarios with mocked RPC/provider boundaries passed: malformed key, missing consent, invalid email, rate limit, generic database error, successful save despite delivery failure, and honeypot. Retries pass the same request key and consent version. This does not assert durable database replay from a mock.
- Eight actual local production-build Server Action failures/retries passed at 1280/390/360/320. The server ran with its Supabase URL and service key unset, causing a real caught configuration failure before any database or provider operation. Every entered value, selection, checkbox and key survived; the pending lock and error focus worked; no horizontal overflow or page error occurred. The 360px screenshot was inspected. The browser allowed only localhost requests.
- The main-based release candidate excludes PR 109's policy groundwork. Its full verification and hosted preview/live release state must be recorded in the subsequent release checkpoint before calling it shipped.

The initial action test caught an overlooked generic redirect and the first full check caught a missing never return annotation; both were corrected before the passing verification. Browser test selection was scoped to the form's alert to avoid Next's separate route announcer.

## Limits

No new hosted inquiry or provider send was authorized or performed. Successful writes still use the existing database command; database semantics and historical records are unchanged. Native no-JavaScript fallback, browser transport disconnects, reload persistence and screen-reader spoken output are not established by these tests. The separate fresh buyer-demo inbox/rehearsal dependency remains open.
