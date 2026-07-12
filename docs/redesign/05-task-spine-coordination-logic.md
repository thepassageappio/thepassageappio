# Task Spine & Coordination Logic

Rebuilt 2026-07-12. Passage coordinates like a calm, intelligent guide — not a ticketing system. This document defines how tasks are generated, how people are looped in, how handoffs surface, and how the system communicates what's waiting without creating anxiety.

## The core problem this solves
The live schema has 13 raw `tasks.status` values plus `partner_owner_role`, `outcome_status`, `approval_status`, and a parallel `workflow_actions.status` with 12 more values. That's correct for the backend (it needs that resolution to run automation) and would be a disaster shown raw to a grieving family. The task spine is a **translation layer**: one deterministic display status per viewer, computed from the real system status.

## Viewer-relative status — the display layer
Every task/action resolves to exactly one of four buckets **for the person looking at it**:

1. **Your move** — the viewer is the current owner and no one else is blocking them. Maps from `pending, draft, not_started, needs_owner` when `owner = viewer`, or `assigned/in_progress/active/waiting` when the *next* required action is the viewer's.
2. **Waiting on [named person/org]** — someone else owns the next action. Never "waiting on the system" or "in progress" with no name — always resolve to a real person or `funeral_home_partners`/vendor org name. `partner_owner_role` (e.g. `funeral_home_director`) resolves to the actual assigned director's name, not the role label, whenever one exists.
3. **Done** — `done, handled, completed`. Shown with a proof indicator (what was saved/sent, when) so it never feels like it vanished.
4. **Needs attention** — `blocked`, or any task unowned past its SLA window. This is the only bucket that gets Clay/urgent-adjacent styling, and only this bucket generates a notification outside the normal digest.

`skipped` tasks disappear from active views entirely (visible only in Audit) — a family should never be reminded of something they deliberately declined.

## Zero-ambiguity ownership — the rule
Every open item has exactly one owner and one next action, always. Enforced by:
- **At creation**: a task cannot enter an active state without an owner. If `workflow_templates`/automation can't determine one, it's created directly in "Needs attention → unowned" rather than silently defaulting to the family or the funeral home.
- **On handoff**: ownership transfer is an explicit, logged action (mirrors `task_status_events`) — never an implicit side effect of someone else viewing or commenting on a task.
- **Co-ownership is disallowed at the task level.** Shared responsibility (e.g. "either executor can approve") is modeled as one task with a candidate-owner set, and the first person to act becomes owner-of-record — the UI never shows the same open task as "your move" to two people indefinitely.

## How the right people get looped in
- Tasks generated from `workflow_templates` (by `persona_type` + `trigger_type`) come pre-scoped to a role (e.g. `executor`, `funeral_home_director`), and the system resolves that role to the actual person via `people.role` / `estate_access` at creation time — not left as a role label in the UI.
- When a task needs a person not yet on the record (e.g. an attorney), the system prompts the current owner to add them via the People section rather than silently stalling.
- Vendors are looped in narrowly: a `vendor_requests` row is the entire vendor-visible surface — vendors are never shown the task spine of the family record itself.

## Handoff surfacing
- Handoffs render as a single-line transition, not a new screen: "Rivera Funeral Home marked the burial paperwork ready — approve to continue."
- The receiving party gets exactly one channel notification (per their own notification preference) plus persistent placement in Today; no duplicate pings across email+SMS+in-app for the same handoff.
- `provider_handoffs.family_permission_status` (not_requested → requested → granted) is the pattern for any handoff that requires family consent before a third party (hospice, care facility, new vendor) gains access — this is a first-class consent screen (see `04-wireframes-annotated.md`), not a silent backend grant.

## Communicating "what's waiting" without anxiety
- **Digest over drip:** default notification cadence is one daily summary; only "Needs attention" items interrupt that cadence.
- **Counts, not lists, at rest:** the nav shows "3 waiting" as a quiet number, not a red badge with an exclamation mark. Detail only on demand.
- **Progress without pressure:** Horizon/Timeline shows what's ahead as a calm sequence, never a countdown clock ticking toward a funeral.
- **No streaks, no completion percentages on family surfaces.** Operators can see completion % (it's operationally useful); families never see a bare number representing how much of "processing a death" is done.

## Automation transparency (from AGENTS.md's task contract)
Every task-facing surface states, in order: owner → waiting party → audience/visibility → automation level (manual/semi-automated/automated) → what Passage prepared → what the human does now → proof destination → next status after action. This is a hard requirement carried over from AGENTS.md into every wireframe in `04-wireframes-annotated.md`.
