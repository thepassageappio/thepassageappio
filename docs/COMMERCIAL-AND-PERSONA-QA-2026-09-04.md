# Commercial, platform, and persona QA — September 4, 2026

## Outcome

The current Passage Authority release passed the non-destructive commercial, platform, responsive, recovery, and cross-persona checks completed in this run. No new critical or high product-state defect was found. Hosted Demo presenter sign-in and fresh outbound message delivery remain the next manual gate.

## Product story under test

An institution buyer moves from the public product story into a controlled evaluation, creates one narrowly scoped financial power-of-attorney request, and completes a durable transaction across institution owner, account holder, representative, and reviewer. The saved decision and later lifecycle changes must agree across role-filtered receipts.

## Automated release evidence

- `pnpm verify`: 113 domain, commercial, delivery, authorization, recovery, and security tests passed; TypeScript and ESLint completed without a reported failure.
- `pnpm build`: optimized Next.js 16.1.6 build passed and generated all 23 static pages plus the dynamic hosted, participant, webhook, and API routes.
- `pnpm verify:public-release`: 32 Production/Demo public routes and eight recovery states passed.
- `pnpm verify:live-story`: passed a new local synthetic request through principal confirmation, representative acceptance, four evidence requirements, submission, reviewer information request, representative response, limited acceptance, and revocation. The final receipt was version 12 with 12 delivered webhook records.

### Founding-pilot billing addendum

- The expanded suite now passes 122/122 domain tests, including pilot date/allowance validation, service-only provider boundaries, permanent event deduplication, and exactly-one allowance semantics.
- ESLint and TypeScript pass, and the optimized Next.js 16.1.6 production build passes with the new `/api/internal/stripe/process` and `/api/webhooks/stripe` routes.
- Demo owner command replay, a real $5,000 hosted Stripe test invoice, signed paid-event ingestion, one entitlement activation, and duplicate-event replay passed against the isolated Demo database.
- The clickable organization billing surface is implemented but not yet published. Current-host deployment approval is unavailable and direct shell networking is blocked, so publication remains an operational release gate.

## Live Production evidence

- Public homepage, Pricing, Pilot, Security, Integrations, and Contact rendered with the current product positioning and no Passage-origin console error.
- Commercial path is consistent: free five-request/10-day evaluation, $5,000 founding pilot, and institution pricing after evidence.
- Authenticated owner workspace rendered evaluation usage, remaining days, organization isolation, sample and blank request entry, people/access, plan/billing, and authority-policy surfaces.
- The sample request form preloaded fictional names, a synthetic account boundary, two permitted actions, and a future end date while leaving controlled inboxes blank.
- Existing institution receipt `PAR-AD9AD8C0ED49` rendered the original limited acceptance, two recorded limits, current Revoked status, decision record 15, and verification fingerprint `9ef9742deae3c0d4a0575320215ba3535c41eff460b9973cedad98eff6e5abf0`.
- A consumed participant receipt link failed closed with plain-language reused-link recovery. Direct receipt access without a current role-bound session failed closed with plain-language session recovery.
- The only browser-console error observed came from the Codex browser extension, not Passage.

## Persona evidence

- Institution owner: dashboard, request queue, policy, billing summary, people/access, sample request, request detail, and receipt rendered.
- Account holder: local role-filtered projection showed the terminal Revoked result, no remaining action, receipt access, and eight appropriate visible events.
- Representative: local role-filtered projection showed the same terminal result, no remaining action, receipt access, and the complete saved workflow history.
- Reviewer: local projection showed the same version-12 terminal result and the institution evidence/decision history.
- Durable replay independently confirmed the same final state, decision, disclosure, policy version, event ordering, and webhook delivery count.

## Responsive evidence

At an explicit 360px viewport, the homepage, Pricing, owner dashboard, People and access, and sample request form had no horizontal overflow. Measured interactive controls met the 44px rule except for the native checkbox glyphs themselves; their surrounding labeled rows provide the usable target.

## Remaining gates

1. Reauthenticate the allowlisted presenter in the isolated Demo environment.
2. Prepare a fresh namespaced Demo run without database access.
3. Send the principal and representative invitations to the approved controlled Passage test inboxes.
4. Time the four-profile owner/account-holder/representative/reviewer rehearsal to seven minutes or less.
5. Record inbox versus spam placement for initial invitations, clarification/resume, and final receipt messages.
6. Complete manual hosted negative-path browser checks for wrong-role denial, stale form recovery, rejection, withdrawal, expiration, and fresh-link session recovery.

The outbound sign-in and participant messages require action-time owner confirmation before they are sent.
