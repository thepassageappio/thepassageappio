# System Findings — Live Supabase Ground Truth

Rebuilt 2026-07-12 (prior session's workspace artifacts were not recoverable in this fresh session — see AGENTS.md continuity note). This file replaces the lost `00-system-findings.md`. Source: Supabase project `qsveqfchwylsbncsfgxe`, schema `public`, queried live via MCP.

## Scale of the data model
71 tables/views in `public`. This is not a simple CRUD app — it's an orchestration engine (workflows, workflow_actions, workflow_events, workflow_templates, orchestration_events) sitting under a family-record core (people, estate_access, estate_participants, documents, wishes, messages, outcomes) with a commerce layer (vendors, vendor_requests, vendor_orders, vendor_payments, vendor_transfers, subscriptions, stripe_subscriptions) and a B2B layer (organizations, organization_members, organization_locations, funeral_home_partners, funeral_home_requests, funeral_home_preferred_vendors).

## Roles — the real vocabulary (do not invent new role names)
- **estate_access.role**: `owner`, `participant`, `external_partner`, `activator`, `read_only`, `operator` — this is the canonical per-Passage permission role and should drive every "who can see this" decision in wireframes.
- **people.role**: `executor`, `inner_circle`, `witness`, `recipient`, `guardian`, `co_editor`, `vendor_contact`, `attorney`, `advisor` — the relationship/function a person plays inside one family's Passage.
- **organization_members.role**: org-level staff role (funeral home / vendor org staff); seed data only shows `owner` in use.
- **organizations.type**: `funeral_home` confirmed in live data; schema allows other org types for the multi-tenant B2B model.
- **vendor_team_members.role**: `owner`, `manager`, `staff`.
- **tasks.partner_owner_role**: `funeral_home_director` seen in live data — tasks can be explicitly owned by a funeral-home role, not just a person.

## Status vocabularies (use exactly these — never invent new status words)
- **tasks.status**: `pending, draft, assigned, in_progress, blocked, done, skipped, handled, not_started, needs_owner, completed, waiting, active` — 13 states. This confirms the task spine needs a small "viewer-relative" *display* layer on top of a large *system* status enum — the UI must never show a user 13 raw states.
- **workflows.status** (the life-cycle of a whole Passage): `urgent_intake_started, urgent_first_steps_generated, coordination_setup_started, coordination_active, planning_active, draft, active, ready, triggered, completed, archived`. Notice the vocabulary split: `urgent_*` / `coordination_*` = death-has-happened flow; `planning_*` = pre-need flow. The IA and copy must branch on this distinction at the top of the record, not bury it.
- **estate_participants.invite_status**: `draft, sent, accepted, declined, bounced`.
- **estate_access.status**: `invited, pending, accepted, active, declined, revoked, removed`.
- **vendor_requests.status**: `requested, viewed, quoted, family_accepted, payment_pending, paid, scheduled, completed, declined, cancelled, refunded, accepted, in_progress`.
- **vendor_requests.payment_collection_status**: 16 values incl. `passage_collects`, `paid_to_passage`, `vendor_paid` — Passage can sit in the payment path as a collector, not just a facilitator; this must be visible in the vendor and family UI as a trust signal ("Passage holds this payment until service is confirmed").
- **messages.status**: `draft, approved, sent, scheduled, failed, cancelled` — messages have an approval gate before sending, matching the brief's "review-before-send boundary."
- **provider_handoffs.family_permission_status**: `not_requested, requested, granted, declined, revoked` — care-provider handoffs are permission-gated by the family explicitly; this is a first-class consent screen, not a backend toggle.
- **documents.document_type**: 16 real types (`will, trust, advance_directive, power_of_attorney, life_insurance, funeral_contract, property_deed, birth_certificate, passport, marriage_certificate, divorce_decree, military_records, tax_return, financial_statement, business_docs, other`) — the Documents section IA should group by these, not a flat list.
- **workflow_templates.persona_type**: `standard, spouse, parent, terminal, business_owner, custom` — confirms distinct onboarding paths already exist at the data layer.
- **workflow_templates.trigger_type**: `death_confirmed, incapacitation, specific_date, age_reached, inactivity, manual, terminal_diagnosis`.

## RLS shape (grounds the admin-access model)
- Almost every family-record table (`documents`, `people`, `tasks`, `wishes`, `messages`, `outcomes`, `announcements`, `obituaries`) is gated `authenticated` + "owned by estate users" / "owner or participant" policies — there is no existing "admin sees everything" policy anywhere.
- `funeral_home_partners`, `funeral_home_requests`, `vendors`, `vendor_orders`, `vendor_payments`, `vendor_transfers`, `care_provider_applications`, `provider_handoffs` all have a **`service role manages / all`** policy — meaning privileged access today runs through the Supabase service role (server-side), not through a real RLS-scoped admin role. **This confirms the brief's Admin Portal + secure impersonate model has zero existing UI and must be net-new**: a real `admin`/`support` role needs to be added to RLS (most cleanly as a new `estate_access.role` value or a `profiles`/`users` flag checked in policies) so "view as" is a genuine scoped grant, not a service-role bypass wearing a UI.
- `memorial_pages` and `memorial_contributions` are the only tables with public/anon SELECT — correctly, since memorials are meant to be publicly shareable.
- `funeral_home_requests` allows `anon` INSERT — this is the public funeral-home intake form and should map directly to the "Create Account" / lead-intake wireframe.

## Implication for the redesign
1. Task spine UI must translate 13 raw task statuses + `partner_owner_role` into 2–3 viewer-relative buckets ("your move," "waiting on [name/org]," "done") — never surface raw enum values.
2. Payment-collection status vocabulary should power a trust-building payment tracker component reused across family, vendor, and funeral-home surfaces.
3. Admin Portal "view/impersonate" needs a genuine RLS-scoped role addition (flagged as a backend dependency in the sprint plan, not just a frontend view) — this is the one place the redesign touches schema, and it should be called out explicitly to engineering rather than assumed.
4. Documents IA organizes by `document_type`, Wishes by `service_type` (`funeral, celebration, graveside, private, none`), onboarding by `persona_type` (`standard, spouse, parent, terminal, business_owner`) — all real enums, not invented categories.
