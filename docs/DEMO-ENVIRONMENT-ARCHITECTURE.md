# Passage Authority demo environment architecture

**Decision date:** September 3, 2026  
**Status:** Core Demo boundary provisioned; deterministic run provisioning is implemented and awaiting Demo deployment verification
**Objective:** Maintain a client-ready demonstration instance that is isolated from production while running the same released product.

## Decision

Passage Authority should have a dedicated, long-lived demo environment at `demo.thepassageapp.io`. It should use the same repository, application artifact, migrations, and release commit as production, but it must have its own Vercel project, Supabase project, Auth users, database, Storage, provider credentials, logs, and synthetic data.

The demo must not be implemented as a reset button against the production database. A production deployment must not contain an enabled demo-reset command, synthetic role switcher, shared participant session, or test-provider credential.

## Why this is the recommended pattern

- Vercel separates Local, Preview, and Production environments and supports longer-running custom environments with independent variables and domains. A second project gives Passage an even clearer security and operating boundary while retaining the same Git source. [Vercel environments](https://vercel.com/docs/deployments/environments)
- Supabase recommends separate staging and production projects when managing long-lived environments. Its preview branches are isolated and begin without production data by default, but they are designed primarily for branch and pull-request validation. A dedicated project is the clearer fit for a persistent sales-demo service. [Supabase managing environments](https://supabase.com/docs/guides/deployment/managing-environments) and [Supabase deployment and branching](https://supabase.com/docs/guides/deployment)
- Stripe sandboxes isolate test settings, objects, events, access, and simulated payments from live mode. [Stripe sandboxes](https://docs.stripe.com/sandboxes) and [Stripe testing strategy](https://docs.stripe.com/get-started/test-developer-integration)
- HubSpot developer test accounts are designed to test integrations without affecting real CRM data and can be configured or seeded for repeatable testing. [HubSpot account types](https://developers.hubspot.com/docs/getting-started/account-types) and [configurable test accounts](https://developers.hubspot.com/docs/developer-tooling/local-development/configurable-test-accounts)
- GitHub deployment environments can isolate secrets, restrict deployment branches, serialize deployments, and require protection checks. [GitHub deployment environments](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments)

## Environment topology

| Environment | Purpose | Application | Data and providers |
| --- | --- | --- | --- |
| Local | Engineering and destructive fixture testing | Local Next.js | Local Supabase/SQLite fixtures; no external delivery |
| Preview | Pull-request review and migration validation | Ephemeral Vercel deployment | Ephemeral or dedicated preview database; synthetic fixtures only |
| Demo | Repeatable client demonstrations and persona UAT | Dedicated Vercel project at `demo.thepassageapp.io` | Dedicated Supabase, Auth, Storage, email controls, Stripe sandbox, and HubSpot test account |
| Production | Public website and eventually approved customer work | `thepassageapp.io` | Production-only Supabase and provider accounts; no demo controls or fixtures |

The current Vercel project named `passage-authority-uat` is serving the public production domain. It should remain the production application until a deliberate rename or project migration is separately verified. The new environment should use a plainly distinct project name such as `passage-authority-demo`.

## One codebase without environment drift

Demo must not have a permanent code fork or a separate feature branch. Both environments deploy immutable commits from the same repository.

Recommended release sequence:

1. A change is merged only after unit, domain, type, lint, build, and migration checks pass.
2. That exact commit is deployed to Demo with Demo-scoped variables and credentials.
3. Demo migrations run, deterministic synthetic fixtures are upgraded, and automated smoke/persona checks pass.
4. The same commit is deployed or promoted to Production with Production-scoped variables and credentials.
5. A release check compares Git SHA, application version, and migration head across Demo and Production. A mismatch creates a visible drift failure.

This makes Demo the release proving ground while ensuring that a production release also updates Demo. Environment-specific behavior comes only from validated server configuration, never from divergent application source.

## Isolation requirements

### Application and access

- `PASSAGE_ENVIRONMENT` is an explicit validated value: `local`, `preview`, `demo`, or `production`. `NODE_ENV` is not sufficient because hosted preview and demo builds also execute optimized production code.
- The Demo environment is authenticated and no-index. Only named Passage presenters and invited evaluators may enter.
- Demo reset/provision commands exist only when `PASSAGE_ENVIRONMENT=demo` and must also verify an authenticated presenter allowlist server-side.
- Production returns a generic not-found response for every demo-only command and route before database or provider access.

### Data

- Production data is never copied into Demo.
- Every demo organization, request, document, message, provider event, and receipt carries a server-controlled synthetic/demo classification.
- Demo uses deterministic, visibly fictional names, account descriptions, files, and outcomes.
- Database and Storage identifiers, service keys, JWT secrets, encryption material, and signing secrets are unique per environment.
- Demo logs and analytics must be separately filterable and must never contribute to customer usage, revenue, conversion, or retention reporting.

### External systems

- Demo email uses a distinct provider credential or subdomain and a server-side recipient allowlist. An unapproved recipient is rejected before an outbox record can be delivered.
- Demo Stripe activity uses a dedicated Stripe sandbox. No live-mode key may be present in Demo.
- Demo HubSpot activity uses a developer test account. It must not create or modify production Companies, Contacts, Deals, Tickets, lists, or workflows.
- Webhooks use environment-specific destinations and signing secrets. Every inbound event is rejected if its provider account or environment does not match the local configuration.

## Repeatable demonstration model

The reset unit is a `demo_run`, not the entire environment and not a production tenant.

1. The presenter chooses **Prepare a fresh demo** from an already isolated Demo organization.
2. One authenticated server command creates a new organization-scoped synthetic `demo_run` and draft with the approved workflow, fictional participants, controlled recipient inboxes, account boundary, and fixture version. Activation creates unused role-bound access records through the canonical request command.
3. State and immutable request/run events commit together with an idempotency key and expected entitlement version.
4. The new run receives a short human-readable label and opens as a fresh draft without changing membership, entitlement history, or another organization.
5. Older runs remain intact for diagnosis. A later retention command may make expired runs read-only and remove only expired Demo-classified data under the approved retention policy.

Creating a new namespaced run is safer than truncating a shared demo database: two presenters cannot reset each other's meeting, prior evidence remains available for diagnosis, and a failed seed does not destroy the last known-good demo.

## Demo success criteria

- `demo.thepassageapp.io` is backed by a different Vercel and Supabase project than Production.
- Environment identifiers and provider-account identifiers are visible to operators and verifiably different.
- Demo and Production report the same Git SHA and migration head after a production release.
- A presenter creates a fresh run in 60 seconds or less without SQL, dashboard access, or developer assistance.
- Two simultaneous presenters can create and complete separate runs without shared state.
- The complete four-persona story finishes in seven minutes or less and produces matching receipts.
- Reused link, wrong role, stale version, rejection, withdrawal, expiration, revocation, recovery, and direct-file denial tests pass.
- Demo cannot send to an unapproved recipient, charge money, or write to production HubSpot.
- Production returns 404 for the reset command and contains no Demo service credentials.
- Reset, seed, delivery, provider, and cleanup actions are observable and leave immutable evidence.

## Implementation sequence

1. **Provision the boundary:** create `passage-authority-demo`, a separate Supabase project, `demo.thepassageapp.io`, and environment-scoped secrets.
2. **Automate parity:** add GitHub/Vercel deployment environments so the same tested commit and migration chain reach Demo first and Production second.
3. **Build fixture infrastructure:** versioned synthetic seed catalog, `demo_run` ownership, presenter allowlist, idempotent provisioning command, TTL cleanup, and outbound-recipient guard.
4. **Connect only test providers:** Demo email configuration, Stripe sandbox, and HubSpot developer test account.
5. **Prove the boundary:** cross-environment credential tests, recipient-denial tests, provider-account checks, simultaneous-run test, drift check, and the four-profile persona matrix.
6. **Operate it:** publish the seven-minute presenter runbook, reset recovery, known-good fixture version, status check, and rollback procedure.

## Rejected approaches

- **Reset the production entitlement counter:** breaks the usage evidence chain and risks customer data.
- **Delete production requests before a meeting:** violates append-only evidence and recovery requirements.
- **Maintain a permanent demo branch:** inevitably drifts from the product being sold.
- **Copy production data into Demo:** creates unnecessary privacy, confidentiality, and access risk.
- **Share production provider credentials:** permits demo activity to create real messages, charges, CRM records, or misleading metrics.
- **Use one global demo tenant for every presenter:** creates meeting collisions and makes deterministic reset unsafe.

## September 3 implementation status

- The dedicated Vercel project `passage-authority-demo` deploys the same GitHub `main` release as Production.
- The dedicated Supabase project `passage-demo` was restored empty, verified to contain no legacy users or objects, and received all 27 versioned Authority migrations.
- Demo uses its own database URL, publishable key, server secret, Auth users, Storage boundary, and runtime environment variables. No Production database or provider credential is bound to Demo.
- The stable fallback `https://passage-authority-demo.vercel.app` is public for evaluation while the branded domain waits on one Cloudflare DNS record. Authenticated routes remain protected by Supabase and private routes remain no-store/no-index.
- `demo.thepassageapp.io` is assigned in Vercel and its exact Auth callbacks are already allowlisted. The remaining DNS action is `A demo.thepassageapp.io 76.76.21.21` in Cloudflare, followed by switching the two public URL variables and Auth Site URL back to the branded domain.
- The isolated database passed organization isolation, idempotency, stale-version, role, revocation, append-only audit, representative submission, information-request/response, decision-receipt, and withdrawal replays.
- The obsolete Vercel project `thepassageappio` was removed after confirming it served no active alias and was not the current Production project. The current `passage-authority-uat` project remains the Production host.
- Demo email delivery now fails closed unless each exact recipient is present in the server-side production-environment allowlist. Four controlled Passage addresses are configured; wildcard and domain-wide matches are not supported.
- Demo now uses a dedicated Resend sending-only key restricted to `thepassageapp.io`, plus a separate signed webhook endpoint for delivery, delay, failure, and bounce receipts. The Demo Vercel environment stores both secrets independently from Production/UAT.
- The release candidate now includes namespaced `demo_run` state, an owner/admin-only service command, exact presenter and recipient allowlists, optimistic version checks, idempotent replay, and append-only run/audit evidence. Its local database replay passes without deleting prior evidence, sending messages, consuming an activation, changing membership, or crossing organization boundaries. Still required: configure the presenter allowlist and migration in Demo, verify the control in authenticated browsers at desktop/390px/360px, add a separately authenticated reviewer, complete the remaining negative-path matrix, and rehearse the seven-minute story.
