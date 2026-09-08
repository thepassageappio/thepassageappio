# Passage Authority fresh-chat handoff

**Codeword:** `AUTHORITY COMPASS 771204`

## Resume sequence

1. Read `AGENTS.md`.
2. Read [agent/CURRENT.md](./agent/CURRENT.md).
3. Inspect Git status and preserve all uncommitted work.
4. Load only the playbook for the active task.

## Latest restart checkpoint

Production is on GitHub `main` SHA `cabd731eca69fdf3db4769a13076cfce903b186c`, verified by `https://thepassageapp.io/api/version`. PR #92 delivered auditable provider cleanup, source-controlled notification history, reconciliation repair, progressive release controls, and three-layer privileged MFA. PR #93 fixed the mobile workspace-navigation overlap found during authenticated release QA; PR #94 recorded the release evidence and checkpoint.

Hosted owner TOTP enrollment, AAL1 database denial, AAL2 database success, fresh-session challenge, production desktop, and production 390px Edge verification pass. The live mobile document has no page-level overflow and all then-current workspace links occupy distinct positions in a horizontal scroll row. Branch `agent/pa-requirements-and-mfa-recovery-20260908` adds backup-factor enrollment, factor selection during sign-in, and protection against removing the only verified factor. Do not mark the P2 MFA control closed until that branch is reviewed/deployed and the two-factor recovery path plus an administrator account pass hosted replay.

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
