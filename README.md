# Passage Authority controlled MVP

Passage Authority turns one narrowly bounded request to act for another person into a policy-driven transaction with named parties, explicit permissions, sourced evidence results, institutional review, an append-only receipt, and observable webhook delivery.

This repository is a greenfield local sandbox. It does not modify or deploy the legacy Passage product.

## Controlled boundary

All people, institutions, policies, identity checks, evidence providers, endpoint responses, and webhook signatures are synthetic. The MVP demonstrates product and transaction behavior; it does not establish legal validity, institutional acceptance, production security, or regulatory compliance.

## Run locally

Requires Node.js 24.15 or newer and pnpm.

```bash
pnpm install
pnpm dev --port 3200
```

Open `http://127.0.0.1:3200`.

The sandbox starts with five deterministic records spanning principal action, institutional review, information request, representative decline, limited acceptance, and a retryable webhook. **Reset sandbox** restores that baseline.

## Product surfaces

- `/workspace/ar_sandbox_carter`: principal, representative, and institution-reviewer transaction views.
- `/institution`: multi-record policy and ownership queue.
- `/developer`: deterministic scenario creation, API quickstart, signed payload log, and failed-delivery replay.
- `/api/v1/authority-records`: versioned record collection and scenario creation.
- `/api/v1/authority-records/:id`: role-filtered record projection and atomic commands.
- `/api/v1/authority-records/:id/receipt`: policy, source, consent, disclosure, decision, revocation, and role-filtered events.
- `/api/v1/webhook-deliveries`: delivery observability and replay state.

The local API key is `passage_sandbox_test_key`. These SQLite-backed pages, API routes, role switching, reset actions, and webhook replays are available only in development and test mode. Production builds return a generic not-found response before opening the repository or accepting a sandbox mutation.

## Verification gates

```bash
# 16 domain, persistence, privacy-boundary, rollback, webhook, and idempotency tests;
# then TypeScript, ESLint, and an optimized Next.js build.
pnpm verify

# With the dev server running on port 3200, independently create and replay a
# complete API transaction through grant → evidence → RFI → decision → revoke.
pnpm verify:live-story
```

`verify:live-story` creates only a synthetic record. Use **Reset sandbox** afterward to return to the five-record demo baseline.

Gate 1 account and organization verification uses the isolated local Supabase stack and the sanitized replay command:

```bash
pnpm verify:gate1:database
```

The required local public and server verification values are read from the local Supabase status output and are never committed. See `docs/GATE-1-EVIDENCE.md` for the passed assertions, defects corrected during replay, and the hosted release boundaries that remain open.

## Build contract

See `docs/BUILD-CONTRACT.md` for the release evidence chain and `docs/UI-SYSTEM.md` for the interface contract. No flow counts as working unless browser action, authenticated command, durable state, append-only event, other-persona visibility, receipt, webhook outcome, and independent replay agree.

## UAT product plan

Production feature development is gated by the August 27 product plan:

- `docs/PRODUCT-SOURCE-OF-TRUTH.md` defines the current wedge, pricing, personas, account model, use cases, screen architecture, wireframes, provider boundaries, enterprise target, and roadmap.
- `docs/IMPLEMENTATION-TRACEABILITY.md` maps screen controls to server commands, durable results, receiving-person effects, failures, and release evidence.
- `docs/CURRENT-STATE-GAP-MAP.md` identifies what the controlled MVP already proves and what remains for UAT.
- `docs/DOCUMENT-REGISTER.md` identifies authoritative and historical documents and resolves earlier pricing and roadmap conflicts.
- `docs/MVP-EXECUTION-PLAN.md` is the active critical path from the hosted Gate 1 foundation to a complete hosted MVP.

The fictional controlled MVP remains the regression and demonstration harness. It is not the production identity, tenancy, billing, email, or document-storage implementation.
