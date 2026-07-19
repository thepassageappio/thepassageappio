# Solo-founder Bot governance handoff — 2026-07-19

## Owner decision and scope

The owner approved replacing the unavailable two-human rule with an honest solo-founder model. The dedicated `Passage Release Bot` GitHub App now exists and is installed only on `thepassageappio/thepassageappio`.

- GitHub App slug: `passage-release-bot`
- App ID: `4336683`
- Installation ID: `147538305`
- Bot login: `passage-release-bot[bot]`
- Repository access: only `thepassageappio/thepassageappio`
- Persistent permissions: repository metadata read, contents write, and pull-request write
- Temporary bootstrap permission: workflow-file write was used only to author the governance correction and was removed after exact source review passed
- No OAuth user authorization, device flow, webhook, Actions administration, checks/status, deployment, environment, secret, organization, account, or repository-administration permission

The private key remains an owner-controlled local credential. It was not printed, committed, added to PR text, or copied into product configuration. Bot API work uses one-hour installation tokens narrowed to this repository and the requested permissions.

This change is governance-only. It contains no product, runtime, database, pricing, readiness-score, Vercel configuration, or Production change.

## PR disposition and identity proof

PR #25 is expired, remains unmerged, and grants no exception. Its close/reopen history means the former bootstrap exception can never be reused.

Draft PR #26 replaces it. PR #26 was created by `passage-release-bot[bot]` from `main@f6c50b293557f852cc12fe7be4ea59c397f4a072`. Its commits use `[skip deploy]`; Vercel deployment `dpl_3JE4cLBGGrA9qJhDjbVj6eXGAV3q` is `CANCELED`, target `null`, and produced no Preview or Production artifact.

PR #26 remains unapproved while final exact-head QA, Independent Agent Review, founder native review, and live ruleset proof remain open. Independent Agent Review is automated technical challenge and never substitutes for founder approval. Founder merge approval never substitutes for protected Production authorization.

Exact source head `6d29bfca79b67c162e4a9d9a2dadd5e7bc5b2d67` passed candidate validation run `29696048460`, legacy guard run `29696048476`, independent QA, and independent agent review. Its Vercel event `dpl_DfqgGyNJTkrzdPvLgdoSLNWHWTbW` is `CANCELED`, target `null`, with no Preview or Production artifact. After those exact-head passes, the App's workflow-write permission was removed in GitHub settings. A direct installation read verified the remaining permissions are only metadata read, contents write, and pull-request write for the selected repository.

## Reviewer failure and correction

Dedicated reviewer `/root/independent_pr25_reviewer` and independent QA rejected the former PR #25 ready-state logic because it could be reused after reopen, trusted first-match regular expressions, did not bind the reviewed base SHA, and accepted duplicate or conflicting status lines.

PR #26 corrects that design through one delimited attestation block with exactly one base ref, base SHA, head SHA, and Independent Agent Review status. Both candidate and trusted checks reject duplicate markers, duplicate/conflicting fields, reordered or extra fields, stale base/head pairs, missing event data, wrong Bot authorship, reopened PRs, and all bootstrap-exception lines. Drafts remain structurally valid only with `NOT RUN` and unassigned or exact current bindings.

The next exact-head correction also closes the review-stage deadlock and legacy workflow gap. The PR body never self-asserts founder approval; it says `NATIVE APPROVAL REQUIRED`, while GitHub's native branch rule is the separate authoritative approval gate. Drafts must keep Production and deploy authorization at `NOT APPROVED`. The checker parses every decision field, reviewer field, cycle field, required section, and required checkbox exactly once.

The trusted `pull_request_target` workflow checks out only the exact base commit, without persisted credentials, and runs the base commit's checker. It never checks out or executes candidate code, installs dependencies, exposes secrets, queries reviews, or receives write permission. Candidate validation checks out the exact head without persisted credentials and has read-only repository permission. The former `agent-context.yml` is replaced with a pull-request-only, credentialless candidate check that supplies the complete event contract. Until that replacement is live on `main`, the checker may recover the same omitted fields from GitHub's immutable local event payload; it does not guess or waive any field.

## Role handoff

- Product Manager: `/root/pm_governance_consolidation`; governance-only Bot/founder model and non-goals approved.
- UX Review: N/A; no persona or public surface changes.
- Development Engineering: `/root/engineering_governance_docs`; exact PR #26 bypass analysis completed and corrective contracts defined.
- Independent QA: `/root/qa_solo_founder_governance`; exact source head `6d29bfca79b67c162e4a9d9a2dadd5e7bc5b2d67` passed adversarial QA; the final context-only head still requires exact binding.
- Independent Agent Reviewer: `/root/independent_pr25_reviewer`; exact source head `6d29bfca79b67c162e4a9d9a2dadd5e7bc5b2d67` passed independent review; the final context-only head still requires exact binding.
- Deploy: exact source-head Vercel suppression and Bot permission reduction verified; Production authorization remains `NOT APPROVED`.

## External gates still open

Source files do not by themselves prove live enforcement. Before this governance work can be relied upon, the train must verify the final context-only head, founder native approval with stale dismissal, resolved conversations, no Bot bypass, direct/force-push denial, and separate protected Production authorization. PR #26 is the harmless Bot-authored validation PR for the author/reviewer boundary.

No Vercel or Supabase deployment is authorized. Passage Zero PR #24 remains draft. Cycle 8 remains FAIL/PARTIAL and its local application and migration files remain untouched.
