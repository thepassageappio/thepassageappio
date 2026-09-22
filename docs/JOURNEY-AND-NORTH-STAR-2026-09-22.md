# Passage journey and north star — September 22, 2026

The owner resumed this plan. PRs #145 and #146 are merged and live; recovery and NY provenance safeguards have shipped. The [current release and journey checkpoint](RELEASE-AND-JOURNEY-CHECKPOINT-2026-09-22.md) supersedes the historical status table and resume instructions below. Full hosted acceptance remains incomplete, so buyer-demo and real-data pilot release remain on hold. The north star and staged journey below remain unchanged.

## North star

Make it simple for a person helping someone else and a financial institution to reach, understand, and keep track of the institution's authority decision: who may do what, for whom, at which institution, under which limits, and until when.

Passage coordinates evidence, each person's steps, the institution's decision, and a lasting receipt. Identity, authority evidence, and institution acceptance remain separate. The institution retains its legal, identity, fraud, and access decisions. A decision at one bank does not grant acceptance at another.

The immediate product promise is a clear, dependable New York financial power-of-attorney evaluation. It currently centers on two non-transactional actions: talking with the bank and obtaining statements. Broader situations, including a principal unable to participate, need an explicit supported path before being offered.

## Where we are

We have a working core and a newly stabilized release. We are between proving the core journey and proving a dependable, uncoached demo. We have not completed buyer-demo readiness or a real-data pilot.

| Area | Evidence and current limit |
| --- | --- |
| Core authority journey | Saved synthetic principal/representative/institution decisions, scoped limits, receipts, role boundaries, and historical replay have passed. A fresh complete hosted acceptance run remains open. |
| Live release and security | PR #144 is live on Production and Demo at `7a3a09d`. Submission token/storage boundaries were repaired and verified; CI and release smoke passed. Demo was restored. Required branch-check enforcement remains an open governance item. |
| Multi-institution delivery | Core intake is deployed. Durable file/invitation recovery is built in draft PR #145, with 228 local tests, five SQL suites, browser failure/retry checks, and successful CI/previews on its implementation commit. Recovery is not deployed or accepted against hosted providers. |
| Rules and history | New York groundwork exists. Historical provenance and new-draft pinning/rebase remain material gaps. General institution policy publication and immutable snapshots are unfinished. |
| Experience | Plain-language guidance, saved decisions, workspace orientation, and some mobile/keyboard evidence exist. Independent first-use, full accessibility, and complete failure-path rehearsal remain open. |
| Commercial operations | Evaluation, billing, and CRM groundwork and some test-provider paths exist. Full provider comparison, the complete commercial journey, and seven actual clean reconciliation days remain unproved. |

The recent audit closed real security and release defects. It did not invalidate the working core, and passing a deployment did not close the remaining product and operating gaps. No readiness percentage is assigned: the remaining gaps are prerequisites, not interchangeable points.

## Journey ahead

1. **Dependable synthetic demo — current destination.** Finish delivery recovery; preserve governing history; prove a complete uncoached journey and realistic failure recovery on the exact hosted release. The requester, participants, and institution must see consistent state and matching receipts.
2. **Named, scoped pilot.** Agree on the institution, supported workflow, success criteria, operating ownership, and data boundaries. Real data requires a separate owner decision. A working synthetic demo alone does not establish permission or readiness for it.
3. **Repeatable institution product.** Complete governed policy configuration, onboarding, operational reconciliation, support/recovery, and buyer-required controls. Establish buyer value through actual use rather than feature count.
4. **Broader authority-status service — long-term hypothesis.** Let authorized people and systems retrieve an institution's current decision and changes reliably. Participant portfolios and deeper integrations remain demand-led expansion, with separate institution decisions preserved.

## Resume order

1. Coordinate PR #145's migration/application handover; verify file hashes, provider results, retries, scheduler configuration, and all affected personas in the hosted environment. Do not run the queue alongside the old inline sender.
2. Repair NY historical provenance; pin new drafts and require explicit rebase when governing configuration changes. Preserve old decisions and receipts.
3. Complete the exact-release requester/principal/representative/institution walkthrough, cancellation and recovery paths, accessibility, and timed rehearsal. Close actionable high-severity findings.
4. Complete operating/provider evidence and the truthful claim ledger; make an explicit demo-release decision. Keep broader policy configuration and named-pilot requirements visible rather than silently calling them done.

Current owner decisions remain: synthetic data until M1 demo-ready; Demo always synthetic; Free/no-PITR is an accepted risk, with no paid upgrade workstream; counsel engagement is outside active M1. Map requirements for all 50 states, with implementation order NY → PA → NJ → CT → MA. Mapping a state does not enable it.

## Measure value

The proposed primary outcome is the share of supported requests that reach a correctly scoped institution decision with matching participant receipts, without operator rescue. Track time to that outcome, unrecovered delivery failures, and support interventions alongside it. This is a proposed measurement framework, not an instrumented metric or a claim about current performance.

The next milestone is earned when a first-time user can complete their role, another person sees the right next step, a failure can be recovered, and every party reaches the same saved decision. That is the basis for a credible demonstration and subsequent pilot discussion.

Sources: [active delivery plan](OUTREACH-READY-DELIVERY-PLAN-2026-09-10.md), [V2 roadmap](V2-DELIVERY-ROADMAP.md), [owner decisions](STEVE-DECISIONS-COMPLIANCE-2026-09-15.md), [release evidence](RELEASE-HARDENING-2026-09-22.md), [recovery contract](SUBMISSION-DELIVERY-RECOVERY-2026-09-22.md).
