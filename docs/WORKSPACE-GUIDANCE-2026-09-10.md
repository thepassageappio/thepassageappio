# Workspace guidance verification

September 10, 2026 UTC. Implemented on PR 108; not merged or live.

## Behavior

The workspace now promotes open actionable work ahead of old receipts, names the next participant or institution actor, and uses role-appropriate actions. Reviewers are directed to review; staff continue drafts; auditors view records. Request counts are labeled requested actions, never treated as accepted scope. The queue occupies the available width, status labels wrap, and phone cards keep secondary information beside the corresponding label. Presenter setup is in a secondary disclosure under its existing environment/role/email guard.

## Evidence

- 169 domain tests pass, including five new regressions covering open-versus-completed priority, reviewer/staff divergence, read-only guidance, closed requests and representative responsibility.
- TypeScript, ESLint and production build pass. No database migration or permission change is introduced by this slice.
- `scripts/verify-workspace-guidance.mjs` uses actual local password and TOTP authentication, SSR cookies and local database records. Owner, staff, reviewer and auditor each pass empty and populated workspace checks, requested-scope assertions, action focus, a 44px primary-action check and no document overflow at 1280, 390 and 360px. Zero browser page errors. All temporary records, organization and four users are removed.
- Desktop and phone screenshots were visually inspected. A cramped desktop badge and mobile secondary-label alignment were corrected and the browser suite rerun.
- Fixtures are synthetic UI-state data, not proof that these records completed the underlying lifecycle. The verifier neither sends invitations nor touches hosted services. Existing lifecycle evidence remains separate.

## Remaining work

UX1's core workspace changes are implemented and locally verified. Full keyboard activation, zoom, screen-reader evaluation, presenter-disclosure interaction and independent first-time journey testing remain part of UX2/REL1. This result does not close P1/P2, legal review, recovery/restore, policy configuration or outreach release. Record the merged and deployed SHA separately when released.

Run the verifier against the local Supabase stack on port 55321 and the application on port 3100, supplying local keys through `LOCAL_SUPABASE_PUBLISHABLE_KEY` and `LOCAL_SUPABASE_SECRET_KEY`. Use `PLAYWRIGHT_MODULE` if Playwright is supplied outside this repository. Never substitute hosted endpoints.
