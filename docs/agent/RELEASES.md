# Release playbook

> September 11 UTC: PR [108](https://github.com/thepassageappio/thepassageappio/pull/108) is merged and live at `c64299e5ed3fa49b43e7ca62278b9c5c59088264` on both `thepassageapp.io` and `demo.thepassageapp.io`. Hosted cancellation checks passed in Demo and UAT. Production verification passed 44 public routes, eight recovery states and 30 authenticated institution receipt views. Preview configuration and UAT preview access are repaired; deployment protection remains enabled. Internal reconciliation is **3/7**. [Current evidence](../RELEASE-AND-DEMO-STATUS-2026-09-11.md). Older release/access/P0 descriptions below are historical; the fresh-demo and remaining P1/P2 gates remain open.

Load for Git, migrations, Vercel, deployment, or release evidence.

## Production gate

`clean main commit -> required checks -> migration match -> Vercel Git deploy -> deployed SHA equals origin/main -> production smoke/replay`

- Production domain: `thepassageapp.io`.
- Production Vercel project: `passage-authority-uat`, now Git-connected with automatic production deployment from `main`.
- PR #90 fast-forwarded `main` to the former `agent/founding-pilot-billing` tip; do not describe that work as branch-only.
- PR #105 merge `f99da278a9774516ad31b6bd14e593e8b307fb73` is the last exact-SHA production release independently verified in this checkpoint. Start every continuation by fetching `origin/main`, preserve any dirty tree separately, and verify `/api/version` before reporting a later commit as live.
- PR #105 merged the new-owner MFA repair and private-table hardening as `f99da278a9774516ad31b6bd14e593e8b307fb73`. Production served that exact SHA. Owner and Administrator enrollment rendered and verified TOTP; an independent Reviewer received the correct review-only workspace; request `PA-E3DEFCE539` completed the principal/representative/institution path with matching receipt `PAR-1805F05F8FC4`. The application regression that reopened P0 is closed; final presenter sign-off still requires deterministic invitation delivery, timed/keyboard/accessibility, and remaining negative-path evidence.
- PR #106 merged as `1611c5dce4392a0674890896b7141a868935cd39`; production served that exact SHA with verified provenance. It records the post-MFA persona evidence and raises workspace table controls to 44px. Authenticated production replay at exact 390px and 360px found contained document width, scrollable role navigation, and zero visible main-content controls below 44px.
- `origin/agent/founding-pilot-billing` advanced to `15052ad` from an older base. Integrate its two final packet files selectively; merging the divergent branch wholesale would delete newer MFA/reconciliation work from `main`.
- Manual `vercel deploy` was the old production path and is now stale. Use the Git-triggered `main` deployment path.
- Block production from detached HEAD or a dirty worktree.
- Require GitHub as provider, repository `thepassageappio/thepassageappio`, and ref `main`.
- Use Vercel system `VERCEL_GIT_*` metadata and `/api/version` to verify provenance.
- Record merge SHA, Demo deployment ID, Production deployment ID, migration set, and smoke evidence separately.
- Never treat “deployed” as “merged” or Demo readiness as Production approval.
- Promote a tested artifact; do not rebuild from untracked local state.
- A branch push creates preview evidence only. It cannot be reported as shipped until the commit is merged to `main`, the `main` deployment is `Ready`, and `/api/version` reports that same SHA.
- A failed newer `main` deployment blocks the release even if Vercel continues serving an older healthy production deployment. Record both the failed candidate and the active production SHA.
- Use a pull request with required checks for every release change. Before merge, compare the PR head SHA, green check SHA, preview source SHA, and intended merge commit; after merge, compare `origin/main`, Vercel production source, and `/api/version`.
- Do not make routine schema changes through direct hosted SQL. If an emergency SQL change is unavoidable, recover the exact applied statements into `supabase/migrations/` in the same incident, verify a fresh local reset, and record hosted object-definition hashes. A migration-history row alone is insufficient evidence.

Run `pnpm verify:release-provenance` before release. The current detached dirty checkout must fail this check.

Historical deployment detail lives in [../V2-DELIVERY-ROADMAP.md](../V2-DELIVERY-ROADMAP.md) and the closeout documents; load only when reconciling a specific release.
