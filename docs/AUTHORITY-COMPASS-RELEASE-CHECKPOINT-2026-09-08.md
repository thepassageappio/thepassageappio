# Authority Compass release checkpoint — September 8, 2026

## Released

- PR #92, `Enforce privileged MFA and audit provider reconciliation`, merged as `b1beaf3c912239961bd872448272015022bad49c`.
- PR #93, `Fix overlapping mobile workspace navigation`, merged as `b27951fda2cf22bc17d1420f74c229f4d956f6ed`.
- `thepassageapp.io` serves the latter exact GitHub `main` SHA with verified provenance.
- Vercel reported Ready for both `passage-authority-uat` and `passage-authority-demo` on both release commits.
- The privileged-MFA migration is applied to UAT and Demo. Hosted security-advisor output showed the same existing intentional SECURITY DEFINER warnings and leaked-password-protection warning; the release added no new advisor category.

## Hosted MFA evidence

- Hosted UAT database test: owner AAL1 denied with `mfa_verification_required`; owner AAL2 allowed.
- Production browser test account: `steveandashturrisi@gmail.com`.
- Completed organization onboarding, required agreements, New York template selection, TOTP enrollment, code verification, and access to `/app`.
- A separate fresh AAL1 sign-in with a verified factor redirected to `/mfa`; a current TOTP challenge elevated the session and allowed `/app`.
- The route, Server Action, and database layers are deployed. Lost-factor recovery or backup factors remain an open P2 requirement.

## Mobile finding and repair

The first authenticated iPhone 13-sized production pass found five workspace links competing across two fixed three-column media rules. Text overlapped even though the page itself had no horizontal overflow. The first edit exposed a second later override, so the final patch removed both fixed-column behaviors and strengthened the test to reject any reintroduction.

Final production measurement at 390px:

- HTTP 200 at `/app` after a real existing-factor MFA challenge.
- Document `clientWidth = 390`, `scrollWidth = 390`.
- Navigation `clientWidth = 358`, `scrollWidth = 734`.
- Five links had distinct ordered offsets and `overlaps = false`.

This is a horizontally scrollable navigation row by design; it does not widen the page canvas.

## Reconciliation state

Both UAT and Demo returned `status: clean` from `authority_private.compute_daily_reconciliation_v1()` after release. These calls are readiness checks, not credited replacements for the immutable daily record. September 7 and September 8 remain blocked. September 9 UTC is the first possible credited day 1.

The current computation compares Passage's internal durable provider state and does not call Stripe or HubSpot live APIs. HubSpot credentials and provider reads remain required for the full three-way claim.

## Commercial decision

P0 demo readiness is closed. P1 is prepared but not launched, and P2 remains open. Outreach, LinkedIn publication, and buyer-facing demonstrations stay held until P1 and P2 both explicitly close. The product may continue through internal synthetic QA, five-state legal preparation, demo refinement, pricing review, and sales-material drafting.
