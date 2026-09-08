# Release playbook

Load for Git, migrations, Vercel, deployment, or release evidence.

## Production gate

`clean main commit -> required checks -> migration match -> Vercel Git deploy -> deployed SHA equals origin/main -> production smoke/replay`

- Production domain: `thepassageapp.io`.
- Production Vercel project: `passage-authority-uat`, now Git-connected with automatic production deployment from `main`.
- PR #90 fast-forwarded `main` to the former `agent/founding-pilot-billing` tip; do not describe that work as branch-only.
- Refreshed `origin/main` is `07edaaef50dcecb46dce014c42f001462984b75c`. It includes the privileged-MFA enforcement, progressive context, legal/vendor-risk packets, provider repair, mobile-navigation fix, backup-factor selection, Pennsylvania requirements, and authority-scope catalog contract through PR #96.
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
