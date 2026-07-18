# Passage Zero release train

This is the App Router/Supabase release loop for Passage Zero. `AGENTS.md` controls permissions; `docs/product/operational-readiness-roadmap.md` controls priority; `docs/product/frontend-backend-contracts.json` controls frontend/backend parity; `docs/agent-operating-context.md` records the living handoff.

## Required loop

1. Product Manager writes the bounded Sprint Brief and classifies discovered work.
2. UX Review sets the responsive, accessible, truthful experience bar.
3. Engineering implements the reachable UI and its server/data/RLS/event/recovery contract together.
4. Independent QA verifies source, database authority, negative paths, browser behavior, and evidence.
5. Deploy verifies project, branch, environment scope, release marker, deployment, logs, and post-deploy behavior.
6. PM scopes the next highest-leverage slice immediately after Deploy PASS/PARTIAL.

No role may promote its own work to QA PASS. Role instance, received handoff, decision, evidence, failures, and next target belong in the operating context.

## Per-slice contract

Every user-visible action or state names:

- route and component;
- server-authorized command or query;
- durable rows and expected cardinality;
- RLS/authority predicate;
- append-only event or proof for mutations;
- failure, retry, replay, and recovery states;
- persona projection and privacy boundary;
- TypeScript/build, database, browser, and parity evidence.

`implemented` means the complete reachable contract exists. `backend_only` means the backend is real but no truthful reachable UI exists. `queued` means the complete contract is not built. Dates and mockups never promote status.

## Deployment discipline

Passage Zero builds only from the canonical Vercel project and exact approved branch. Preview environment variables must be branch-scoped; isolated Supabase migrations must use migration tooling; Production values and project `qsveqfchwylsbncsfgxe` are forbidden unless a later owner-approved production release explicitly names them.

Use `[skip deploy]` while integrating source and evidence. Use `[deploy] [qa-approved]` only after independent QA PASS. A separately documented verification-preview exception may be used once for hosted evidence when `AGENTS.md` and the operating context authorize it; remove the exception afterward.

## QA minimum

- independent browser storage contexts for cross-persona flows;
- wrong-user, wrong-role, wrong-organization, wrong-location, unassigned, replay, stale-session, and revoked-access denial as applicable;
- exact durable row/event cardinality and no partial writes;
- reload/reconnect truth;
- TypeScript, optimized build, parity, deploy-gate, Supabase advisors, and SQL/RLS tests;
- 1440, 390, and 360 with no overflow, hydration/console errors, inaccessible focus, or undersized enabled targets;
- timestamped screenshots and redacted database/audit evidence.
