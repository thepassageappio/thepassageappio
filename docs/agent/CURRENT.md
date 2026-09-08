# Current Passage checkpoint

Updated September 8, 2026 UTC after the production MFA and mobile release.

## Verified

- P0 demo readiness remains closed after the real four-persona production rehearsal. This does not approve buyer-facing activity or a real-data pilot.
- PR #92 merged to `main` as `b1beaf3c912239961bd872448272015022bad49c`. Production served that exact SHA at `/api/version` before the database release proceeded.
- The committed privileged-MFA migration is applied to UAT and Demo. In hosted UAT, the real database boundary denied an owner JWT at AAL1 with `mfa_verification_required` and allowed the same owner at AAL2.
- A new production owner using `steveandashturrisi@gmail.com` completed organization onboarding, terms, the New York template, real TOTP enrollment, and the AAL2 challenge. A fresh AAL1 sign-in was then forced through the existing-factor challenge before `/app` loaded.
- Authenticated Edge verification passed on desktop and an iPhone 13 viewport. That pass found a real 390px workspace-navigation overlap, which PR #93 fixed and merged as `b27951fda2cf22bc17d1420f74c229f4d956f6ed`.
- Production now serves `cabd731eca69fdf3db4769a13076cfce903b186c` from GitHub `main` with `provenance: verified`. The live 390px retest returned 200, kept document width at 390px, and placed all five then-current navigation links in distinct non-overlapping positions inside a horizontal scroll row.
- The mobile regression test now rejects either fixed-column sidebar rule that caused the overlap. The final patch passes all 148 domain tests, TypeScript, ESLint, optimized build, and Ready Vercel checks for UAT and Demo.
- UAT and Demo each compute `clean`: zero unresolved provider rows and zero billing, usage, or decision variances. The HubSpot and Stripe residue was resolved through service-only audited repair, and the live notification send-history fix is source controlled.
- The real production database is Supabase `Passage Authority UAT` (`ywlrxdjibngroycwnujg`), not Demo. Demo is `bklrclpertdtmhycpqlz`.
- Supabase app-level TOTP works on the Free plan. Organization-member MFA enforcement is a separate paid-plan administrative feature.

## Blocking

1. September 7 and September 8 UTC are immutable `blocked` reconciliation days. Zero streak days are credited. Record day 1 on September 9 UTC; September 15 is the earliest possible day 7.
2. The current reconciliation compares Passage's durable provider state. Full Passage/Stripe/HubSpot comparison still requires HubSpot credentials and live provider reads.
3. Privileged MFA enrollment, AAL1 denial, AAL2 success, fresh-session challenge, and production replay are proven. A branch now adds multiple-factor challenge selection, backup-factor enrollment, and protection against removing the only verified factor. It still needs review, deployment, and a two-device hosted replay before the P2 MFA control closes.
4. Supabase production remains on Free with no automated backups. A paid-plan decision and a real restore drill remain required before real data.
5. Backup/restore/incident evidence, privacy/security/vendor-risk review, and counsel approval for New York, Pennsylvania, New Jersey, Connecticut, and Massachusetts remain open.
6. Pennsylvania gap analysis now confirms `representative_certification` does not satisfy the statutory agent Acknowledgment. The separate requirement, exceptions, evidence, retention, and receipt wording still need counsel approval and implementation. See `docs/PENNSYLVANIA-LAUNCH-REQUIREMENTS-2026-09-08.md`.

## Commercial hold

P1 is prepared but not launched. Cold outreach, LinkedIn publication, buyer-facing demos, and real-data pilots remain held until **P1 and P2 both close**. Drafting, research, synthetic QA, pricing review, and demo refinement continue.

## Non-blocking backlog

- Register and DNS-verify the sending domain in Google Postmaster Tools before real customer email volume.
- Add an institution-authorized cancel/withdraw action while a request still awaits the principal.
- Finalize a truthful SOC 2 path and timeline before the first sales conversation.
- Add team-visible privileged-MFA compliance and a controlled lost-factor recovery process.

For release evidence, read [../AUTHORITY-COMPASS-RELEASE-CHECKPOINT-2026-09-08.md](../AUTHORITY-COMPASS-RELEASE-CHECKPOINT-2026-09-08.md). For the full delivery contract, read [../V2-DELIVERY-ROADMAP.md](../V2-DELIVERY-ROADMAP.md).
