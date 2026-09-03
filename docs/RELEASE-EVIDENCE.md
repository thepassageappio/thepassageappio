# Passage Authority controlled MVP release evidence

> **Document status, September 2, 2026:** This proves the fictional controlled MVP and the isolated hosted Authority UAT environment. It is not evidence of legal validity, institutional acceptance, paid entitlement, enterprise security certification, or readiness for real customer data.

Date: September 2, 2026

## Institution account and commercial model

- Production deployment `dpl_5FhdrfgMPHWsmc2NhjyaScjwyHe8` reached Ready and was aliased to `https://thepassageapp.io`.
- Authenticated owner verification passed on `/app/organization`: organization identity, owner role, evaluation status, one-of-five usage, period, no-card evaluation, institution-only billing, and pilot path matched durable hosted data.
- Authenticated `/app/team` verification passed: the role guide opened and separated owner, administrator, operations, reviewer, auditor, and developer access.
- Responsive verification passed at 390px and 360px with no horizontal overflow. The plan page measured 1,574px and 1,607px high respectively after compacting navigation and secondary detail.
- All visible links, buttons, and disclosures met the 44px target in the 390px plan-page check. Browser warnings and errors were empty across the plan and team checks.
- Pricing and packaging research selected a base subscription with included activated requests and graduated overage; exact annual prices remain gated on buyer and pilot evidence.
- Automated evidence passed: 70 domain tests, TypeScript, ESLint, and the 23-page optimized production build.

## Release outcome

The controlled MVP now supports one complete New York financial power of attorney transaction for limited account servicing. It begins with institution setup and ends with a current decision receipt, revocation, and independently replayable integration evidence.

## Hosted Authority UAT transaction

Deployment: `https://passage-authority-uat.vercel.app`

Browser request: `PA-79F08BDB4D`

Decision receipt: `PAR-EE13818AF409`

| Boundary | Hosted evidence | Result |
| --- | --- | --- |
| Institution authentication | A synthetic organization owner opened the deployed workspace through the server confirmation route | Pass |
| Representative resume | A new single-use, role-bound session preserved the earlier responsibility decision | Pass |
| POA source | `fictional-poa-uat.pdf` was uploaded through the browser, stored privately, and projected as awaiting institution review | Pass |
| Identity source | `fictional-identity-uat.pdf` was uploaded independently and projected as awaiting institution review | Pass |
| Certification | The representative saved the versioned certification and both personas saw it complete | Pass |
| Institution review | The institution accepted each source for this request without claiming universal legal validity | Pass |
| Decision | The institution recorded an acceptance with two explicit limits | Pass |
| Shared receipt | Institution, principal, and representative saw the same receipt identifier, decision version, scope, limits, and fingerprint | Pass |
| Lifecycle | Revocation advanced the request from version 10 to 11 while preserving the decision fingerprint | Pass |
| Browser isolation | Principal and representative were verified in separate browser profiles with the correct independent role projection | Pass |
| Anonymous participant boundary | Fresh participant access initially exposed a missing schema permission; migration `authority_participant_anon_boundary` restricted anonymous access to exactly four token-validated functions and zero private tables | Pass after remediation |

Receipt fingerprint: `fe936f322f2865755d31bd9c4e5b81ea1c9ab3a0db968661c0d094918426be21`

## Public website cutover

- `thepassageapp.io` and `www.thepassageapp.io` now resolve to Authority deployment `dpl_BaTWiw8zrP43HooRVjJDNsZaRY8Q` (`passage-authority-o129lizsh-thepassageappio-7018s-projects.vercel.app`).
- Both custom domains are assigned at the project level to `passage-authority-uat`; the retired `thepassageappio` project retains only its `vercel.app` domain and cannot reclaim the public aliases on a later build.
- The public homepage renders the Passage Authority title and financial POA value proposition with no browser warnings or errors.
- The public homepage, header, pilot, template, and integration calls to action route to the hosted `/start` workspace. The SQLite demonstration routes remain local-only because Vercel Functions cannot persist the local database on their read-only filesystem.
- The `www` hostname independently returned the Passage Authority page and the `Start an Authority evaluation` call to action after the final deployment.
- An unauthenticated request to `/app` redirects to `/start?intent=sign-in` on the public domain.
- The 390px and 360px homepage checks passed without horizontal overflow.
- The final linked-route review also passed at a true 320 CSS-pixel content width. The shortened homepage measures about 4.1 mobile screens at 390px and 4.6 at 360px, down from approximately 6.4 to 7 screens.
- All 12 unique public links and the `#how-it-works` anchor resolve; the linked public route set has distinct titles, no exposed implementation terms, no undersized WCAG targets, and no browser console warning or error.
- Production responses include HSTS, no-sniff, frame denial, no-referrer, and restrictive camera, microphone, and location headers. Public sitemap and robots responses are live while authenticated, participant, API, developer, and local-demo surfaces are excluded from discovery.
- No Authority runtime error was present in the 30-minute post-cutover log check.
- Legacy rollback remains available at deployment `dpl_CJUFCYSw9GZBuK4Wy98z6tTbqa4A`; rollback requires reassigning both public aliases to that deployment.
- GitHub `main` was fast-forwarded without history rewriting and now contains public-site quality commit `efd881d`, preventing a later main deployment from restoring the retired product source.
- Supabase Auth now uses `https://thepassageapp.io` as its Site URL. The exact production callback `https://thepassageapp.io/auth/confirm` is allowed, while the isolated UAT and local callbacks remain available for regression testing.
- A fresh production magic link for the synthetic owner account redirected to `https://thepassageapp.io/onboarding/organization` without an Auth error. The authenticated session survived a reload and a direct `/app` visit on the production domain.
- The synthetic owner account then received the expected access-recovery boundary: its previous organization membership had been removed, so no former organization information was exposed. This is a membership state to replace for the next UAT run, not an Auth or cookie failure.
- That replay also exposed a trapped-account recovery defect: the removed-member screen did not offer sign-out. The release candidate now includes an explicit sign-out action on that denial screen; deployment verification remains required.
- Production deployment `passage-authority-frbugiahz-thepassageappio-7018s-projects.vercel.app` added that sign-out action and was aliased to `thepassageapp.io`. Chrome verification proved the denied account could sign out and reach the unauthenticated production sign-in screen without regaining former organization access.
- Supabase Auth custom SMTP is enabled through the existing verified Resend sender. A fresh synthetic-owner magic link was accepted, delivered from `noreply@thepassageapp.io`, and exchanged on the production callback.
- The new synthetic owner completed organization profile, evaluation terms, and policy selection in Chrome. `Passage UAT Credit Union` opened with zero of five activations used.
- The first fresh request was saved as a draft with zero usage, then activated once as `PA-1C3C4DABBD`; the institution view showed one of five activations, principal-only action, held representative access, append-only activation and submission activity, and final provider delivery confirmation.
- Gmail placed the first participant invitation in Spam even though the receiving server and Resend confirmed delivery. Inbox placement is therefore still an explicit pre-pilot deliverability gap.
- Fresh UAT exposed a release-blocking hosted parity gap at `ready_to_submit`: the representative had no final disclosure/send action, the record could not enter `under_review`, and the institution decision form appeared one state too early. The added representative disclosure command, institution guard, UI, and database replay passed locally and on the public domain.
- The representative sent the completed request, the institution saw the same review state, requested a clarification, and the representative's response returned the record to review.
- RFI UAT exposed a receipt guard that incorrectly required the final decision immediately after disclosure. Follow-up migration `authority_disclosure_decision_version_window` now requires disclosure to predate the decision while permitting preserved clarification events; clean-schema replay passed both immediate and post-clarification decision probes.
- The institution recorded `Accepted with limits`; institution, representative, and principal views matched on receipt `PAR-AD9AD8C0ED49`, decision version 15, exact scope, two limits, and fingerprint `9ef9742deae3c0d4a0575320215ba3535c41eff460b9973cedad98eff6e5abf0`.
- Revocation advanced the request to version 16. All three views showed the same revoked state, reason, and effective time while preserving the original decision fingerprint.
- The expired 30-minute representative session recovered through a fresh single-use link without losing the saved acceptance or evidence. Participant tabs in one browser profile share the role-bound cookie, so separate personas must use separate profiles/devices or be verified sequentially.
- Initial invitation and resume messages landed in Gmail Spam, but the principal decision-receipt message landed in Inbox. Deliverability remains a pilot-readiness workstream rather than an unqualified pass.

## Complete browser transaction

Browser record: `ar_request_3e69c0b5-4969-4798-810b-c6035eda8b0e`

| Boundary | Evidence | Result |
| --- | --- | --- |
| Institution setup | A reviewer created a scoped request from the active financial POA template | Pass |
| Person granting authority | Avery Morgan reviewed allowed actions, prohibitions, institution, account boundary, and end date, then confirmed | Pass |
| Representative acceptance | Devin Morgan accepted the limited responsibility | Pass |
| Evidence | The representative completed POA document review, certification, identity, and address steps | Pass |
| Minimum disclosure | The representative reviewed the recipient and disclosed fields before submission | Pass |
| Institution review | The reviewer saw source references, page citations, policy requirements, and human-review findings | Pass |
| Information request | The reviewer requested a current address document and the representative responded | Pass |
| Decision | The institution accepted the request with explicit limits | Pass |
| Receipt | A dedicated receipt showed accepted actions, limits, policy, dates, institution, and legal boundary | Pass |
| Lifecycle | The person granting authority revoked the authority and the receipt changed to Revoked | Pass |

## Independent replay

The API verification created a separate request and replayed the complete transaction outside the interface.

- Result: PASS
- Final status: Revoked
- Final version: 12
- State transitions: 11
- Disclosure receipts: 1
- Webhook deliveries: 12
- Policy: Financial POA acceptance 1.3

## Route and responsive evidence

The homepage, templates, integrations, security, pricing, pilot, institution queue, institution setup, developer workspace, participant workspace, and decision receipt were checked in Chrome at the default desktop size, 390px, and 360px.

- Every route rendered meaningful content.
- No framework error overlay appeared.
- No horizontal overflow appeared at 390px or 360px.
- No console warnings or errors were recorded.
- All actionable controls use a minimum 44px target or a larger associated label target.

## Automated release gates

- Domain and persistence tests: 70 passed
- TypeScript: passed
- ESLint: passed
- Next.js production build: passed

## Founding pilot offer release

- Production deployment `dpl_55r7qtLwAY9eCbmyWezXWYAqqbQf` is Ready and aliased to `thepassageapp.io`, `www.thepassageapp.io`, and `passage-authority-uat.vercel.app`.
- Public pricing now offers a no-card controlled evaluation, a $5,000 founding proof-of-concept pilot credited toward year one, and a custom institution relationship priced after pilot evidence.
- The public site no longer publishes the superseded $15,000 pilot or $36,000 annual floor.
- `/pricing` and `/pilot` passed live checks at 1440px, 390px, and 360px with no horizontal overflow, empty links, console warnings, or console errors.
- At 390px, pricing measured about 2.19 viewport heights and pilot about 1.86; at 360px, pricing measured about 2.25 and pilot about 1.94.
- The current five-activation, 10-day evaluation remains the verified MVP entitlement. One free activation per verified organization per calendar month is recorded as a future product-led-growth experiment and is not represented as implemented.

## Controlled boundary

This release uses fictional records and synthetic evidence. It does not contact an institution, validate a live legal instrument, provide a legal opinion, or claim production security certification. Earlier hosted invitation tests used controlled owner mailboxes; provider acceptance and inbox placement remain separate from the authority decision.

Controlled-pilot readiness still requires an independent organization-isolation replay, reviewed security and key-management evidence, retention and recovery controls, observability, security testing, legal review, approved provider boundaries, and a named institution pilot. The hosted authentication and Postgres row-level-security foundation has passed the synthetic transaction but is not a production certification.

## September 3 demo-readiness update

- Every current public route passed a live horizontal-overflow check at both 390px and 360px. The set covers the homepage, About, Contact, Resources, all three resource articles, Integrations, Security, Pricing, Pilot, Templates, and evaluation entry.
- A visual review of the 360px Integrations page showed readable hierarchy, one-column cards, complete navigation, and a 44px-or-larger target for every link.
- The institution workspace now exposes **Start a sample request** alongside the standard request path.
- The sample form preloads Parker Quinn, Casey Quinn, the synthetic deposit relationship ending 4405, two limited actions, and a future end date. Both controlled inboxes remain deliberately blank.
- The form links two matching fictional PDFs. Both files returned HTTP 200 with `application/pdf` from the public domain and explicitly state that they are synthetic and create or prove no authority.
- A live authenticated Chrome check showed the sample notice, both downloads, matching form values, and no console error. No draft was saved and no invitation or message was created during verification.
- Mail DNS has a Resend receiving MX record, published Resend DKIM, sending-subdomain SPF, and DMARC monitoring. The application key is correctly restricted to sending only. Delivery or forwarding for `hello@thepassageapp.io` is not independently proven, so the Contact page mailbox remains an operating gap.
- GitHub `main` and `authority-launch` include the repeatable sample-demo entry at commit `7d6e47f`; the corresponding Vercel production deployment is aliased to `thepassageapp.io`.

## September 3 production-surface hardening

- The SQLite regression UI, role switcher, reset action, deterministic-scenario actions, webhook replay action, and sandbox API now stop before repository access when `NODE_ENV` is `production`.
- Production requests receive a generic not-found response rather than a record, role, environment, or configuration signal. Development and test mode retain the complete deterministic regression harness.
- Private no-store/no-index response headers now cover authenticated workspace, onboarding, authentication callback, participant, team invitation, API, and local-test route families. Baseline frame, MIME, referrer, browser-capability, and transport protections remain global.
- Automated coverage proves the environment gate, generic private 404, baseline security headers, and private cache/indexing policy. The combined branch passed 75 of 75 tests, TypeScript, ESLint, and the optimized 23-page production build.
- Commit `bf4ec5f` was pushed to `authority-launch` and `main`, then production deployment `dpl_F7F9MXkiVyZwojJygm8Ut2yLHTXJ` reached Ready and was aliased to `thepassageapp.io`.
- Live public-domain probes returned HTTP 200 for `/` and `/pricing`; unauthenticated `/app` returned the expected private, no-store redirect to sign-in; `/institution`, `/developer`, `/workspace/sample`, and `/api/v1/authority-records` returned HTTP 404 with no-store/no-index protections.

## September 3 isolated Demo environment

- Vercel project `passage-authority-demo` deployed the same `af8be3a` release used to define the isolated environment and is connected to the same GitHub `main` branch as Production.
- Supabase project `passage-demo` started with zero Auth users, zero Storage objects, no application tables, and no migration history. All 27 repository migrations then applied successfully.
- The clean Demo database passed the Gate 1 replay and the transactional hosted workflow replay, including cross-tenant denial, unauthorized-role denial, stale-version denial, idempotency, immediate revoked-member denial, append-only audit enforcement, disclosure persistence, information request and response, decision receipt, and withdrawal.
- Vercel environment variables use the Demo Supabase URL, publishable key, and server secret. Supabase Auth allows only the stable fallback and branded Demo callback paths.
- The stable fallback `https://passage-authority-demo.vercel.app` returned HTTP 200 for every public route, redirected unauthenticated `/app` to sign-in, and returned generic 404s for retired `/institution` and sandbox API routes.
- Every real public route and resource article passed live Chrome checks at 1440px, 390px, and 360px with no horizontal overflow, empty links, framework overlay, or Passage console warning/error.
- A controlled presenter reached the real organization onboarding flow. The first run exposed stale client navigation after durable writes; onboarding actions now invalidate the full route layout before redirect. A new account then completed organization creation, terms acceptance, and template selection without any manual reload in 3.6 seconds, 4.8 seconds, and 1.6 seconds respectively.
- The authenticated mobile workspace now keeps the signed-in email and Sign out control visible instead of hiding the only session-recovery action below 720px; the target is at least 44px.
- A presenter created sample request `PA-F37BFD7EBF` through the stable Demo UI. Durable state and the institution projection agree: Draft, zero of five activations used, no invitation sent, two distinct controlled participant addresses, two limited requested actions, and one saved activity entry.
- Both participant and team delivery paths now apply one shared fail-closed Demo recipient policy before provider submission. Automated tests prove normalized exact matches, rejection of unlisted and plus-variant addresses, denial when the allowlist is missing, and no behavior change outside Demo. The deployed Demo allowlist contains only the four controlled Passage test addresses.
- `demo.thepassageapp.io` is assigned to the Demo project but does not resolve until Cloudflare publishes `A demo.thepassageapp.io 76.76.21.21`. The stable Vercel fallback remains usable until then.
- Demo email now uses its own sending-only, Passage-domain-restricted Resend key and its own signed webhook endpoint. The application records provider acceptance first and then independently updates the institution projection when the signed delivery callback arrives.
- Fresh browser run `PA-F37BFD7EBF` passed institution draft and activation, principal email/open/confirmation, representative release/email/open/acceptance, two private synthetic PDF uploads, institution review of both files, disclosure consent, submission, and a limited institution decision. Usage moved from zero to exactly one of five only at activation.
- The replay exposed and closed a missing decision-notification step. A new decision now prepares and submits separate principal and representative receipt invitations; the receipt screen also offers explicit fresh-link recovery without changing the decision.
- Both receipt messages reached the controlled Gmail Inbox. Principal and representative views matched receipt `PAR-79DC9AAB1F39`, decision/current version 11, status, scope, limitation, and SHA-256 fingerprint `6fcda462ec7b2b43c65d49f933ebd39bdb16100ed6f2ab2e5dd614ddb9464ff6`.
- A subsequent synthetic revocation preserved the original limited decision while changing the institution, principal, and representative current status to Revoked. Both participant views showed “Revocation notice recorded.”
- The initial invitation and resume messages still landed in Gmail Spam while both final receipt messages landed in Inbox. Invitation deliverability remains a controlled-pilot operating gap, not a product-state failure.

## September 3 participant email mobile hardening

- The participant decision email now uses the shorter subject and heading “Decision receipt ready,” a compact outcome summary, and the plain-language label “Financial power of attorney request.”
- The responsive template fixes iPhone text inflation, reduces mobile spacing, and keeps its primary action at least 44px high.
- A headless Chrome render at 390 × 844 measured the complete email card at 382px high and the primary action bottom at 298px, placing the decision context and action inside the first mobile viewport.
- The legacy purpose phrase is also normalized at every institution and participant projection while the durable source value remains unchanged. Purpose-specific institution language is preserved.
- The full release gate passed: 80 of 80 domain tests, TypeScript, ESLint, and the optimized 23-page production build.

## September 3 namespaced Demo run

- An authenticated Demo organization owner or administrator whose exact email appears in `PASSAGE_DEMO_PRESENTER_ALLOWLIST` can prepare a fresh synthetic run in one click. The server, not the browser, selects the two exact controlled participant inboxes.
- A service-only database command verifies the active membership, organization, selected template, entitlement version and capacity, fixture version, idempotency key, and organization namespace before writing anything.
- One transaction creates the `demo_run`, sample draft request, request event, run event, organization audit entry, and command receipt. It sends no message, consumes no activation, changes no membership, deletes no evidence, and leaves prior runs intact.
- A local Postgres replay proved exact idempotent replay, payload-mismatch rejection, unauthorized-role rejection, stale-version rejection, append-only enforcement, and isolation between two simultaneous presenter organizations.
- The app/domain suite proves the exact presenter and recipient allowlists fail closed for missing, wildcard, wrong-role, and non-Demo configurations.
- Migration `20260903120000_authority_demo_runs.sql` and the exact presenter allowlist were applied to the isolated Demo environment. Demo deployment `dpl_79LiZy9cSY4SfhpHcErFupu1z7rG` and Production deployment `dpl_38EmoExZd9n3su3vpbnmo8TMSgaG` reached Ready; Production retains the generic not-found boundary for Demo-only commands.
- The authenticated Demo owner prepared fresh run `PA-3C6EE04048`. The new request opened as Draft, prior run `PA-F37BFD7EBF` remained intact, usage remained 1 of 5, no message was sent, and the activity count began at one.
- The signed-in workspace and new draft preserved the preparation notice, primary action, owner role, and Sign out recovery at desktop, 390px, and 360px.

## September 3 P0 negative persona matrix

- Transactional local-Postgres coverage now proves the seven required cases: wrong-role participant action, consumed-link reuse, stale participant page, institution rejection, representative withdrawal, accepted-request expiration, and fresh-link session recovery.
- Denied wrong-role, reused-link, and stale-page commands leave the request version/status, event count, participant decisions, and entitlement usage unchanged.
- Rejection writes one immutable no-authority decision and one event; exact idempotent replay writes nothing else. Expiration preserves the accepted decision and appends exactly one lifecycle event. Withdrawal remains a single terminal transition on exact replay.
- Recovery revokes the prior participant session, prepares and exchanges one new role-bound link, preserves request state and usage, and leaves three explicit access/recovery events.
- Both SQL scripts use fictional local fixtures inside transactions and end with `ROLLBACK`; they do not send email, access providers, or touch Demo, UAT, or Production. Hosted browser copy, message delivery, cross-persona receipt comparison for rejection/withdrawal/expiration, and scheduled expiration initiation remain manual UAT cases.

## September 3 public-route parity check

- Sixteen public routes returned HTTP 200 in both Production (`https://thepassageapp.io`) and the isolated Demo (`https://passage-authority-demo.vercel.app`), for 32 successful live responses.
- Coverage included the homepage, About, Contact, Integrations, Pricing, Pilot, Resources index, all three resource articles, Security, Templates, Privacy, Terms, Authorized Use, and the sign-in/evaluation entry page.
- The live Demo homepage also rendered the current Passage Authority positioning, institution decision boundary, sample request, navigation, and primary evaluation actions in a real browser.
- The repeatable `pnpm verify:public-release` gate checks those 32 responses plus invalid-link, consumed-link, expired-link, and unavailable-session guidance in both environments. The four recovery views were also rendered and read in the hosted Demo browser.
