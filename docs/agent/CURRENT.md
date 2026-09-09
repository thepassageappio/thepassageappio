# Current Passage checkpoint

Updated September 9, 2026 UTC after the gated-sample attribution and nurture-enrollment release.

## Verified

- The complete post-MFA production persona matrix passed on September 9. PR #105 merged as `f99da278a9774516ad31b6bd14e593e8b307fb73` and production served that exact SHA. Owner and Administrator each rendered a real QR image and manual secret, verified TOTP, and reached `/app`; hosted UAT recorded one verified TOTP factor for each. A separate Institution Reviewer received the review-only workspace without privileged MFA. Request `PA-E3DEFCE539` then completed principal confirmation, representative acceptance and certification, two fictional evidence uploads, institution review, submission, an accepted-with-limits decision, and matching owner/principal/representative receipts. The application regression that reopened P0 is closed. Final presenter sign-off remains open for deterministic inbox delivery, timed demo, exact mobile/accessibility, and hosted negative-path evidence.
- PR #92 merged to `main` as `b1beaf3c912239961bd872448272015022bad49c`. Production served that exact SHA at `/api/version` before the database release proceeded.
- The committed privileged-MFA migration is applied to UAT and Demo. In hosted UAT, the real database boundary denied an owner JWT at AAL1 with `mfa_verification_required` and allowed the same owner at AAL2.
- A new production owner using `steveandashturrisi@gmail.com` completed organization onboarding, terms, the New York template, real TOTP enrollment, and the AAL2 challenge. A fresh AAL1 sign-in was then forced through the existing-factor challenge before `/app` loaded.
- Authenticated Edge verification passed on desktop and an iPhone 13 viewport. That pass found a real 390px workspace-navigation overlap, which PR #93 fixed and merged as `b27951fda2cf22bc17d1420f74c229f4d956f6ed`.
- PR #95 merged as `8e3ca10d7241f17815a4a154ef5e144c558268ac`. PR #96 then merged the authority-scope catalog and forward-only policy contract as `07edaaef50dcecb46dce014c42f001462984b75c`.
- PR #99 deployed the gated read-only sample. PR #100 merged as `b9dbcbea693ebdcd9263502aa16ba740b6a77015`; the production sample-lead replay served that exact GitHub `main` SHA with `provenance: verified`. PR #101 later merged the optional V3 participant authority portfolio strategy.
- The first production sample opt-in recorded `PAS-00000001`. Its HubSpot projection initially failed because the verified email already belonged to Contact `535676541644`; PR #100 added email identity resolution. The service-only audited retry then applied on attempt 2 and updated that existing Contact with the Passage reference, consent version, source, and prospect key. Existing identity fields were preserved; the sample created no Deal or Ticket.
- The live backup-authenticator flow passed with an authorized synthetic owner: primary enrollment, second verified factor, fresh AAL1 sign-in, selection of `Backup authenticator 2`, AAL2 challenge, and `/app` entry. Both automation-created factors were then removed from the synthetic account and the database confirmed zero remaining factors.
- The prior live 390px retest returned 200, kept document width at 390px, and placed all five then-current navigation links in distinct non-overlapping positions inside a horizontal scroll row. Source regression coverage includes the new sixth security link, but an exact hosted 390px replay with all six links remains open because the attached Chrome control could not resize its fixed viewport and the isolated browser runtime failed to launch. Do not report the six-link mobile replay as passed yet.
- The mobile regression test now rejects either fixed-column sidebar rule that caused the overlap. The current release passes all 158 domain tests, TypeScript, ESLint, optimized build, and Ready Vercel checks for UAT and Demo.
- UAT and Demo each compute `clean`: zero unresolved provider rows and zero billing, usage, or decision variances. The HubSpot and Stripe residue was resolved through service-only audited repair, and the live notification send-history fix is source controlled. UAT's Passage HubSpot Service Key is configured and the real Contact projection passed.
- The real production database is Supabase `Passage Authority UAT` (`ywlrxdjibngroycwnujg`), not Demo. Demo is `bklrclpertdtmhycpqlz`.
- Supabase app-level TOTP works on the Free plan. Organization-member MFA enforcement is a separate paid-plan administrative feature.

## Executive readiness assessment

**Provisional overall buyer-ready launch score: 6.8/10.** The hosted new-owner and administrator MFA paths, private-table hardening, and complete production persona matrix now pass. The score remains below buyer-ready because inbox delivery is not deterministic, exact release-candidate QA is incomplete, and P1/P2 still have material commercial, resilience, recovery, state, and external-review gates.

| Dimension | Score | Assessment |
| --- | ---: | --- |
| Product vision and category | 9.0/10 | A clear wedge: the institution's operating record for delegated authority after a document arrives, with a separate longer-term participant portfolio and multi-recipient case opportunity |
| Differentiation | 8.5/10 | Effective-dated policy, request snapshots, bounded decisions, matching receipts, and append-only lifecycle history form a defensible system-of-record direction |
| Core workflow and synthetic demo | 8.0/10 | The exact production release passed owner/admin/reviewer/principal/representative execution and matching receipts; timed presentation, deterministic inbox delivery, exact mobile/accessibility, and the remaining hosted negative paths remain |
| Institution-ready configurability | 4.5/10 | Authority actions and evidence requirements are still fixed synthetic fixtures; the versioned policy/catalog management surface is specified but not built |
| Security, resilience, legal, and real-data operations | 5.5/10 | Default-deny RLS is applied to all 20 private tables in UAT and Demo and hosted browser-role boundary checks pass; MFA recovery, backups/restore, assurance evidence, and counsel approval remain open |
| GTM package and measurement | 6.5/10 | Pricing, held content drafts, a researched 20-account list, and a written Proof.com response exist; named buyer contacts, confirmed warm paths, first-five personalization, buyer evidence, and validated conversion economics remain open |

The strongest product thesis is no longer a generic POA workflow. Passage can become the institution's current, auditable decision layer for delegated authority: an institution publishes its governed policy, a request snapshots that policy, separate people provide identity and authority evidence, the institution records a bounded decision, and every authorized party sees a matching receipt and later lifecycle changes. The optional V3 expansion lets one underlying authority or life event create separate confidential cases for several banks, insurers, utilities, government bodies, funeral homes, or other recipients while each recipient keeps its own evidence and decision boundary. Passage must not imply that one recipient's acceptance applies to another or that Passage creates legal authority.

Commercial-planning coverage is assessed separately in [../COMMERCIAL-STRATEGY-COVERAGE-2026-09-09.md](../COMMERCIAL-STRATEGY-COVERAGE-2026-09-09.md). Independent findings are recorded in [../QA-REPORT-2026-09-09.md](../QA-REPORT-2026-09-09.md) and [../STRATEGIC-REVIEW-2026-09-09.md](../STRATEGIC-REVIEW-2026-09-09.md).

## Blocking

1. The post-MFA production persona matrix passes. Final presenter sign-off still requires a deterministic email-link plan, timed run, exact mobile/accessibility replay, and the remaining hosted negative paths.
2. Default-deny RLS is applied to all 20 `authority_private` tables in UAT and Demo. Hosted checks confirm zero direct browser-role table privileges and the RLS-disabled advisor finding is gone. The four intentionally authenticated security-definer command functions and leaked-password-protection setting still require explicit closeout evidence.
3. September 7 and September 8 UTC are immutable `blocked` reconciliation days. September 9 is verified clean day 1; September 15 is the earliest possible day 7 if every daily run and required live-provider comparison remains clean.
4. The current reconciliation compares Passage's durable provider state. UAT HubSpot write credentials and Contact projection are proven; full Passage/Stripe/HubSpot comparison still requires live provider reads.
5. Owner and independent administrator MFA enrollment now pass. P2 still needs an authorized and audited all-factors-lost recovery command/procedure plus team-visible privileged-MFA compliance.
6. Supabase production remains on Free with no automated backups. A paid-plan decision and a real restore drill remain required before real data.
7. Backup/restore/incident evidence, privacy/security/vendor-risk review, and counsel approval for New York, Pennsylvania, New Jersey, Connecticut, and Massachusetts remain open.
8. Pennsylvania's statutory agent Acknowledgment still needs counsel approval and implementation. See `docs/PENNSYLVANIA-LAUNCH-REQUIREMENTS-2026-09-08.md`.
9. The current two-action scope remains a synthetic fixture; the institution catalog, action governance, snapshots, and per-action decisions are not implemented. See `docs/AUTHORITY-SCOPE-CATALOG-REQUIREMENTS-2026-09-08.md`.
10. Production still has a fixed three-requirement checklist and read-only policy page. The policy-management contract is specified, but implementation remains open. See `docs/INSTITUTION-POLICY-MANAGEMENT-REQUIREMENTS-2026-09-08.md`.

## Commercial hold

P1 is **in preparation**: the researched 20-account source list and Proof.com response exist, while named buyer contacts, confirmed warm paths, first-five personalization, sender review, and buyer evidence remain open. Contact mapping, warm-path research, personalization, synthetic QA, pricing work, and demo refinement may continue now. No message, LinkedIn publication, nurture delivery, or buyer-facing demo is released until the documented gate is explicitly changed and P1 and P2 close.

## Top five execution priorities

1. **Finish presenter-grade release QA.** The post-MFA persona matrix passes; now complete a timed run, deterministic invitation-delivery fallback, exact 390px/360px and keyboard/accessibility replay, and the hosted negative-path set.
2. **Close the hosted security findings.** Review the four intentionally authenticated security-definer RPCs, document their authorization/MFA boundary, and resolve or explicitly accept the leaked-password-protection setting.
3. **Finish the first-five discovery batch.** Use the completed 20-account source list to identify real buyer contacts, confirm warm paths where available, personalize the first five, and complete sender review. Keep all delivery held while engineering closes P0 and P1/P2 remain open.
4. **Preserve reconciliation and finish security/state gates.** Maintain the seven-day streak with live provider reads; decide backups, run restore/recovery evidence, and finish counsel packages for NY/NJ/CT/MA/PA including Pennsylvania's Acknowledgment.
5. **Build the configurable policy/catalog, then rehearse and release.** Implement effective-dated institution policy and scope, stale-draft rebase, exact mobile/accessibility repairs, final persona QA, pricing/value proof, and the held outreach/LinkedIn/nurture package only after the applicable gates close.

## September 9 post-MFA production evidence

- Institution personas: the existing Owner and newly invited Administrator both completed real TOTP enrollment and entered the production workspace at AAL2. The independently invited Institution Reviewer entered a review-only workspace with no request-creation navigation, matching the intended policy.
- Participant workflow: production request `PA-E3DEFCE539` covered two non-transactional actions for a fictional deposit relationship. The principal and representative used separate one-time sessions; the representative uploaded only the approved fictional PDFs; the institution recorded `Accepted with limits` with `No money movement` and `No account ownership changes`.
- Receipt integrity: owner, principal, and representative receipt views showed the same outcome, accepted actions, limits, people, account boundary, and receipt `PAR-1805F05F8FC4`.
- Delivery caveat: Resend recorded the participant and team invitations as delivered, but exact Gmail searches did not surface several invitation messages. Decision receipts did surface. This reproduces the known Gmail post-acceptance placement/drop risk. It is not an application-state failure, but it can break a live demo and remains a release blocker until the presenter path has a proven fallback and Google Postmaster/domain reputation work is underway.

## Evidence-based timeline

- **September 9–15:** earliest possible seven-day reconciliation window, only if both environments record clean every UTC day and live provider reads are operating.
- **September 9–18:** focused engineering window for configurable institution policy/catalog, administrator recovery, exact mobile checks, and the technical backup/restore work if the plan decision is made immediately.
- **September 9–30:** counsel and assurance window for the five-state packages, Pennsylvania Acknowledgment, privacy/security/vendor-risk review, and buyer-ready SOC 2 path. External reviewer availability controls this date.
- **Earliest credible controlled outreach: September 22–30.** September 15 is only the reconciliation floor; outreach still requires every P1/P2 exit item and an explicit go decision.
- **Earliest credible real-data pilot: late September to early October**, subject to paid backups, a successful restore drill, security/privacy/vendor-risk closeout, counsel approval, and a qualified institution's requirements. Synthetic demos remain distinct from this approval.

## Non-blocking backlog

- Validate and later build the optional participant authority portfolio described in [../PARTICIPANT-AUTHORITY-PORTFOLIO-STRATEGY-2026-09-08.md](../PARTICIPANT-AUTHORITY-PORTFOLIO-STRATEGY-2026-09-08.md). It would let principals and representatives retain receipts and see their permitted relationships across separate institution-specific recognition cases. It is a V3 differentiation hypothesis, not implemented, not a universal registry, not a current launch gate, and not an approved public claim. New data-model work must preserve a path to stable parties, authority relationships, consent grants, institution recognition cases, and acknowledged downstream states rather than stretching record-bound participant sessions across requests.
- The sample-workflow access mismatch is fixed in production: marketing sample links now use `/sample` instead of creating an Owner workspace and forcing MFA. Production UAT currently has Google OAuth disabled, so the live path is a one-time email link; Google is enabled and previously proven in Demo. After authentication, a first-time viewer must explicitly choose `Agree and view sample`. That action writes a private append-only consent revision, commercial event, and idempotent HubSpot Contact job before access is granted. Only the current consent version unlocks the sample. The deployed 390px replay passed, and the real production projection updated the existing Passage HubSpot Contact without creating a Company, Deal, or Ticket. See [../SAMPLE-WORKFLOW-ACCESS-DECISION-2026-09-08.md](../SAMPLE-WORKFLOW-ACCESS-DECISION-2026-09-08.md).
- PR #103 merged as `88d9c3a3fcf99b265cc277c4b35a8e5adca4c2de` and is live on production with verified GitHub `main` provenance. The gated sample now uses canonical attribution `website_sample_gated` with HubSpot label `Website - Gated Sample`. Consent version `sample-access-contact-2026.2` explicitly covers a short sample follow-up series, product updates, and a walkthrough invitation. One transaction records append-only consent and nurture-enrollment events and queues the HubSpot projection with program `sample_evaluator`; delivery status remains `held_until_p1_p2`. Migration `20260909051650` is applied to UAT and Demo. HubSpot Workflows are unavailable in the current free portal, and no nurture sends are authorized before both commercial gates close.
- Register and DNS-verify the sending domain in Google Postmaster Tools before real customer email volume.
- Add an institution-authorized cancel/withdraw action while a request still awaits the principal.
- Finalize a truthful SOC 2 path and timeline before the first sales conversation.
- Add team-visible privileged-MFA compliance and a controlled lost-factor recovery process.

For release evidence, read [../AUTHORITY-COMPASS-RELEASE-CHECKPOINT-2026-09-08.md](../AUTHORITY-COMPASS-RELEASE-CHECKPOINT-2026-09-08.md). For the full delivery contract, read [../V2-DELIVERY-ROADMAP.md](../V2-DELIVERY-ROADMAP.md).
