# Passage Ironclad Operating Spine Roadmap

## Why This Exists

Round 14 QA showed that Passage is functional but still asks users and prospects to connect too many dots. The remaining work is not more surface area. It is convergence:

- One task spine across family, participant, funeral-home employee, director, and vendor views.
- One proof/audit model for every action.
- One role model that makes it obvious who can see, assign, send, complete, and report.
- One demo story that walks a prospect from family intake to saved staff time.

This roadmap is sequenced so each sprint makes the current product more trustworthy without pretending deeper schema or compliance work is already complete.

## Sprint 1: Funeral Home Operating Spine Visibility

Goal: Make the current B2B operating model visible immediately.

Must ship:

- Funeral-home dashboard has three clear panes: `Case work`, `Staff work`, and `Reports`.
- Staff view explains director/admin versus employee assigned-work behavior.
- Reports show calls avoided, tasks per estate, marketplace value, partner share, location rows, and employee rows from the existing task/audit data.
- Case work remains the main operational queue.

Acceptance:

- Director can explain who owns what in under 2 minutes.
- Employee work is no longer implied by the family participant page.
- Reporting is clearly derived from real logged tasks, communications, assignments, and vendor requests.

Status: in progress.

## Sprint 2: Shared Task Action Modal

Goal: Replace divergent task buttons with one shared action experience.

Must ship:

- Shared `TaskActionModal` used by estate, participant, funeral-home staff, and vendor-adjacent task surfaces.
- Every task action supports the same spine:
  - assign owner
  - send through Passage when a recipient exists
  - save note
  - record proof
  - mark handled
  - mark waiting
  - request help
  - attach proof placeholder or upload handoff
- No alert dead-ends. Missing recipient routes to assignment.
- Status copy must match the saved state.

Acceptance:

- A user does not need to learn a different task UI by persona.
- A task marked handled shows what happened, who recorded it, and when.
- A waiting task shows who/what it is waiting on.

## Sprint 3: Participant and Staff Onboarding Reliability

Goal: Make every invited person land with context and one clear action.

Must ship:

- Participant email/SMS includes estate context, task title, why they were invited, and a direct deep link.
- Funeral-home employee invite/welcome flow lands in staff work, not the family participant page.
- First-time participant/staff page has one primary task, status, note field, and clear save confirmation.
- Owner/coordinator sees notification proof and task status after invite/action.

Acceptance:

- Invited participant can explain their responsibility in 30 seconds.
- Invited funeral-home employee can see assigned work without seeing unrelated family/private areas.
- All notification sends and failures are logged.

## Sprint 4: Tier 1 Output Generation

Goal: Move high-value tasks from checklist to output.

Must ship at least 6-8 task outputs:

- Funeral home arrangement packet.
- Obituary draft workspace.
- Family notification message set.
- Clergy/faith community outreach message.
- Bank or financial institution packet.
- Social Security/government summary packet.
- Executor summary.
- Home/assets/pets security checklist.

Acceptance:

- Every task labeled automated or assisted produces a visible artifact, message, packet, script, or tracked request.
- Tasks that cannot produce an artifact are labeled guided manual.
- The task list never overstates automation.

## Sprint 5: Vendor and Marketplace Response Loop

Goal: Make vendor participation task-native and auditable.

Must ship:

- Vendor admin approval flow loads applications and can approve/decline/provision next steps.
- Approved vendor user lands in vendor portal with profile setup and incoming requests.
- Request status progression: sent, viewed, quoted, accepted, in progress, completed.
- Family/funeral-home task view shows vendor status in the same task/audit spine.
- Revenue-share values remain tracked, not promised, until payment flow is approved.

Acceptance:

- Vendors never appear as a generic directory.
- Family and funeral home can see status without calling around.
- Admin can explain how vendor access is provisioned.

## Sprint 6: Linear Sales Demo Studio

Goal: Make the system-admin demo a guided sales experience, not a page of exposed modules.

Must ship:

- Dummy-only demo data for employees, families, tasks, vendors, locations, reports, and messages.
- One active demo step at a time.
- Coach overlay explains:
  - what to say
  - what the director should notice
  - what pain it solves
  - what screen comes next
- Walkthrough arc:
  1. Family arrives.
  2. Create/import case.
  3. Assign staff.
  4. Move first task.
  5. Coordinate with family/cemetery/clergy/vendor.
  6. Show family command center.
  7. Show staff work and reporting.
  8. Export and close ROI.

Acceptance:

- A serious prospect can follow the story in 10-12 minutes.
- The demo never touches real estates.
- The demo makes workload reduction obvious.

## Sprint 6A: Public Content and Guide Unlock Polish

Goal: Remove awkward public-site friction that makes Passage feel less polished before a user ever reaches the command center.

Must ship:

- Guide/article pages use one clear unlock pattern: the email/name/form block should live inside or immediately beside the locked guide card, not floating disconnected above it.
- Locked guide copy should say exactly what happens after unlock and should not point users to “above” or another part of the page.
- The selected guide, email input, name input, and unlock CTA should feel like one contained action module.
- At 100% Chrome view, the guide page should fit cleanly without a large disconnected empty zone between hero, form, guide selector, and article preview.
- Success state should keep the user on the same guide, reveal the content, and clear any uncertainty about whether a drip campaign starts.

Acceptance:

- A visitor understands in 3 seconds: pick guide, enter email, unlock article.
- The unlock module does not feel like a separate lead form pasted onto the page.
- Public content pages match the calmer command-center polish.

## Sprint 7: Role and Data Hardening

Goal: Convert derived UI concepts into durable permission and reporting primitives.

Likely schema work, requiring owner approval:

- `organization_members.scope`: all cases, location cases, assigned tasks only.
- `organization_members.location_id`.
- `workflows.location_id`.
- `tasks.assigned_to_user_id`.
- `tasks.assignment_actor_role`.
- `task_attachments` or storage-backed proof uploads.
- Estate value fields for ROI:
  - `estimated_case_value`
  - `actual_case_value`
  - `payment_status`
  - `marketplace_revenue_share`

Acceptance:

- Staff permissions are enforced by data, not only UI.
- Reporting by location, employee, and case value is reliable enough for pilots.
- Upload/proof artifacts are attached to tasks and visible in the estate document/support area.

## Confidence Rule

Do not call a path demo-safe unless it has passed:

- Family direct path.
- Family through funeral home.
- Participant invited by family.
- Participant invited by funeral home.
- Funeral-home director.
- Funeral-home employee assigned work.
- Multi-location operator.
- Vendor request and response.
- System-admin demo.

Each pass must verify:

- Page loads.
- Main action works.
- State changes visibly.
- Audit/proof appears.
- The user knows what to do next.
