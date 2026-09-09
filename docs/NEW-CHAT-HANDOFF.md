# Passage Authority fresh-chat handoff

**Codeword:** `AUTHORITY COMPASS 771204`

## Resume sequence

1. Read `AGENTS.md`.
2. Read [agent/CURRENT.md](./agent/CURRENT.md).
3. Inspect Git status and preserve all uncommitted work.
4. Load only the playbook for the active task.

## Latest restart checkpoint

Production is on GitHub `main` SHA `07edaaef50dcecb46dce014c42f001462984b75c`, verified by `https://thepassageapp.io/api/version`. PR #92 delivered auditable provider cleanup, source-controlled notification history, reconciliation repair, progressive release controls, and three-layer privileged MFA. PR #93 fixed the mobile workspace-navigation overlap found during authenticated release QA; PR #94 recorded that release evidence; PR #95 added owner/admin backup-authenticator enrollment, factor selection at challenge, and the Pennsylvania requirements packet; PR #96 made the institution authority-scope catalog and forward-only policy/rebase behavior the product contract.

Hosted owner TOTP enrollment, AAL1 database denial, AAL2 database success, and production desktop verification pass. The deployed backup-factor flow passed a real fresh-session replay: both factor choices appeared, the backup factor completed AAL2, and `/app` loaded. The two automation-created factors were removed afterward and zero remained. The prior five-link 390px replay remains valid; exact hosted 390px geometry with the new sixth security link is still open. Do not mark P2 MFA closed until an administrator replay and an authorized, audited all-factors-lost recovery process pass.

The current New York template still hard-codes two non-transactional actions. That is a controlled synthetic fixture, not the intended institution product. Read `docs/AUTHORITY-SCOPE-CATALOG-REQUIREMENTS-2026-09-08.md`. Institution onboarding must install a versioned starter catalog per authority type and allow authorized owners/admins to activate or deactivate standard actions, add governed custom actions, configure channels and limits, and publish immutable versions. Requests and receipts must snapshot the exact version. Do not claim this configurability in buyer materials until it is implemented and replayed.

The evidence policy is also fixed today: a database trigger seeds POA document, representative certification, and identity evidence, and `/app/policies` is read-only. The website sentence saying the institution defines its evidence requirements was ahead of current behavior. The implementation branch corrects that copy and adds `docs/INSTITUTION-POLICY-MANAGEMENT-REQUIREMENTS-2026-09-08.md`; use that contract for action, exclusion, evidence, review, channel, control, legal-lock, publication, rebase, and enforcement work.

The participant experience is currently an expiring, role-bound session for one authority record; there are no persistent participant accounts or cross-request dashboards. The validated V3 direction is an optional participant authority portfolio: principals see who acts for them, representatives see whom they help, and both see separate institution recognition decisions, scope, limits, receipts, and acknowledged lifecycle states. Read `docs/PARTICIPANT-AUTHORITY-PORTFOLIO-STRATEGY-2026-09-08.md`. Preserve the architectural path, but do not make it a V2 launch gate or public claim and never imply that one institution's acceptance applies to another.

Marketing sample links must not route a prospect into Owner onboarding and privileged MFA. The current release branch adds a gated `/sample`: Google or email authentication creates a viewer with no organization membership. A first-time viewer then explicitly chooses `Agree and view sample`; the service records a versioned append-only contact consent and queues an idempotent HubSpot Contact before opening the read-only fictional workflow. Creating an institution workspace remains a separate deliberate action and Owner/Admin access still requires AAL2. The local transaction and 390px browser replay pass; the additive migration is applied and permission-verified in UAT and Demo. Application deployment and a real projection into Passage HubSpot portal `246159600` remain open because its private-app credentials are still unconfigured. Read `docs/SAMPLE-WORKFLOW-ACCESS-DECISION-2026-09-08.md`.

Pennsylvania is now a confirmed product gap rather than an unanswered investigation. The generic `representative_certification` does not capture the agent signature/name, date, substantially prescribed § 5601(d) content, executed artifact, or association with the POA. Read `docs/PENNSYLVANIA-LAUNCH-REQUIREMENTS-2026-09-08.md`; keep Pennsylvania disabled until counsel approves and the separate state requirement passes synthetic QA.

UAT and Demo currently compute reconciliation as `clean`, but September 7–8 are immutable blocked days. Run and record the first credited day on September 9 UTC. The internal job still needs live HubSpot provider comparison before it can satisfy the full three-way claim.

## Current objective

Start and preserve the seven-day reconciliation streak, close lost-factor recovery and backup/restore evidence, finish the five-state counsel package with Pennsylvania's statutory Acknowledgment answered, then finalize the held demo, pricing, value proposition, outreach, and LinkedIn materials. P0 is closed; buyer-facing release and real-data approval still require P1 and P2.

## Standing gates

- No cold outreach, LinkedIn publication, or buyer-facing demo until P1 and P2 are explicitly closed.
- No real institution data until backups, restore evidence, security/privacy/vendor-risk review, and counsel gates close.
- App-level TOTP is available on Supabase Free. Production remains on Free with no automated backups; the plan decision belongs to the owner.
- Before real email volume, register the authenticated sending domain in Google Postmaster Tools.
- Track institution-side cancellation of awaiting-principal requests as a product gap.
- Prepare a truthful SOC 2 path and timeline before the first sales conversation.

Detailed release evidence: [AUTHORITY-COMPASS-RELEASE-CHECKPOINT-2026-09-08.md](./AUTHORITY-COMPASS-RELEASE-CHECKPOINT-2026-09-08.md).

Archived full handoff: [archive/NEW-CHAT-HANDOFF-2026-09-07-full.md](./archive/NEW-CHAT-HANDOFF-2026-09-07-full.md).
