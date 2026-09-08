# Release playbook

Load for Git, migrations, Vercel, deployment, or release evidence.

## Production gate

`clean main commit -> required checks -> migration match -> Vercel Git deploy -> deployed SHA equals origin/main -> production smoke/replay`

- Production domain: `thepassageapp.io`.
- Production Vercel project: `passage-authority-uat`, now Git-connected with automatic production deployment from `main`.
- PR #90 fast-forwarded `main` to the former `agent/founding-pilot-billing` tip; do not describe that work as branch-only.
- Refreshed `origin/main` is `76e52dc`. The clean integration branch `agent/codex-p2-integration-20260907` contains required build fixes, MFA database enforcement, progressive context, and legal/vendor-risk packets; it is not yet merged or deployed.
- `origin/agent/founding-pilot-billing` advanced to `15052ad` from an older base. Integrate its two final packet files selectively; merging the divergent branch wholesale would delete newer MFA/reconciliation work from `main`.
- Manual `vercel deploy` was the old production path and is now stale. Use the Git-triggered `main` deployment path.
- Block production from detached HEAD or a dirty worktree.
- Require GitHub as provider, repository `thepassageappio/thepassageappio`, and ref `main`.
- Use Vercel system `VERCEL_GIT_*` metadata and `/api/version` to verify provenance.
- Record merge SHA, Demo deployment ID, Production deployment ID, migration set, and smoke evidence separately.
- Never treat “deployed” as “merged” or Demo readiness as Production approval.
- Promote a tested artifact; do not rebuild from untracked local state.

Run `pnpm verify:release-provenance` before release. The current detached dirty checkout must fail this check.

Historical deployment detail lives in [../V2-DELIVERY-ROADMAP.md](../V2-DELIVERY-ROADMAP.md) and the closeout documents; load only when reconciling a specific release.
