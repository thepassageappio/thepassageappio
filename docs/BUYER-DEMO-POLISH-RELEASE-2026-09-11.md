# Buyer demo polish release candidate

Prepared from verified live main c64299e in an isolated worktree. This candidate contains only presenter guidance, sample downloads, clearer policy/sign-in copy, and an auditor resend-control correction, plus their verification scripts. It has no database, server-command, email-delivery, dependency or policy-publication changes.

Local verification passed: all 172 domain tests for this main-based candidate, TypeScript, lint and optimized build; 76 closed-page checks and 70 role/state resend-control checks; eight policy states and 28 policy browser layouts; presenter guidance at four widths with keyboard/44px controls; sample sign-in with Google enabled and disabled. React review found no new client state, effects, dependencies, server actions or data-fetching paths. Browser rendering fixtures are not authenticated workflow proof.

The larger PR 109 preserves the unfinished policy framework and its separate tests. Its 229-test count does not apply to this smaller candidate. Two unshipped policy-storage migrations remain local to that work; they are excluded here.

Preview checks, exact-candidate verification, merge and production verification must be recorded before this candidate is called live. The latest owner priority is a reliable buyer demo. Two controlled participant inboxes and explicit test-email permission remain pending. No new email, real customer data or fresh timed rehearsal is implied by this release.
