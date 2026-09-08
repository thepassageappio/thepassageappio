# Passage Authority agent contract

## Always true

- Passage coordinates a delegated-authority request between a principal, representative, and institution. Identity evidence, authority evidence, and institution acceptance remain separate.
- The institution decides. Passage does not create or validate a POA, replace identity/legal/fraud review, grant access, move money, or claim downstream access changed without acknowledged integration evidence.
- Never use real customer data, live payments, external messages, or unsupported legal/security claims without explicit authorization and the applicable release gate.
- Preserve unrelated and uncommitted work. Never repeat provider sends, migrations, or deployments merely to regain context.

## Definition of working

`browser action -> authenticated server command -> durable state -> append-only event -> other persona visibility -> matching receipt -> independent replay`

A rendered screen, build, HTTP 200, or sender-only confirmation is insufficient.

## Start here

Read [docs/agent/CURRENT.md](docs/agent/CURRENT.md). Then load only the playbook that matches the task:

- Product/code/database work: [docs/agent/ENGINEERING.md](docs/agent/ENGINEERING.md)
- Persona, browser, mobile, or demo QA: [docs/agent/QA.md](docs/agent/QA.md)
- Git, Vercel, migrations, or deployment: [docs/agent/RELEASES.md](docs/agent/RELEASES.md)
- Pricing, positioning, deck, outreach, CRM, or buyer-facing SOC 2 posture: [docs/agent/COMMERCIAL.md](docs/agent/COMMERCIAL.md)
- Stripe, HubSpot, Supabase, Resend, or reconciliation: [docs/agent/PROVIDERS.md](docs/agent/PROVIDERS.md)
- New York, Pennsylvania, or other state policy work: [docs/agent/JURISDICTIONS.md](docs/agent/JURISDICTIONS.md)

Open the full historical roadmap or product source only when the selected playbook links to a needed section. Do not load every document by default.
