# Passage Authority controlled MVP release evidence

> **Document status, September 2, 2026:** This proves the fictional controlled MVP and the isolated hosted Authority UAT environment. It is not evidence of legal validity, institutional acceptance, paid entitlement, enterprise security certification, or readiness for real customer data.

Date: September 2, 2026

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

- `thepassageapp.io` and `www.thepassageapp.io` now resolve to Authority deployment `dpl_5kHcpF1ab6XX8Y5RQNiW37qj83ju`.
- Both custom domains are assigned at the project level to `passage-authority-uat`; the retired `thepassageappio` project retains only its `vercel.app` domain and cannot reclaim the public aliases on a later build.
- The public homepage renders the Passage Authority title and financial POA value proposition with no browser warnings or errors.
- An unauthenticated request to `/app` redirects to `/start?intent=sign-in` on the public domain.
- The 390px and 360px homepage checks passed without horizontal overflow.
- No Authority runtime error was present in the 30-minute post-cutover log check.
- Legacy rollback remains available at deployment `dpl_CJUFCYSw9GZBuK4Wy98z6tTbqa4A`; rollback requires reassigning both public aliases to that deployment.
- GitHub `main` was fast-forwarded without history rewriting to Authority cutover commit `fe0766e`, preventing a later main deployment from restoring the retired product source.
- Secure email and participant links intentionally continue to use `https://passage-authority-uat.vercel.app` until the public domain is added to the Supabase Auth redirect allowlist and retested.

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

- Domain and persistence tests: 65 passed
- TypeScript: passed
- ESLint: passed
- Next.js production build: passed

## Controlled boundary

This release uses fictional records and synthetic evidence. It does not contact an institution, validate a live legal instrument, provide a legal opinion, or claim production security certification. Earlier hosted invitation tests used controlled owner mailboxes; provider acceptance and inbox placement remain separate from the authority decision.

Production readiness still requires tenant isolation, production authentication, reviewed Postgres row-level security, real evidence-provider integrations, key management, retention and recovery controls, observability, security testing, legal review, and a named institution pilot.
