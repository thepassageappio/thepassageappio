# Governance bootstrap handoff — 2026-07-18

## Scope and prior handoff

The owner required the release process to prevent another direct-to-main collision, self-approval, roadmap split, or persona-facing internal-language regression. Passage Zero remains the sole feature lane. Legacy `main` remains limited to separately reviewed P0/P1 Production maintenance.

## Role instances

- Product Manager: `/root/pm_governance_consolidation`
- UX Review: N/A for this process-only bootstrap; the persona-language gate carries the previously approved plain-language acceptance bar.
- Engineering: `/root`, bounded to PR template, workflows, and governance scripts.
- QA: `/root/qa_governance_language`
- Deploy: no deployment is authorized; commit markers remain `[skip deploy]`.

## First QA result and PM re-scope

QA failed PR #25 head `61f7a32bacddef48a86c0a72c7bdd5db546952aa` because API-created files had dirty endings, the push job falsely classified legitimate merges as direct pushes, and candidate-controlled code received a persisted/read token. PM classified all three FIX NOW.

The correction removes the push event entirely because only GitHub branch rules can prevent a push. Candidate validation now has read-only contents permission, pins checkout by full SHA, persists no credentials, and receives no review token. Current-head human approval is evaluated only by base-defined inline logic in the trusted `pull_request_target` workflow; that workflow never checks out or executes PR-head code.

## Verification and remaining gate

The correction must pass diff hygiene, exact-head governance fixtures, persona scan, workflow review, and independent QA before this handoff may record PASS. PR #25 remains draft and unmerged. Separate non-author human approval and live branch-rule evidence remain mandatory. Required rules must enforce pull requests, required checks, one human approval, stale-approval dismissal, resolved conversations, no agent/scheduled bypass, and blocked force pushes/deletion.

No application code, Production data, Vercel configuration, pricing, family access, vendor fulfillment, or readiness scores changed. The next role is independent QA on the corrected head.
