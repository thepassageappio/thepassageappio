# Passage Ironclad Operating Spine Roadmap

## Why This Exists

Round 14 QA showed that Passage is functional but still asks users and prospects to connect too many dots. The remaining work is not more surface area. It is convergence:

- One task spine across family, participant, funeral-home employee, director, and vendor views.
- One proof/audit model for every action.
- One role model that makes it obvious who can see, assign, send, complete, and report.
- One demo story that walks a prospect from family intake to saved staff time.

This roadmap is sequenced so each sprint makes the current product more trustworthy without pretending deeper schema or compliance work is already complete.

## Product Audit Constraints

The latest product audit reinforces the same direction: Passage wins as a crisis coordination system, not as a broad memorial/social/AI product. Until the operating spine is reliable, new feature volume should be treated as risk.

## Current Sprint Sequence

Use this sequence to decide the next sprint whenever QA finds multiple valid issues. Marketplace, AI, memorial, and lifecycle expansion must not outrank the operating spine until the core paths are closed.

### Sprint A: Operational Calm / UX Unification

Purpose: make the whole product feel like one calm operating system instead of several pages stitched together.

Focus:

- Design-system normalization across homepage, urgent, estate, participant, funeral home, vendor, and admin surfaces.
- Spacing, typography, dashboard density, visual hierarchy, and mobile consistency.
- One visible next action per primary screen, especially for grieving users.
- Remove exposed internal/admin concepts from public or family navigation.
- Make footer, trust links, and public page depth consistent with the investor one-pager and sell sheet quality.

### Sprint B: Red Path Authority & Guidance

Purpose: make the first 10 seconds after a death feel directive, trustworthy, and low-load.

Focus:

- Triage first, authority second, minimum details third.
- Branches for unexpected home death, hospice at home, hospital/facility, and already-past-first-steps.
- Staging by minutes, today, next 72 hours, first week, and later.
- Decision-maker/NOK flows and professional handoff guidance.
- No empty progress dashboard or sign-in wall before a useful first-step plan.

### Sprint C: Funeral Home Operational Layer

Purpose: make the B2B pilot story credible for directors, location managers, staff, and families.

Focus:

- Operator dashboards with active cases, staff work, waiting responses, calls avoided, exports, and audit.
- Family visibility controls and act-on-behalf feedback.
- Communication logs, case progression states, role management, and staff workflow optimization.
- Location, employee, task, response-time, marketplace, and ROI reporting without exposing Passage-only business data.
- End-to-end proof: create case -> family link -> task assignment -> staff/funeral home action -> family-visible update -> export/report.

### Sprint D: Trust / Security / Enterprise Readiness

Purpose: make Passage feel legitimate enough for serious B2B pilots and sensitive family data.

Focus:

- Permissions polish, role visibility, audit visibility, export/backup assurances, and vault/document handling confidence.
- Trust center, security explanations, data ownership, retention, support routing, FAQ, Terms, Privacy, and urgent-path boundaries.
- Legal/compliance copy remains owner/counsel-review required before pilots rely on it.

### Sprint E: Lifecycle & Retention Layer

Purpose: make Passage become the family operating system over time after the urgent and planning spines work.

Focus:

- Planning updates, anniversaries/remembrance, long-term family continuity, multi-generation records, household record maintenance, and lifecycle engagement loops.
- This follows core command-center trust, not before it.

### Sprint F: Marketplace / AI Expansion

Purpose: expand value only after tasks, roles, proof, outputs, and trust are stable.

Focus:

- Task-native vendor ecosystem, contextual referrals, vendor revenue-share reporting, AI orchestration, advanced automations, integrations, and predictive workflows.
- AI work must use a server-side adapter, structured outputs, audit/proof logging, prompt fixtures, and no client-side model calls.

Near-term product constraints:

- Bias every public and in-app screen toward operational clarity: what matters now, who owns it, what is waiting, and what proof exists.
- Red path must feel like guided crisis coordination, not an onboarding dashboard.
- Green path should feel like family protection and preparedness, not mortality branding.
- Funeral-home surfaces should feel restrained, practical, and operationally serious.
- Mobile is not optional: family coordination, invitations, task updates, and urgent guidance must be comfortable on phones.
- Trust layer is now a product requirement: privacy, security, data ownership, role visibility, audit logging, legal boundaries, and support routing need visible homes before serious pilots.
- Public trust scaffolding is live only as product-boundary copy. Final Terms, Privacy, data retention, vendor terms, partner terms, and urgent-path liability language still require owner/counsel review before pilots can rely on them.
- AI, memorial, marketplace, and vault expansion must wait behind workflow excellence, task outputs, proof, permissions, and trust maturity. OpenAI implementation planning lives in `docs/openai-integration-migration-plan.md`; there is no active OpenAI code path today.

## Readiness Contract

Passage is not customer-ready until every actor below has a clear home, a clear next action, role-appropriate visibility, and a reliable way to record proof.

Actors that must be covered:

- Direct family coordinator: creates or activates an estate, sees one next task, invites helpers, records proof, and sees progress.
- Family using Passage through a funeral home: lands in a calm co-branded command center, sees what the funeral home is handling, and can answer family-needed requests without feeling abandoned.
- Participant/helper: receives a direct invite, understands why they were asked, acts on one responsibility, and sees their own completed/pending task history.
- Funeral home director/admin: sees all cases, staff, locations, reports, family communications, and vendor loops.
- Funeral home location manager: sees location-scoped cases, staff work, reports, and escalations.
- Funeral home staff/employee: sees assigned work only by default, can communicate, record proof, request family info, and mark work with audit.
- Vendor admin/user: sees approved profile setup, incoming task-native requests, quote/status workflow, and family/funeral-home-visible updates.
- Passage system admin: sees demo studio, vendor approval, system QA surfaces, and no real-family demo leakage.

Every actor path must answer:

- What do I do now?
- Who owns this?
- What happens when I click the button?
- Who gets notified?
- Where does the proof or output appear?
- How can the next person see the same truth?

## Unified Spine Contract

Every workflow feature must reuse this spine instead of creating persona-specific one-offs.

- Estate/case: the container for people, tasks, events, documents, messages, vendors, value, and audit.
- Task: the atomic unit of responsibility. It has an owner, status, execution mode, proof requirement, optional output, and next action.
- Assignment: who owns the task, whether they are family, participant, funeral-home staff, vendor, or system.
- Communication: email, SMS, copied message, in-app message, or future chat. It must have recipient, actor, channel, timestamp, status, and fallback.
- Proof: note, confirmation number, uploaded document placeholder, message receipt, task output, vendor status, or system event.
- Output: generated packet, template, script, message set, checklist, or export. If a task says automated or assisted, it must produce one.
- Event: funeral/memorial/shiva/service/meeting item visible inside the estate, not stranded in a task footer.
- Vendor request: task-native request with sent, viewed, quoted, accepted, in-progress, completed, or declined state.
- Report: derived from the above, never invented by dashboard copy.

If a feature cannot use this spine, it should be treated as a design smell and reviewed before implementation.

## Role and Permission Contract

Near-term UI may derive permissions from existing data, but the roadmap must converge on these durable rules.

| Role | Can see | Can assign | Can send | Can complete | Can report |
| --- | --- | --- | --- | --- | --- |
| Passage system admin | Demo, vendor admin, all QA/admin surfaces | Demo/system only unless explicitly acting in test | Demo/system only unless approved | Demo/system QA | All system/admin reports |
| Funeral home director/admin | All org locations, cases, staff, reports | Any org case/staff/vendor request | Family/staff/vendor communications | Any org task with audit | Org/location/employee/revenue reports |
| Location manager | Assigned location cases and staff | Location staff/cases | Location communications | Location tasks | Location reports |
| Funeral home staff | Assigned cases/tasks by default | Only if granted | Task-related communications | Assigned tasks | Own work summary |
| Family coordinator | Own estate/case | Family participants/vendors where allowed | Family/participant/vendor messages | Family-owned tasks | Estate progress summary |
| Participant/helper | Assigned responsibilities | No, unless promoted | Reply/update assigned task | Assigned task only | Own task history |
| Vendor admin/user | Own vendor profile and requests | Internal vendor staff later | Request updates/quotes | Vendor request status | Vendor request/revenue summary |

Permission failures should route to the right next action, not a blank page or browser alert.

## Automation Honesty Contract

Task labels must be earned:

- Fully automated: Passage can create/send/log/follow up with minimal user intervention, and the user sees proof.
- Assisted execution: Passage creates the packet, message, script, or vendor request, and the user approves or completes the final external step.
- Guided manual: Passage explains what to do and captures proof, but does not produce an output or send anything.

No task may be labeled automated unless it produces a visible artifact, sent communication, tracked request, or follow-up event.

## Current Known Gaps

These are not failures to hide. They are the work queue until fixed and QA-passed:

- Public landing/nav/footer are now mostly unified: shared header is live, mobile hides secondary links, `My tasks` replaced ambiguous participant language, footer trust/legal destinations are visible, and homepage SSR hero opacity has a visible fallback. Remaining work is content proof/social proof, not basic chrome.
- FAQ, Trust, Privacy, and Terms overview destinations exist, but they are not final legal/compliance policy. The next legal sprint must replace overview copy with owner/counsel-approved language.
- Urgent flow has been pulled back toward the crisis spec: triage first, sequence rail before save/details, no empty progress sidebar, no sign-in wall before value, and local completion requires proof. Remaining work is persistence of local proof into the saved estate task row.
- The task action UI is still not fully shared everywhere, but the estate and participant surfaces now enforce the same proof/waiting/help spine more consistently.
- Proof attachments now have a first storage-backed path from estate tasks into `passage-documents/task-support`; later work still needs a durable `task_attachments` index/table and document-center surfacing.
- Funeral-home employee permissions are visible but not yet fully schema-enforced.
- Vendor approval/profile/request status exists in pieces and needs a stronger provisioning loop.
- Demo studio is separate, but the guided story needs to expose only the active step and stay dummy-only.
- Estate index now points users into a selected estate before editing wishes, documents, obituary, people, memories, messages, or proof. Remaining work is to make the per-estate file drawer feel native inside the estate workspace instead of a routed overlay with a back link.
- Guide unlock UI now lives inside the locked guide card/module and records a support/lead inquiry. Remaining work is richer guide content and public proof.
- Reporting is useful but still derived from imperfect existing fields; case value and marketplace share need durable fields before pilot-grade ROI.
- The funeral-home marketing page tier CTAs have visible fallback, dashboard access has a graceful signed-out path, and feature tabs visibly change. Remaining demo trust depends on the closed loop being demonstrable from partner case creation through family-visible update.
- Collins demo auth is active through email/password. The partner dashboard must keep that password path available for demo users while Google remains the real-world partner option.
- Public funeral-home walkthrough CTAs must not route a prospect into `system/demo` or any Passage-admin-only surface. Until a public guided demo exists, route to contact/walkthrough booking.
- Schema has moved ahead of product activation. `organizations`, `funeral_home_partners`, `estate_participants`, `subscriptions`, `account_entitlements`, `marketplace_interactions`, and `vendor_requests` must have real demo/test activation paths before they are used in demos as proof.
- Status events are not enough. A task loop is not healthy until the task row reaches the expected terminal state and the event/audit trail agrees with it.

## Schema Activation Gate

The schema can tell a sophisticated product story, but the demo is not credible until the tables are exercised by real product flows. Passage must treat the following as activation gates, not optional seed data:

- Partner identity: at least one test funeral-home `organization` and `funeral_home_partner` must exist before partner dashboard QA.
- Family handoff: partner case creation must write the `estate_participants` or equivalent participation link that lets a family open the correct command center.
- Terminal task state: marking handled must update both the audit/status event and the task row's terminal status used by dashboards and reports.
- Vendor loop: seeded `marketplace_providers` must connect to at least one task-native `vendor_request` or explicitly remain hidden from demo claims.
- Entitlement loop: pricing CTAs must either complete a test Stripe entitlement path or route to a visible contact/pilot fallback. They may not pretend payment is live if `subscriptions`, `accounts`, and `account_entitlements` are empty.
- Analytics truth: dashboards can show demo values, but must label them as demo/estimated until the underlying tables have nonzero pilot activity.

Minimum B2B activation proof before a serious funeral-home meeting:

1. A test funeral-home partner exists and can sign in or reach the gated dashboard path gracefully.
2. The partner creates a case and the family/estate participation link is written.
3. The family opens the linked command center.
4. The partner marks one task handled and the family sees the update.
5. At least one verified notification channel records delivery or a clear fallback.

Latest DB contract status:

- Collins auth, org membership, partner context, invite token lookup, estate access, task visibility, done analytics fields, and task-status-event task IDs are green for the seeded demo path.
- Remaining QA is runtime/product: verify the live UI signs Collins in, opens partner cases, accepts family invite routes without a dead end, and writes one new task status event with `task_id` through the app path.

## Success Scorecard

This roadmap is complete only when the experienced product, not just the schema, reaches these thresholds:

| Dimension | Current bar | Target after roadmap |
| --- | ---: | ---: |
| Base UI / visual design | 7.5 | 8.5 |
| UX / overall experience | 6.5 | 8.5 |
| Funeral-home landing page | 7.0 | 8.5 |
| Funeral-home demo readiness | 3.5 | 8.0 |
| Participant experience | 5.0 | 8.0 |
| Green-path planning experience | 5.5 | 8.0 |
| Red-path urgent experience | 6.5 | 8.5 |
| Vendor experience | 2.0 | 7.0 |
| Funeral-home employee/staff experience | 3.0 | 7.5 |
| Roles and permissions | 4.0 | 7.5 |
| Reporting and metrics | 5.5 | 8.5 |
| Overall platform | 5.1 | 8.1+ |

The fastest path to these scores is not more feature surface. It is closing four loops:

1. Red path closes: task marked handled in UI -> task row reaches terminal state -> proof/audit appears -> participant/family notification fires -> participant sees the right task/update.
2. Funeral-home partner activates: organization exists -> staff signs in -> case is created -> family is linked -> family sees coordinated view -> act-on-behalf is visible to both sides.
3. Payment gate works: pricing CTA -> checkout/test checkout -> subscription/account row -> entitlement -> unlocked planning experience and nonzero analytics.
4. Vendor marketplace connects: request from task -> vendor notified -> vendor status changes -> family/funeral-home see the status -> interaction/revenue reporting has a real event.

No sprint should be called successful if it improves copy or UI while leaving the relevant loop unclosed.

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

Status: shipped as a first visibility slice. Needs QA against director, location manager, staff, and multi-location expectations before being called pilot-ready.

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
- If a recipient is missing, the user is prompted to assign or add one before sending.
- If a recipient exists, the user can send through Passage, CC the coordinator where appropriate, and see the message in the estate communication/audit center.
- Generated task outputs are saved or visibly attached to the task/estate support area.

Demo blockers included in this sprint:

- `Send reminder` can never show a browser alert dead-end. Missing recipient must open the assignment step.
- `Send through Passage` must be visible when a task has an assigned recipient and must create an estate communication/audit event.
- Assigned clergy, funeral-home, family, and participant tasks use the same send/proof/waiting/help workflow.
- Task output workspaces, such as obituary or packets, must make clear whether the user is drafting, sending, downloading, or marking done.

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
- Participant and staff completed/pending history is visible without hunting through unrelated pages.
- Confirmation-contact tasks explain what confirming death means and what orchestration it triggers before a user can mark handled.

Closed-loop requirements:

- Family creates/activates estate -> participant receives invite -> participant lands on task -> participant acts -> family sees update.
- Funeral home creates case -> family receives link -> family sees command center -> funeral home handles work -> family sees proof/update.
- Funeral home assigns employee -> employee lands in staff work -> employee acts -> director sees update.
- B2B case creation writes the linking record needed for funeral-home/family coordination, such as `estate_participants` or the approved successor model.

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
- Obituary, clergy outreach, family notification, funeral-home prep, bank/government/executor packets, event notices, and home/assets actions use the same task workspace pattern.
- Outputs can be copied, downloaded, sent, or saved as draft where appropriate.

## Sprint 5: Vendor and Marketplace Response Loop

Goal: Make vendor participation task-native and auditable.

Must ship:

- Vendor admin approval flow loads applications and can approve/decline/provision next steps.
- Approved vendor user lands in vendor portal with profile setup and incoming requests.
- Request status progression: sent, viewed, quoted, accepted, in progress, completed.
- Family/funeral-home task view shows vendor status in the same task/audit spine.
- Revenue-share values remain tracked, not promised, until payment flow is approved.
- Vendor request action buttons must be visibly state-changing in system-admin demo mode and persistently state-changing for tokenized live requests.

Acceptance:

- Vendors never appear as a generic directory.
- Family and funeral home can see status without calling around.
- Admin can explain how vendor access is provisioned.
- A vendor application can move from submitted to approved/declined to profile setup without blank admin pages.
- Approved vendors land in a vendor-owned setup/dashboard path, not a family participant path.
- Vendor admin is system-admin only, loads a meaningful empty state, and explains the provisioned-user path.
- Seeded providers are not enough: at least one vendor request and one marketplace interaction must be created in a non-production-safe demo/test path and visible in the task/audit spine.
- Vendor request actions prove the spine: status, value, proof trail, estate event, task activity, and owner notification attempt are all clear and auditable.

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
- Only the current demo step is visually dominant; inactive steps are collapsed or hidden.
- The coach overlay tells the Passage seller what to say, what to click, and what pain the screen proves.
- Demo employees, demo families, demo vendors, demo messages, and demo reports are all dummy data.

The demo must explicitly prove:

- Funeral home creates a case.
- Family receives or opens their command center.
- Funeral-home staff is assigned a task.
- Staff/funeral home sends a message or request through Passage.
- Family/participant/vendor sees the right role-specific view.
- A task output is produced.
- A report/ROI metric changes.
- CSV/export proves Passage does not trap data.

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

## Sprint 6B: Public Trust and Urgent Flow Regression Fix

Goal: Restore first-impression trust before any B2B or family demo.

Must ship:

- Landing hero has an SSR-safe visible fallback; no slow-connection blank hero.
- Mobile nav is simplified. `Participant` becomes a clearer label such as `My tasks` or is moved behind authenticated context.
- Footer includes visible privacy and terms destinations after owner-approved legal copy exists.
- Urgent path returns to one primary action at a time:
  - first ask what happened
  - then authority
  - then minimum details needed for the command center
  - then save/open without making sign-in feel like a wall
- Empty dashboard metrics are hidden from the urgent first impression until they carry meaning.
- `Choose what happened first` appears before the triage choices, not after the form.

Acceptance:

- A crisis user sees exactly one obvious first action within 3 seconds.
- No urgent screen shows empty progress as the first impression.
- A funeral-home prospect sees public trust signals before being asked to sign in or pay.

## Sprint 7: Role and Data Hardening

Goal: Convert derived UI concepts into durable permission and reporting primitives.

Likely schema work, requiring owner approval:

- `organization_members.scope`: all cases, location cases, assigned tasks only.
- `organization_members.location_id`.
- `workflows.location_id`.
- `tasks.assigned_to_user_id`.
- `tasks.assignment_actor_role`.
- `task_attachments` index/table for storage-backed proof uploads already saved under `passage-documents/task-support`.
- Estate value fields for ROI:
  - `estimated_case_value`
  - `actual_case_value`
  - `payment_status`
  - `marketplace_revenue_share`
- Communication/event/thread hardening:
  - `message_threads`
  - `message_thread_participants`
  - `message_events`
  - `estate_events`
  - `task_outputs`

Acceptance:

- Staff permissions are enforced by data, not only UI.
- Reporting by location, employee, and case value is reliable enough for pilots.
- Upload/proof artifacts are attached to tasks and visible in the estate document/support area.
- Account/subscription/entitlement writes are verified from checkout or a controlled admin grant path.
- Analytics views have a demo/test data path so they do not show misleading all-zero dashboards during a sales demo.

## Sprint 7A: Schema Activation and Loop Reconciliation

Goal: Prove existing schema primitives are alive before adding more schema.

Must ship:

- At least one controlled funeral-home partner/org setup path for demos and pilots.
- At least one case creation flow that links organization, estate/workflow, family contact, and staff owner.
- Task status reconciliation: status events and task terminal status must agree for handled/completed/not-applicable flows.
- Controlled entitlement grant path for pilot/demo accounts if Stripe checkout is not yet the source of truth.
- Marketplace request smoke path that writes provider/request/interaction records and shows status in the task spine.
- Analytics QA seed or demo mode that explains when metrics are real, demo, or empty.

Acceptance:

- A B2B demo cannot rely on a table that has zero rows unless the demo explicitly shows setup from zero.
- A task marked handled updates both the task row and the audit/event trail.
- Dashboard metrics label whether they are real, demo, or unavailable.

## Sprint 7B: Public FAQ, Support, and Legal Trust Layer

Goal: Give families, vendors, participants, funeral homes, and prospects clear answers while reducing support and liability ambiguity before pilots.

Must ship:

- FAQ page with audience sections:
  - urgent family users
  - planning users
  - participants/helpers
  - funeral homes and employees
  - local vendors
  - billing, support, feature requests, bug reports, and disputes
- Vendor FAQ answers:
  - how to become a local vendor supporting families
  - how applications are reviewed
  - whether the vendor admin list comes from vendor applications, not the general contact form
  - how approved vendors sign in
  - how task-native requests work
  - how a vendor gets support or disputes a request/billing issue
- Support routing model:
  - vendor applications
  - contact/support inquiries
  - feature requests
  - bug reports
  - billing disputes
  - funeral-home pilot inquiries
  - family urgent-flow support
- Owner/counsel-reviewed legal pages:
  - Terms
  - Privacy Policy
  - data ownership and retention
  - accepted use
  - payment/billing terms
  - vendor participation terms
  - urgent-path disclaimer and liability limitation
- Urgent-path disclaimer language must make clear:
  - Passage provides coordination guidance, not emergency, legal, medical, financial, religious, or funeral-directing advice.
  - Passage does not replace 911, local authorities, hospice, medical professionals, funeral directors, attorneys, clergy, or other professionals.
  - Users remain responsible for deciding whether to call 911, hospice, police, a funeral home, or another authority.
  - Workflows and recommendations are best-practice guidance and customizable planning tools, not guaranteed instructions.
  - Users accept Terms before relying on saved workflows, paid services, or partner features.

Acceptance:

- A vendor can understand how to apply and where their admin request appears.
- A family understands that Passage coordinates next steps but does not replace emergency/local professional judgment.
- A funeral-home prospect sees Privacy/Terms/Support destinations before a serious demo.
- Legal/disclaimer language remains marked owner/counsel-review required until approved.

## Sprint 8: Communication Command Center

Goal: Make family, funeral home, participant, and vendor communication feel like one coordinated truth instead of scattered task notes.

Must ship:

- Estate communication center with filtered threads:
  - family and funeral home
  - family and cemetery/vendor
  - family, religious leader, and funeral home
  - internal funeral-home staff
- Task messages create communication events automatically.
- Every sent message links back to task, actor, recipients, and status.
- Family/funeral-home views show the same thread state with role-appropriate detail.

Acceptance:

- A funeral-home director can send or review a task message and see it in the estate communication center.
- A family can understand who was contacted and what is waiting.
- No message is trapped only inside a task modal.
- Coordinator/family CC rules are explicit: when a funeral home or staff member sends a family-facing task message, the coordinator can see the sent copy and audit trail.

## Sprint 9: Estate Command Center Rebuild

Goal: Make `My estate` and each individual estate feel like a true command center, not a long task page.

Must ship:

- Estate index shows each estate with status: planning, active after-death orchestration, completed/archived, percent ready/handled, and next action.
- Clicking an estate opens the estate, not a random unrelated task.
- Estate detail has clear tabs:
  - Today
  - Tasks
  - People
  - Events
  - Documents and outputs
  - Obituary and wishes
  - Messages
  - Audit
- Main pane shows one current task with next/previous controls.
- Side pane groups tasks by time horizon: first 24 hours, next 72 hours, first week, first month, later.

Acceptance:

- The page does not become an endless scroll.
- Wishes, obituary, events, proof, documents, and communications live in predictable tabs.
- A user can move from estate index to exact task context without losing orientation.

## Sprint 10: B2B Closed-Loop Pilot Gate

Goal: Prove the funeral-home loop end to end before serious prospect demos.

Must ship:

- Public funeral-home pricing CTAs route to a visible next step for unauthenticated prospects and do not feel dead.
- Feature tabs are browser-tested and each tab changes visible content.
- Partner dashboard loads behind auth and has a graceful signed-out path.
- A test `organization` + `funeral_home_partner` activation path exists for the pilot/demo funeral home.
- Case creation saves a real partner case in non-demo mode.
- Case creation writes the necessary family/funeral-home participation link, with `estate_participants` or the current canonical join table populated.
- Family link opens the correct family command center.
- Act-on-behalf updates are visible to the family and written to audit.
- Act-on-behalf reaches the dashboard/report terminal state, not only a status-event row.
- Email delivery is verified as the default channel; SMS is shown as approved/pending/fallback honestly.
- The demo/pilot org has at least one funeral-home partner, at least one staff member, and at least one linked family case before prospect QA starts.
- Vendor cards only appear in the demo if at least one `vendor_request` path can be created, viewed, and audited or the card is clearly marked as illustrative.

Acceptance:

- A 12-minute funeral-home demo can show the loop without hand-waving.
- If SMS is not fully approved, the product says email fallback is the verified channel instead of implying SMS certainty.
- No demo CTA hits a dead end.

## Sprint 11: Passage System Admin Shell

Goal: Collapse Passage-only utilities into one system-admin command center so public, family, vendor, and funeral-home nav stays calm.

Must ship:

- Single `System admin` nav entry visible only to Passage system admins, not estate admins, funeral-home admins, location managers, vendor admins, or family coordinators.
- Organize Passage-only tools under the shell:
  - demo studio
  - vendor applications/admin
  - vendor page QA shortcut
  - leads/support inbox
  - internal reporting
  - raw data exports
  - platform QA links
- Role copy that distinguishes Passage system admin from customer account admins.
- Meaningful empty/loading/error states for every admin module.
- Admin module audit copy that explains whether data is real, demo, estimated, or unavailable.

Acceptance:

- Public header no longer exposes Demo, Vendor page, and Vendor admin as separate top-level links.
- Customer admins cannot see Passage system-admin tools.
- Steve can reach demo, vendor admin, support inquiries, reporting, and raw exports from one admin entry.

## Sprint 12: Passage Business Health Dashboard

Goal: Surface the business metrics and raw operating data Passage needs before a dedicated CRM/business intelligence stack exists.

Must ship:

- Time filters:
  - day
  - week
  - month
  - quarter
  - year
  - custom range
- Revenue and subscription metrics:
  - ARR
  - MRR
  - NRR
  - churn percent
  - subscription amount
  - renewal dates
  - free-to-paid conversion time
  - pilot customers not converted
- Revenue segmentation:
  - B2B funeral-home revenue
  - D2C planning/urgent revenue
  - marketplace/vendor revenue
  - rev-share percent and dollars
  - marketplace spend/value by customer and time period
- Lead/support CRM-lite views:
  - submitted leads
  - contact inquiry type
  - vendor applications
  - feature requests
  - bug reports
  - billing disputes
  - pilot prospects and conversion stage
- Engagement/customer health metrics:
  - tasks by customer/org
  - tasks per estate
  - participants per estate
  - user login count where available
  - activity/session proxy where available
  - participant invitation acceptance time
  - funeral-home response time
  - vendor response time
  - renewal risk indicators
- Raw data export behind every report:
  - CSV export for the rows powering each chart/table
  - source table/view label
  - date range and filters captured in export
  - clear indicator when a metric is estimated, demo-only, or unavailable

Acceptance:

- Internal metrics do not invent ARR/MRR/NRR/churn if subscription/account tables are empty.
- Every number is traceable to a source table/view or a clearly marked missing instrumentation need.
- The dashboard can function as a rough CRM and business health console until Passage outgrows it.

## Sprint 13: Customer ROI and Operations Reporting

Goal: Turn the same operating spine into customer-facing ROI reports for funeral homes without exposing Passage-only business data.

Must ship:

- Funeral-home reporting tabs:
  - tasks completed
  - calls avoided
  - average response time
  - tasks per estate
  - tasks by employee
  - tasks by location
  - participant response time
  - vendor request status
  - marketplace value and funeral-home share where enabled
- Filters by day, week, month, quarter, year, and location.
- Raw CSV export for every funeral-home report.
- Clear separation between Passage internal revenue metrics and funeral-home ROI metrics.

Acceptance:

- A funeral-home director can see why Passage saves staff time.
- Multi-location operators can compare workload and response time by location.
- Employee metrics never expose family-private details beyond that role's permission scope.

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

## QA Gate After Every Sprint

Before moving to the next sprint:

- Local build must pass.
- No new TypeScript/ESLint-blocking errors.
- Production green deployment must be identified before live QA.
- At least one smoke path per actor must be checked.
- Any dead button, blank page, browser alert dead-end, or silent action becomes P0 for the next patch.
- If a path is not fully verified, report it as unverified instead of calling it fixed.
- Public route smoke list must include `/`, `/urgent`, `/guides`, `/funeral-home`, `/funeral-home/dashboard`, `/participating`, `/estate`, `/system/demo`, `/vendors/request`, `/vendors/admin`, `/contact`, `/pricing`, `/faq`, `/trust`, `/privacy`, and `/terms`.
- B2B loop smoke must include: pricing CTA, dashboard gated path, feature tabs, case create, family link, act-on-behalf, family-visible update, export.
