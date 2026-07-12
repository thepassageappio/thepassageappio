# Information Architecture — Object-Shaped Passage

Rebuilt 2026-07-12. One Passage record, navigated identically by every role; what differs is which sections are visible/editable and which console wraps around it (Family, Funeral Home, Vendor, Admin).

## The record — ten sections, mapped to real tables

| Section | Primary tables | Notes |
|---|---|---|
| **Today** | `tasks`, `workflow_actions`, `orchestration_events` | The task-spine view. Viewer-relative status only — see 05-task-spine doc. |
| **Horizon** | `workflows`, `workflow_events`, `scheduled_deliveries` | Timeline of what's ahead: service dates (`workflow_events.event_type`: visitation/funeral/burial/reception/memorial), scheduled letters/videos. |
| **Tasks** | `tasks`, `task_status_events`, `outcomes` | Full task list, filterable, with audit trail via `task_status_events`. |
| **People** | `people`, `estate_participants`, `estate_access`, `spouse_links` | Grouped by `people.role` (executor, inner_circle, witness, recipient, guardian, co_editor, vendor_contact, attorney, advisor). |
| **Documents** | `documents`, `file_snapshots` | Grouped by `document_type` (16 real types), not a flat file list. |
| **Estate** | `accounts`, `outcomes` | Financial/asset accounts by `account_type`. |
| **Medical** | `activation_requests`, `activation_confirmations`, `activation_witnesses`, `urgent_sessions` | Advance-directive-adjacent; ties into `workflow_templates.trigger_type` (incapacitation, terminal_diagnosis). |
| **Wishes** | `wishes` | Grouped by `service_type` (funeral, celebration, graveside, private, none). |
| **Messages** | `messages`, `announcements`, `notification_log` | Review-before-send gate (`messages.status`: draft → approved → sent). |
| **Audit** | `estate_events`, `webhook_events`, `crm_sync_events` | "What proof is saved" — visible to owner/operator, not decorative. |

## Consoles — purpose-built wrappers, not tabs

- **Family console** — mobile-first, warm temperature. Enters via `estate_access.role` in {owner, participant, activator, read_only}. Sees Today/Horizon prioritized above everything else; Estate/Medical only if their role grants it.
- **Funeral Home Portal** — operator temperature. `organizations.type = funeral_home`, staff via `organization_members.role`. Case list = every Passage where `funeral_home_partners` links to their org; per-case view is the same ten-section record, operator-styled.
- **Vendor Portal** — operator temperature, deliberately narrow. Vendors see only `vendor_requests` scoped to them — never the full family record. No People/Documents/Estate/Medical access; this is enforced by the existing RLS (`vendor contacts view vendor orders/transfers`, `estate users view vendor requests`) and must stay that way in the UI.
- **Admin Portal** — new, hard-walled. See `06-admin-access-demo-instance.md`.

## Route-to-section map (for engineering handoff)

Existing route families to retarget at the rebuilt IA (confirm exact paths in repo during implementation; several are implied by the schema and AGENTS.md, e.g. `pages/system/admin/*`):
- `/passage/[id]` (or equivalent) → the ten-section record, family-styled
- `/portal/[orgId]/cases` → Funeral Home case list
- `/portal/[orgId]/cases/[id]` → the same record, operator-styled
- `/vendor/[vendorId]/requests` → Vendor Portal, request-scoped
- `/system/admin/*` → Admin Portal (existing roadmap page confirmed live; extend, don't duplicate)

## What changes vs. current state
Current state is "several apps stitched together" (per brief) — per-persona monolith pages (`estate.js`, large `App.js`). Threshold IA replaces persona-monolith pages with **one record component tree**, parameterized by viewer role and console skin. This is the single biggest engineering lever in the sprint plan: build the record once, wrap it four ways.
