# Wireframes + Annotated Mockups (low-to-mid fidelity)

Rebuilt 2026-07-12. Each screen below is specified with: navigation state, empty state, loaded state, and role variants. High-fidelity hero renders for three of these screens live in `hero-screens-mockup.html` (Landing/Onboarding, Family Dashboard, Funeral Home Console). The funeral-home demo path is sequenced first per the brief.

## Part A — Funeral-Home Demo Path (build first)

### A1. Funeral Home Portal (case list) — rendered in hero mockup
- **Nav state:** left rail — Dashboard (active), Active cases, Unowned tasks, Families, Vendors, Staff, Reporting, Settings.
- **Empty state:** new org, zero cases — large centered prompt "Invite your first family" + "Import from [existing funeral-home software]" secondary action. No stat cards until ≥1 case exists (avoid showing "0%" everywhere).
- **Loaded state:** stat row (active cases, waiting-on-you, unowned tasks, family-update health) + case table sorted by urgency (`status` mapped from `workflows.status`/`tasks`, unowned cases surfaced in urgent-but-not-red styling).
- **Role variants:** Director sees all cases + reporting/staff/settings. Staff (`organization_members.role=staff`, once added) sees only cases assigned to them via `partner_owner_role`/task ownership — no org-wide reporting.

### A2. Dashboard — funeral-home variant (per-case view)
- Same "Today" section as family view, but operator-styled: dense task table instead of card, columns for owner, waiting-party, SLA age.
- Interaction note: clicking a task opens a right-side drawer (not a full navigation) so the director never loses case-list context — critical for someone triaging 14 cases.
- Empty state: case created but no tasks generated yet → "Choose a starting template" (maps to `workflow_templates`).

### A3. A Passage record + Tasks/task-spine (operator-styled)
- Full ten-section record (see `02-information-architecture.md`), operator temperature: tighter spacing, all sections in a persistent left sub-nav rather than family's card stack.
- Tasks tab: filterable table (owner, status bucket, due), bulk-assign action for unowned tasks — this is the one place bulk actions exist; nothing bulk on the family side, ever.
- Loaded state shows real status vocabulary translated: `pending/not_started/needs_owner` → "Not started"; `assigned/in_progress/active/waiting` → "In progress — waiting on [X]"; `done/handled/completed` → "Done"; `blocked` → "Blocked — needs a decision" (flagged, not hidden).

### A4. Invite (funeral home inviting a family, or family inviting participants)
- Two-field minimum: name + relationship/role (`people.role` picklist) + contact method. No mandatory account creation for the invitee to view a read-only share.
- Loaded state shows pending invites with `estate_participants.invite_status` (draft/sent/accepted/declined/bounced) as plain-language chips, resend action per row.
- Family-side variant: same component, warmer copy ("Let Elena know what's happening" vs. operator's "Add a contact").

### A5. Documents (funeral-home + family shared view)
- Grouped by `document_type` category clusters: Legal (will, trust, POA, advance directive), Identity (birth cert, passport, marriage/divorce), Financial (tax return, financial statement, business docs), Service (funeral contract), Other.
- Empty state per category, not one global empty state — avoids implying nothing exists anywhere.
- Upload interaction: drag-drop + "request from family" action (operator only) that creates a task, not a raw file-request email.
- Family variant hides "request from family" and any operator-only proof/audit metadata.

## Part B — Remaining screens

| Screen | Key notes |
|---|---|
| **Landing** | Rendered in hero mockup. Three entry paths (urgent / planning / funeral-home-invited) above the fold — this replaces one generic signup CTA. |
| **Login** | Single field-set, magic-link primary, password secondary. No marketing content on this screen — pure utility, calm. |
| **Create Account** | Branches immediately by `flow_type`/`persona_type`. Urgent path: minimal (name, relationship, one contact method). Planning path: persona_type picker (standard/spouse/parent/business_owner) before any form fields. |
| **Forgot Password** | Standard, but copy avoids anything that reads clinical ("We'll help you back in" not "Authentication failed"). |
| **Dashboard — family variant** | Rendered in hero mockup. One next-action card + Today panel + People panel. |
| **Dashboard — vendor variant** | Scoped list of `vendor_requests` only — no family-record nav at all, not even grayed out. Status = request lifecycle (requested→viewed→quoted→accepted→scheduled→completed) with payment tracker component (from `payment_collection_status`). |
| **Dashboard — admin variant** | See `06-admin-access-demo-instance.md`. |
| **Create a Passage** | Wizard, save-and-exit at every step, progress shown as "3 of 5 — you can stop anytime" not a bare progress bar. |
| **Timeline** | = Horizon section. Service-date-centric; past events collapse, future events expand. |
| **Contacts** | = People section, grouped by role, with visibility indicator per contact (what can they see). |
| **Estates** | = Estate section, grouped by `account_type`; operator variant adds export. |
| **Medical** | = Medical section; most sensitive — extra confirmation step before any share action, explicit "who can see this" banner always visible. |
| **Funeral Preferences** | = Wishes section, grouped by `service_type`. |
| **Messages** | Draft → approve → send pipeline always visible as a mini-stepper on every message, matching `messages.status`. |
| **Notifications** | Digest-first (daily summary) with an "urgent — notify immediately" override tier; user controls the line between the two. |
| **Settings** | Split into "My account" and "Who has access" — access/privacy controls surfaced prominently, not buried in a generic settings dump. |
| **Admin Portal** | See dedicated doc `06-admin-access-demo-instance.md`. |
| **Vendor Portal** | Detailed in Dashboard — vendor variant above; portal shell reuses operator temperature but with a visibly narrower nav (no case list, no family data). |

## Interaction notes that apply everywhere
- Every action that changes shared state shows a lightweight confirmation ("Sent to Elena" / "Saved — Rivera Funeral Home can now see this") — proof, per AGENTS.md's "what proof is saved" principle.
- Empty states never say "No data" — always name what's missing and offer the one action that fills it.
- Loading states use skeleton shapes matching the final layout, never a generic spinner on a blank page (avoids feeling broken during high-stress use).
