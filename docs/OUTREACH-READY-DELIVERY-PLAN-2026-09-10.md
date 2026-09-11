# Outreach-ready product delivery plan

Latest UX2 completion: [JavaScript recovery guidance](JAVASCRIPT-RECOVERY-2026-09-11.md) replaces unexplained waiting with clear browser-setting and reload instructions. All 32 actual browser cases passed across four routes and four widths, with scripts disabled and enabled. The application still requires JavaScript; this is recovery guidance, not complete no-script support. Hosted cancellation replay, UAT preview SSO and broader release gates remain open.

Latest follow-up: [public keyboard navigation](PUBLIC-KEYBOARD-NAVIGATION-2026-09-11.md) adds native header shortcuts and repairs the 320px commercial-header overflow. This supersedes earlier statements that public-page skip navigation is unimplemented. Hosted replay, actual zoom/screen-reader and first-use verification remain open; no release or outreach occurred.

Latest UX2 progress: [native keyboard skip navigation](KEYBOARD-NAVIGATION-2026-09-11.md) is implemented for workspace and account/participant layouts. Eight Chromium layout checks passed at 1280/390/360/320px with JavaScript disabled. Public commercial navigation, actual zoom/screen-reader and independent first-use checks remain open. Hosted database evidence is unchanged; no migration was repeated. Hosted authenticated cancellation replay and UAT preview SSO remain release work. The earlier documentation checkpoint was pushed as `060b7b6`; Git and PR metadata access are restored.

September 11, 01:53 UTC: full access restored normal Git operations. Local branch now matches the published code with only documentation changes pending. PR 108 title/body updated successfully. Demo preview dpl_BEHhSRiY2j1NbdyqqfETQk1N2Gx4 is Ready and /api/version verifies ccbbc8531b2a7703cfda32301e2c9a37a85e60e9 on the intended branch. UAT preview dpl_32JXKTNZUTXrkDLAXnTJZb5CQST6 is Ready, but its version endpoint redirects to Vercel SSO even through vercel curl. Deployment protection remains enabled. Production /api/version still verifies main 42976b096b7569174f3b290419a20610ea3ea638. Hosted authenticated browser replay remains open; no release or outreach was performed.

Earlier access-blocker statements below are historical; the remaining preview access issue is UAT SSO.

September 11 UTC checkpoint: [hosted cancellation evidence](PENDING-CANCELLATION-HOSTED-2026-09-11.md). Code pushed at `ccbbc8531b2a7703cfda32301e2c9a37a85e60e9`; Demo/UAT migration and all three SQL rollback suites passed in each environment. Normalized function definitions match local. Vercel Git checks succeeded; exact-candidate hosted browser verification and production release remain pending. The connector returns no projects. This supersedes earlier hosted-migration-pending statements. No new reconciliation day or outreach release.

Owner writing rule: every website and product screen must use clear, natural, everyday language. Follow the [plain-language standard](PLAIN-LANGUAGE-STANDARD.md). Preserve the meaning of legal text and saved decisions.

Updated September 10, 2026 UTC. Owner direction: finish a beautiful, simple, user-friendly product that can support truthful one-pagers and outreach. This plan is the active execution order; historical scores and older priority lists do not override it.

## Where we are

The institution/principal/representative synthetic journey has passed, including scoped decisions, matching receipts, role boundaries and mobile checks. Production was rechecked at main `42976b096b7569174f3b290419a20610ea3ea638`. PR 108 contains tested team MFA visibility, workspace guidance, plain-language copy and draft recovery, and remains unmerged. See the [current gap assessment](PRODUCT-GAPS-2026-09-10.md). P1 and P2 are open. The current product is a controlled New York evaluation with two non-transactional actions, not the complete configurable institutional product.

The [market assessment](MARKET-RESEARCH-2026-09-10.md) supports the institutional acceptance/servicing focus. It does not establish customer demand, competitor superiority, a dollar TAM or enterprise compliance. Build controls to meet real obligations and buyer needs; do not build a general compliance platform.

## Product completion means

A first-time person can understand the product, use the appropriate entry point, complete their role without coaching, recover from a mistake, and see the correct result. Each screen answers: what is happening, who acts next, and what can I do now? Technical state names, internal readiness scores and implementation details stay out of the ordinary journey.

The institution retains legal, identity, fraud and access decisions. Existing-instrument acceptance must not be confused with creating a POA. A configured policy may not override applicable acceptance law.

## Delivery order

| ID | Workstream | Deliverable and exit evidence | Status |
| --- | --- | --- | --- |
| UX1 | Clear workspace | One prominent next action; open actionable work ahead of older receipts; named next actor; requested scope never labeled already permitted; clean empty/waiting/completed/error states; owner/staff/reviewer/auditor boundaries; desktop/390/360 and keyboard replay | Core implemented and locally verified; remaining accessibility/replay in UX2/REL1 |
| UX2 | Complete guided journey | Simplify start, onboarding, request preparation, participant steps, evidence corrections and receipts; retain entered information; readable labels, visible progress and recovery; first-time walkthrough without operator coaching | Partial: copy, draft recovery and closed-request guidance checked; remaining forms and full accessibility/first-use replay open |
| WF1 | Complete lifecycle | Institution can cancel an unneeded pending request through an authorized, versioned, idempotent command with event, notification treatment, all-persona status and receipt replay | Awaiting-principal slice verified locally and in hosted SQL; exact-candidate browser release, broader states and automatic notices remain open |
| WF2 | Real POA intake | Explicit supported principal-participation scope; approved path for principal unable to act; agent-initiated existing-instrument intake, successor/co-agent/conflicting-instrument handling or clear exclusions; never fabricate consent or infer incapacity | Open; product and counsel review |
| POL1 | Institution configuration | Governed action/evidence/channel/control catalogs; draft and publish immutable policy; pin snapshots; explicit stale-draft rebase; preserve activated history; test before/after publication | Open; specified, not built |
| LEG1 | State rules | Counsel-approved New York applicability, presentation dates, business-day deadlines, reasons and required notices; Pennsylvania separate acknowledgment and state tests before enablement | Open; external signoff required |
| SEC1 | Access and recovery | Release team inventory; scope MFA to users/data/buyer requirements, evaluate phishing-resistant authentication; controlled all-factors-lost recovery, support access and session revocation | Partial; broader scope open |
| OPS1 | Dependable operations | Deterministic invitations and recovery; immutable send attempts; real provider comparison; seven actual clean daily runs (currently 2/7); monitoring and exception owner | Partial |
| OPS2 | Resilience and data lifecycle | Accepted recovery targets, funded backup choice, isolated actual restore, incident exercise, retention/hold/deletion/export and subprocessor evidence | Open; owner plan/spend decision needed |
| ASS1 | Buyer assurance | Security/privacy/vendor-risk review, independent testing scope, accurate SOC 2 status and buyer-specific assurance plan; no self-certification | Open; qualified reviewers needed |
| REL1 | Outreach-ready release | Exact committed candidate, green checks, matched migrations, Git deployment, exact-SHA smoke/persona/terminal replay, timed simple demo, no unresolved critical/high defects | Open |
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
