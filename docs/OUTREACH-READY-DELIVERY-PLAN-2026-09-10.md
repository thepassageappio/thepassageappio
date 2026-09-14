# Outreach-ready product delivery plan

Rehearsal dependency updated: the owner supplied the two participant addresses and both inboxes are accessible (Gmail browser and connected Gmail). The approved pair is saved only in ignored work/approved-rehearsal-recipients.json. The Demo browser reached new authenticator setup at /mfa; credential-setup handoff is required before presenter access can proceed. No rehearsal invitation was sent or timed run started. Recipient allowlist matching still needs verification after access is restored.

Latest POL1 prerequisite: [draft policy comparison](DRAFT-POLICY-COMPARISON-2026-09-11.md) returns exact changes and rejects foreign-institution, future and older replacement snapshots. Six new tests and all 243 domain tests, TypeScript, lint and build passed. The result is comparison-only, not activation permission; authenticated publication lookup, locking and explicit rebase remain unbuilt. No live or database change.

Latest independent POL1 work: [strict saved-record reading](POLICY-ENVELOPE-READING-2026-09-11.md) rejects getters and unexpected properties before checking policy bytes. Eight new regression cases and all 237 domain tests, TypeScript, lint and build passed. This remains in open PR 109; no database or live product change. Publication, trusted history loading and request snapshot/rebase enforcement remain unfinished.

Latest release: PR [113](https://github.com/thepassageappio/thepassageappio/pull/113) is live on both sites at verified main `326976fd1dc0a4009b18db5429dedf474d48c37c`. [HTTP contact recovery](CONTACT-HTTP-RECOVERY-2026-09-11.md) preserves entries after invalid 503/429/502 responses. The 172-test build, eight exception-boundary and seven action checks passed. Both exact previews and both live sites each passed 12 injected errors, four preflight denials and four honeypot redirects at four widths. Public smoke passed 44 routes/eight recovery states; both error scans returned zero records. No migration, inquiry or provider send occurred. The owner approved rehearsal email; the approved pair is now available; presenter authenticator setup is the current blocker.

Presenter preparation: [run card](PRESENTER-RUN-CARD-2026-09-11.md) now gives setup, seven-minute targets, stop conditions and a blank evidence sheet. At 18:41 UTC both live sources matched origin/main ee3a5fb; eight entry pages, two sample sign-in gates and four byte-matched sample PDF downloads passed read-only checks. Older demo checklist results are explicitly historical. No fresh rehearsal, sign-in or provider send occurred.

Latest contact evidence: [local database replay](CONTACT-REPLAY-2026-09-11.md) passed three identical retries and one edited retry with the same reference, one inquiry/event/outbox, unchanged saved input, browser-role denial and rollback cleanup. No hosted write or provider delivery occurred. Committed HTTP response-loss and concurrency remain unverified.

Updated September 11, 2026 UTC. Codeword: **AUTHORITY COMPASS 771204**.

Latest UX2 form evidence: [native entry validation](ENTRY-FORM-VALIDATION-2026-09-11.md) passed 18 live form cases and 42 invalid attempts. Required fields, email format, contact permission, focus and retained values passed; no submit event or application write occurred. Contact server-error recovery is now shipped below; browser fetch disconnects are also handled; invalid HTTP responses are handled in PR 113; opaque server failures and authenticated first-use remain open.

Latest GTM1 preparation: [buyer one-pager PDF and claim review](BUYER-ONE-PAGER-2026-09-11.md) are complete as an internal draft. One-page render, full text, page bounds and contact link were checked. No distribution or demo-readiness approval is implied. Native screen-reader/spoken-output testing is unavailable in this session and remains open; do not repeat unsupported attempts.

Latest UX2 evidence: [native Chrome zoom](NATIVE-ZOOM-2026-09-11.md) passed 24 live entry/recovery cases at 200%/400%, including 180 keyboard focus stops, at main b207fb8. Earlier [text size and labels](ENTRY-ACCESSIBILITY-2026-09-11.md) checks also passed. Public entry/recovery zoom is checked; real screen-reader use and authenticated first-use/zoom remain open.

Earlier release evidence: PR [112](https://github.com/thepassageappio/thepassageappio/pull/112) was verified on both sites at main `ee3a5fbf6e83fadc320be3c11002af7055c566c8`. [Contact connection recovery](CONTACT-NETWORK-RECOVERY-2026-09-11.md) retains entries/key after browser fetch failure and shows retry guidance. The 172-test release, four exception-boundary cases and eight local failure/retry steps passed. Both exact previews and both live sites each passed four connection aborts followed by four server preflight denials. Public smoke passed 44 routes/eight recovery states and both error scans returned zero records. No migration, inquiry or provider send occurred. PR 111 server-error recovery remains included; prior evidence stays in its dated files.

The immediate priority is the [fresh buyer demo](BUYER-DEMO-PRIORITY-2026-09-11.md). The owner approved the rehearsal invitations and receipts after being told their purpose. The owner supplied the intended pair and inbox access is verified; use only that approved pair. No fresh timed rehearsal or inbox-delivery proof is claimed. Continue independent usability checks without sending email.

PR [109](https://github.com/thepassageappio/thepassageappio/pull/109) now contains unfinished policy groundwork and documentation. Canonical encoding, source resolution, structural/operational checks and private append-only storage are tested locally. Its two migrations (20260911072009 and 20260911113719) remain local only without local migration-history rows. Do not reapply them to recover context. Authenticated registration, complete semantic validation, publication, request binding and rebase remain unbuilt.

Owner writing rule: every website and product screen must use clear, natural, everyday language. Follow the [plain-language standard](PLAIN-LANGUAGE-STANDARD.md). Preserve the meaning of legal text and saved decisions.

Updated September 11, 2026 UTC. Owner direction: finish a beautiful, simple, user-friendly product that can support truthful one-pagers and outreach. This plan is the active execution order; historical scores and older priority lists do not override it.

## Where we are

The institution/principal/representative synthetic journey has passed, including scoped decisions, matching receipts, role boundaries and mobile checks. PR 112 is live at main `ee3a5fbf6e83fadc320be3c11002af7055c566c8`; earlier hosted cancellation and authenticated receipt evidence belongs to PR 108. See the [current gap assessment](PRODUCT-GAPS-2026-09-10.md). P1 and P2 are open. The current product is a controlled New York evaluation with two non-transactional actions, not the complete configurable institutional product.

The [market assessment](MARKET-RESEARCH-2026-09-10.md) supports the institutional acceptance/servicing focus. It does not establish customer demand, competitor superiority, a dollar TAM or enterprise compliance. Build controls to meet real obligations and buyer needs; do not build a general compliance platform.

## Product completion means

A first-time person can understand the product, use the appropriate entry point, complete their role without coaching, recover from a mistake, and see the correct result. Each screen answers: what is happening, who acts next, and what can I do now? Technical state names, internal readiness scores and implementation details stay out of the ordinary journey.

The institution retains legal, identity, fraud and access decisions. Existing-instrument acceptance must not be confused with creating a POA. A configured policy may not override applicable acceptance law.

## Delivery order

| ID | Workstream | Deliverable and exit evidence | Status |
| --- | --- | --- | --- |
| UX1 | Clear workspace | One prominent next action; open actionable work ahead of older receipts; named next actor; requested scope never labeled already permitted; clean empty/waiting/completed/error states; owner/staff/reviewer/auditor boundaries; desktop/390/360 and keyboard replay | Core implemented and locally verified; remaining accessibility/replay in UX2/REL1 |
| UX2 | Complete guided journey | Simplify start, onboarding, request preparation, participant steps, evidence corrections and receipts; retain entered information; readable labels, visible progress and recovery; first-time walkthrough without operator coaching | Partial: copy, draft recovery and closed-request guidance checked; entry/recovery enlarged-text and accessibility-label checks passed; native entry/recovery zoom checked; remaining forms, authenticated zoom, screen-reader and first-use replay open |
| WF1 | Complete lifecycle | Institution can cancel an unneeded pending request through an authorized, versioned, idempotent command with event, notification treatment, all-persona status and receipt replay | Awaiting-principal slice shipped and verified in hosted browsers; broader states and automatic notices remain open |
| WF2 | Real POA intake | Explicit supported principal-participation scope; approved path for principal unable to act; agent-initiated existing-instrument intake, successor/co-agent/conflicting-instrument handling or clear exclusions; never fabricate consent or infer incapacity | Open; product and counsel review |
| POL1 | Institution configuration | Governed action/evidence/channel/control catalogs; draft and publish immutable policy; pin snapshots; explicit stale-draft rebase; preserve activated history; test before/after publication | Overview, snapshots, private storage and four-section structural validation implemented locally; source resolution and operational compatibility checked locally; complete semantic validation, publication, request binding and rebase remain open |
| LEG1 | State rules | Counsel-approved New York applicability, presentation dates, business-day deadlines, reasons and required notices; Pennsylvania separate acknowledgment and state tests before enablement | Open; external signoff required |
| SEC1 | Access and recovery | Release team inventory; scope MFA to users/data/buyer requirements, evaluate phishing-resistant authentication; controlled all-factors-lost recovery, support access and session revocation | Partial; broader scope open |
| OPS1 | Dependable operations | Deterministic invitations and recovery; immutable send attempts; real provider comparison; seven actual clean daily runs (currently 3/7); monitoring and exception owner | Partial |
| OPS2 | Resilience and data lifecycle | Accepted recovery targets, funded backup choice, isolated actual restore, incident exercise, retention/hold/deletion/export and subprocessor evidence | Open; owner plan/spend decision needed |
| ASS1 | Buyer assurance | Security/privacy/vendor-risk review, independent testing scope, accurate SOC 2 status and buyer-specific assurance plan; no self-certification | Open; qualified reviewers needed |
| REL1 | Outreach-ready release | Exact committed candidate, green checks, matched migrations, Git deployment, exact-SHA smoke/persona/terminal replay, timed simple demo, no unresolved critical/high defects | Application release verified; reliable fresh demo and remaining P1/P2 gates open |
| GTM1 | Claim and asset readiness | One-page claim ledger, first-five verified contacts, actual introduction paths or explicit owner revision, unsent personalization, final sender review; every promised feature demonstrable | Partial |

Proceed with independent engineering while waiting for external decisions. Preserve standing release holds; do not silently waive P1/P2, real-data, spend or legal gates to meet a completion claim.

## Release gates

1. **Internal preparation:** research, truthful one-pager drafts, product polish and synthetic QA may proceed now. Preparing assets does not authorize sending them.
2. **Outreach and buyer demonstrations:** close the standing P1/P2 gates and record owner release signoff, exact production SHA, supported audience/scope, claim ledger and tested demo. No outreach is sent by the agent without explicit authorization.
3. **Real-data pilot:** separately approve institution, data, workflow, security, privacy, legal, contract, operational and assurance boundaries. A $5,000 pilot is not automatic approval to upload customer documents.
4. **Expansion:** add jurisdictions, authority types, integrations and commercial tiers only with their own proof. Pennsylvania is a committed gap, not an enabled jurisdiction. Participant portfolio and universal cross-institution ambitions remain outside V2.

## Experience acceptance criteria

- One primary task per screen, with secondary/admin work visually subordinate.
- Role-appropriate navigation and calls to action; no request-creation prompts for read-only personas.
- Status states name the next actor without implying the signed-in user can act for them.
- Pending requests show requested actions; accepted scope comes from the institution decision, never the request count.
- Short plain-language instructions; predictable back/continue behavior; no unexplained dead ends.
- Empty, loading, unavailable, validation, expired-link and terminal states explain recovery.
- Desktop, 390px and 360px; keyboard, focus, zoom and screen-reader review; 44px product target for interactive controls.
- Decisions, notices and receipts distinguish recorded acceptance from actual downstream access changes.
- No person is forced to confirm on behalf of an incapacitated principal; unsupported paths are excluded until reviewed.
- A fresh participant can complete the supported scenario without developer tools, database edits or provider-dashboard link retrieval.

## One-pager claim ledger

| Safe draft claim | Proof to attach | Do not claim yet |
| --- | --- | --- |
| Coordinates a scoped institution decision with a shared record | Verified synthetic walkthrough and receipt | Universal legal validity or guaranteed acceptance |
| Institution retains its decision and access responsibility | Product contract and UI | Passage grants banking access or moves money |
| Supports a controlled synthetic New York evaluation | Current selected template and two permitted evaluation actions | All POA cases, Pennsylvania or five-state availability |
| $5,000 scoped founding pilot, 60–90 days, credited under agreement | Approved pricing and explicit pilot contract | Validated ROI, market-standard pricing or guaranteed annual savings |
| Specific tested security controls | Dated control evidence with exact scope | SOC 2 report, audit underway or enterprise compliance |
| Configurability is planned until published and replayed | POL1 release evidence when complete | Current general institution policy configuration |

## Dependencies only the owner or outside parties can resolve

- Actual personal introduction paths and final sender/release signoff.
- Backup/storage and any plan upgrade spending decision; no new spend is assumed.
- Qualified counsel's state/scope decisions and external security/assurance conclusions.
- Institution baseline volumes, handling effort, procurement criteria and willingness to pay.
- Elapsed calendar evidence: rerunning reconciliation on the same day cannot create another day.

Do not let these dependencies stop useful local engineering. Do not mark them closed through documentation alone.

Closed-request guidance is implemented locally with 76 rendered-page checks. See [evidence and limits](CLOSED-REQUEST-GUIDANCE-2026-09-10.md). The [narrow cancellation implementation](PENDING-CANCELLATION-EVIDENCE-2026-09-10.md) now passes database, browser, shared-receipt and concurrency checks. Hosted migration/release, broader states and automatic notices remain open.

## Immediate continuation

UX1 core workspace changes and local checks are recorded in [workspace evidence](WORKSPACE-GUIDANCE-2026-09-10.md). A [one-pager draft](ONE-PAGER-DRAFT-2026-09-10.md) is prepared for later approved use. Continue UX2, WF1 and POL1 while WF2/LEG1 are prepared for qualified review. Carry the existing tested PR work through the normal release process. Update the evidence ledger after each completed slice, and state separately whether it is implemented, tested, merged and live.
