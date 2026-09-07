# Commercial, platform, and persona QA — September 4, 2026

## Outcome

The current Passage Authority release passed the non-destructive commercial, platform, responsive, recovery, and cross-persona checks completed in this run. Independent live QA also passed real production signup/onboarding, the sixth-activation free-tier gate, same-day Gmail inbox placement, Demo consumed-link recovery, and the public claims boundary. Hosted Demo Google sign-in, fresh participant delivery, secure-link access, and a complete operator-assisted happy path pass. A timed independent four-profile rehearsal, one authenticated valid-input production form replay, remaining hosted negative paths, and commercial-provider reconciliation remain the next gates.

## Product story under test

An institution buyer moves from the public product story into a controlled evaluation, creates one narrowly scoped financial power-of-attorney request, and completes a durable transaction across institution owner, account holder, representative, and reviewer. The saved decision and later lifecycle changes must agree across role-filtered receipts.

## Automated release evidence

- `pnpm verify`: 113 domain, commercial, delivery, authorization, recovery, and security tests passed; TypeScript and ESLint completed without a reported failure.
- `pnpm build`: optimized Next.js 16.1.6 build passed and generated all 23 static pages plus the dynamic hosted, participant, webhook, and API routes.
- `pnpm verify:public-release`: 32 Production/Demo public routes and eight recovery states passed.
- `pnpm verify:live-story`: passed a new local synthetic request through principal confirmation, representative acceptance, four evidence requirements, submission, reviewer information request, representative response, limited acceptance, and revocation. The final receipt was version 12 with 12 delivered webhook records.

### Founding-pilot billing addendum

- The expanded suite now passes 131/131 domain tests, including pilot date/allowance validation, service-only provider boundaries, permanent event deduplication, and exactly-one allowance semantics.
- ESLint and TypeScript pass, and the optimized Next.js 16.1.6 production build passes with the new `/api/internal/stripe/process` and `/api/webhooks/stripe` routes.
- Demo owner command replay, a real $5,000 hosted Stripe test invoice, signed paid-event ingestion, one entitlement activation, and duplicate-event replay passed against the isolated Demo database.
- The clickable organization billing surface and current green artifact are published on the ready Demo custom domain. Stripe failure/refund/disorder replay and provider reconciliation remain.

## Independent live QA addendum — September 5, 2026

- **Passed:** real production evaluation signup from email confirmation through organization profile, legal/authorized-use acceptance, policy selection, and workspace readiness.
- **Passed:** the seeded organization's sixth activation remains saved as a draft and renders no send control.
- **Passed:** every Passage sign-in, confirmation, invitation, and decision-receipt email inspected across three test organizations landed in Gmail Inbox; none appeared in Spam. Inbox placement is no longer an open same-day QA item, although ongoing deliverability monitoring remains an operating requirement.
- **Passed in Demo:** a consumed one-time participant link failed closed with the correct recovery guidance. Production negative-path parity remains separately gated.
- **Passed:** Home, Security, Pricing, About, Terms, Pilot, institution decision-review copy, and the current sales materials consistently describe Passage as workflow coordination and institutional review—not legal validation.
- **Diagnosed, usability fix deployed:** production `Save draft` and team `Send invitation` appeared inert because required email fields were empty. Native browser validation stopped submission before a network request or server action, matching the observed zero requests and zero console errors. Sample details intentionally leave inboxes blank to prevent accidental delivery. Demo deployment `dpl_BWHK6ZdbLB7UivCd3L3jppvNFyFY` and production deployment `dpl_7FodJEgiNqg2sGA8kRMz9syD6iGz` now highlight the missing field and display `Complete the highlighted required field before continuing.` Public-form browser verification passed on both aliases with field focus, no framework overlay, no console error, and no production error log. One authenticated valid-input replay of both production actions remains before closing this finding completely.
- **Rollback gap confirmed:** the Vercel team currently exposes only `passage-authority-demo` and `passage-authority-uat`. The expected legacy `thepassageappio.vercel.app` URL is not active, and no separate funeral-home rollback project is present in the accessible project inventory. Reconstructing or documenting a legacy rollback is a separate continuity task, not an Authority synthetic-demo blocker.

## Live Production evidence

- Public homepage, Pricing, Pilot, Security, Integrations, and Contact rendered with the current product positioning and no Passage-origin console error.
- Commercial path is consistent: free five-request/10-day evaluation, $5,000 founding pilot, and institution pricing after evidence.
- Authenticated owner workspace rendered evaluation usage, remaining days, organization isolation, sample and blank request entry, people/access, plan/billing, and authority-policy surfaces.
- The sample request form preloaded fictional names, a synthetic account boundary, two permitted actions, and a future end date while leaving controlled inboxes blank.
- Existing institution receipt `PAR-AD9AD8C0ED49` rendered the original limited acceptance, two recorded limits, current Revoked status, decision record 15, and verification fingerprint `9ef9742deae3c0d4a0575320215ba3535c41eff460b9973cedad98eff6e5abf0`.
- A consumed participant receipt link failed closed with plain-language reused-link recovery. Direct receipt access without a current role-bound session failed closed with plain-language session recovery.
- The only browser-console error observed came from the Codex browser extension, not Passage.
- Fresh hosted request `PA-6C4FF6F2DB` completed on September 5 from principal confirmation through representative acceptance, two approved fictional uploads, institution review, representative disclosure, and accepted-with-limits receipt `PAR-470074AA96BC`. Resend reported both participant invitations delivered, and the application submitted both receipt emails for delivery.

## Persona evidence

- Institution owner: dashboard, request queue, policy, billing summary, people/access, sample request, request detail, and receipt rendered.
- Account holder: local role-filtered projection showed the terminal Revoked result, no remaining action, receipt access, and eight appropriate visible events.
- Representative: local role-filtered projection showed the same terminal result, no remaining action, receipt access, and the complete saved workflow history.
- Reviewer: local projection showed the same version-12 terminal result and the institution evidence/decision history.
- Durable replay independently confirmed the same final state, decision, disclosure, policy version, event ordering, and webhook delivery count.

## Responsive evidence

At an explicit 360px viewport, the homepage, Pricing, owner dashboard, People and access, and sample request form had no horizontal overflow. Measured interactive controls met the 44px rule except for the native checkbox glyphs themselves; their surrounding labeled rows provide the usable target.

## Remaining gates

1. Time the four-profile owner/account-holder/representative/reviewer rehearsal to seven minutes or less.
2. Replay production `Save draft` and team `Send invitation` with valid controlled email input and confirm the server actions, redirects, saved state, and visible notices.
3. Complete manual hosted negative-path browser checks for wrong-role denial, stale form recovery, rejection, withdrawal, expiration, and fresh-link session recovery.
4. Complete Stripe failure/refund/out-of-order replay and the Passage/Stripe/HubSpot reconciliation sequence.

The consumed representative invitation was also reopened in hosted Demo and returned the expected role-neutral “This link is no longer active” recovery page without exposing request data.

## Mobile email compatibility result

During the September 5 hosted replay, the receipt CTA rendered in mobile Gmail but was initially reported as not tappable. The template was hardened with a table-based full-width anchor, explicit new-window target, and a second plain secure-link fallback. A replacement receipt email was delivered, and the recipient then confirmed the CTA opened from mobile Gmail. Opening the earlier 4:59 PM link after a newer 5:05 PM receipt had been issued correctly produced the plain-language “This link is no longer active” recovery screen. Mobile CTA compatibility and superseded-link fail-closed behavior therefore pass; opening the newest receipt remains the final matching-receipt phone check.

The outbound sign-in and participant messages require action-time owner confirmation before they are sent.
