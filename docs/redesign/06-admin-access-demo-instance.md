# Admin-Access Model & Demo-Instance Strategy

Rebuilt 2026-07-12.

## Admin-access model

### Current-state gap (confirmed live, see `00-system-findings.md`)
There is no RLS-scoped admin role today. Privileged access to family-record tables (`documents`, `people`, `tasks`, `wishes`, `messages`, etc.) runs entirely through policies scoped to `authenticated` + owner/participant checks, or through the Supabase **service role** for org-level tables (`funeral_home_partners`, `vendors`, `provider_handoffs`, etc.). Support today would need direct service-role/DB access to see a user's Passage — no scoped, audited UI path exists.

### Proposed model
1. **Add a real admin role**, most cleanly as a new value on the existing `estate_access.role` enum (currently `owner, participant, external_partner, activator, read_only, operator`) — e.g. `support_view` — granted per-Passage via a row in `estate_access`, not a global flag. This keeps the grant auditable and revocable per-record rather than an all-or-nothing switch. *(This is a schema change — flagged explicitly to engineering in the sprint plan below; the redesign should not silently assume it exists.)*
2. **"View/impersonate as [user]" flow:**
   - Admin searches for a user/Passage in the Admin Portal (by name, email, org).
   - Admin clicks "View as" → system inserts a time-boxed `estate_access` row for the admin's own auth ID with `role=support_view`, logs the grant to `estate_events`/an admin-audit table (`crm_sync_events` pattern reused, or a new `admin_access_log`).
   - Admin sees the exact record UI a `read_only` participant would see, with a persistent top banner: "Viewing as [User] — read-only, logged, expires in 30 min."
   - Grant auto-expires; no standing admin access to any family record.
3. **Hard wall:** System Admin surfaces (roadmap, pilot health, QA, automation readiness, abuse controls, refresh controls) stay entirely separate from "view as" — the Admin Portal is two zones (Platform Ops vs. Case Support), never blended into one nav.
4. **What admin can never do via "view as":** send messages, approve documents, change status, or touch payment flows while impersonating — the view is strictly read-only, matching AGENTS.md's prohibition on admins making family-facing decisions.

### Admin Portal wireframe notes
- **Nav:** Case Support (search, view-as, recent grants) | Platform Ops (roadmap link, pilot health, funeral-home QA, automation readiness, abuse/refresh controls) | Org Management (funeral homes, vendors, org onboarding).
- **Empty/loaded states:** Case Support search starts empty (no "browse all families" list ever rendered — search-only, to discourage casual browsing).
- **Audit visibility:** every past "view as" grant listed with admin name, viewed user, timestamp, duration — visible to the admin themself and exportable for compliance review.

## Demo-instance strategy

### Requirement
No demo/weird pages ever visible in production; funeral-home demo path must be production-ready first (per AGENTS.md directive).

### Recommended approach
1. **Seeded demo organization/tenant** — a single `organizations` row (`type=funeral_home`, e.g. "Rivera Funeral Home Demo") with realistic fake `people`/`workflows`/`tasks`/`documents` data matching the hero-mockup scenario in `hero-screens-mockup.html`. Gated by an env/feature flag (`DEMO_ORG_ENABLED`) so it can be seeded in preview/demo environments and explicitly excluded from production seeding scripts.
2. **Separate demo surface, not demo pages mixed into the real app:** either a Vercel preview deployment pinned to a `demo` branch, or a `demo.thepassageapp.io` subdomain pointing at the same app with `DEMO_MODE=true`, which (a) forces login into the seeded demo org only, (b) disables real email/SMS/payment sends (mocked), (c) shows a small persistent "Demo — no real data" indicator in the operator chrome only (never on family-styled screens, to keep sales demos emotionally credible).
3. **One-command reseed:** a script (`npm run demo:reseed` or Supabase Edge Function) that truncates and re-inserts the demo org's rows only (scoped by `organization_id`), safe to run repeatedly without touching real tenants. Should reset: `organizations`, `organization_members`, `people`, `estate_access`, `tasks`, `workflows`, `documents` (fake/placeholder files), `messages` — all scoped to the demo org ID.
4. **Production guarantee:** the Vercel build gate (`scripts/vercel-ignore-build.js`, already in the repo per AGENTS.md) should extend to refuse a production deploy if `DEMO_MODE` or demo-seed scripts are reachable from public routes — a lint/CI check, not just discipline.

### Why this shapes the sprint plan
Because the funeral-home demo path (Portal, Dashboard operator variant, a Passage record + Tasks, Invite, Documents) must be real and polished enough to *also* be the demo — the sprint plan below builds that slice first and seeds the demo org against it, rather than building a throwaway demo separately.
