# Solo-founder governance bootstrap handoff — 2026-07-18

## Owner decision and scope

The owner explicitly approved replacing the unavailable two-human rule with an honest solo-founder model. This branch is the one-time PR #25 governance bootstrap only. It contains no product, runtime, database, pricing, readiness-score, or Production configuration change.

After bootstrap:

- Agents and schedules author only through the dedicated Passage GitHub App/Bot identity, never through the founder's GitHub User credentials.
- A distinct Independent Agent Reviewer challenges the exact head. This is automated technical review, not founder approval.
- The founder reviews Bot-authored pull requests through native GitHub review controls before merge.
- Production separately requires founder authorization through the protected Production environment or release gate for the exact commit.
- Agents and schedules never push directly to main; the Bot and schedules receive no bypass.

## Reviewer failure and correction

Dedicated reviewer `/root/independent_pr25_reviewer` failed prior head `657f21e9c175adac983261eadd3a4a72ecd1c350`. The custom checker could not distinguish a human from a machine-operated GitHub `User`, did not exclude material implementers, read only the first 100 reviews, and could not prove a workflow/ruleset that was not yet on base main.

The corrected bootstrap removes the Reviews API and deletes `scripts/check-independent-review.js`. The trusted `pull_request_target` workflow now validates base-defined release structure only. It has no push/review trigger, PR-head checkout, candidate execution, dependency installation, persisted credentials, token/secret, or write permission. Candidate validation is read-only and credentialless. Both trusted and candidate checks require the Independent Agent Review's `Reviewed Head` to equal the current PR head; a wrong-head regression fixture must fail.

## Review and authorization states

These states are deliberately separate:

- Independent Agent Review supplies technical challenge.
- Founder Review authorizes merge of Bot-authored work.
- Founder Production Authorization permits Production through the protected environment.
- None substitutes for another.

The founder recorded the one-time PR #25 bootstrap attestation on 2026-07-18 at 21:13:17 -07:00 after exact-head source QA, Independent Agent Review, trusted-guard, candidate-validation, and deploy-suppression PASS. PR #25 remains draft and unmerged until the attested ready-state check completes. The exception applies only when the GitHub event number is exactly PR #25, the body records the authorization, exact-head agent QA and deterministic checks pass, Founder Review remains honestly NOT APPROVED, Deploy and Production remain NOT APPROVED, and the governance boundary retains `[skip deploy]`. It expires when PR #25 merges or closes and may never be reused.

## External gates still unverified

Source files do not prove live enforcement. Direct/force-push prevention, required checks, Bot identity and permissions, founder native review, stale-approval dismissal, conversation resolution, bypass denial, and the protected Production environment remain unverified until configured and tested after bootstrap. A harmless Bot-authored validation PR must prove the completed model before product or Production work relies on it.

No Vercel or Supabase deployment is authorized. Passage Zero PR #24 remains draft. Cycle 8 remains FAIL/PARTIAL and untouched.
