# Hospice / Warm Path Spine

## Product Rule

Passage is not adding a hospice product beside the funeral-home product. Passage is adding another door into the same family transition spine.

The spine stays:

Estate or case -> lifecycle events -> tasks -> owners -> communication -> proof -> status -> reporting.

The door changes the emotional state, first questions, and visible workflow:

- Green path: planning before it is needed.
- Warm path: preparing during serious illness, hospice, or expected decline.
- Red path: someone has died and the family needs immediate guidance.
- Partner path: funeral homes coordinate family work without replacing their case system.
- After path: estate, accounts, grief resources, anniversaries, and long-tail family continuity.

## Why This Matters

Hospice, funeral homes, attorneys, vendors, clergy, family helpers, and caregivers all touch the same transition. Today the family usually carries context between institutions by phone, memory, paper packets, and repeated explanations.

Passage should preserve continuity:

- Hospice helps the family prepare before the death.
- The family records who to call, what is known, and what is still uncertain.
- When death occurs, the urgent path starts from the existing context.
- The funeral home receives a permissioned handoff instead of starting from zero.
- The same record continues into aftercare and estate tasks.

## In Scope Now

- A warm-path front door for families in hospice or serious illness.
- A demo-safe hospice preparation story for sales and product QA.
- Lifecycle event requirements that rank tasks by urgency, dates, and missing context.
- A handoff packet concept that can later become PDF, CSV, or partner-facing export.
- Copy and UX rules that keep this non-clinical, approval-first, and emotionally calm.

## Out Of Scope Now

- Replacing hospice EHRs.
- Storing clinical notes beyond family-provided coordination context.
- Real PHI integrations.
- Clinical, medical, legal, or emergency advice beyond clear boundaries.
- Real email/SMS blasting without consent and approval controls.
- Hospice billing, scheduling, or care-plan operations.

## Lifecycle States

Use these as orchestration states. They can live in `orchestration_summary` first and become formal columns later only if the schema needs it.

- `planning`: family is organizing wishes, people, documents, and preferences.
- `serious_illness`: family is preparing while the person is alive and care is active.
- `hospice_preparation`: hospice or expected-death preparation is active.
- `death_imminent`: family expects death soon and needs the "when it happens" plan.
- `death_confirmed`: death has occurred and first official steps are active.
- `funeral_coordination`: funeral home / ceremony / disposition work is active.
- `aftercare`: estate, benefits, accounts, grief support, and continuity.

## Core Events

Events should describe what happened. UI should not directly perform broad side effects.

- `warm_path_started`
- `hospice_contact_recorded`
- `caregiver_coordinator_named`
- `funeral_home_preference_recorded`
- `authority_contact_recorded`
- `family_update_list_prepared`
- `when_it_happens_plan_prepared`
- `death_occurred_from_warm_path`
- `funeral_home_handoff_prepared`
- `funeral_home_handoff_shared`
- `task_assigned`
- `task_waiting`
- `task_completed`
- `announcement_batch_prepared`

## Roles And Visibility

### Patient / Loved One

The person at the center of the record. Passage should be careful with language and avoid treating them like a case file in family-facing copy.

### Family Coordinator

Owns the family record, update list, permission decisions, and handoff approval.

### Primary Caregiver

Often knows the practical details: hospice line, medications location, home access, who is present, and who needs updates.

### Hospice Social Worker / Care Team Contact

Can be a guide or invited participant. They should see only preparation tasks and non-clinical family coordination context unless explicit permission is added later.

### Funeral Home Director / Staff

Receives the permissioned handoff when the family chooses or when death occurs. Should see dates, family contacts, service preferences, authority, hospice contact, and missing details.

### Participants

Family helpers, executor, clergy, friend, pallbearer, or local support person. They should only see assigned work and needed context.

### Vendors

Scoped service providers. They receive only task-native requests with urgency, location, expected response, and status loop.

## Date And Event Model

Passage needs dates to orchestrate. If unknown, unknown must become a visible blocker rather than fake certainty.

Key dates:

- Expected decline window, if known.
- Date of death, once known.
- Pronouncement date/time.
- Removal/pickup date/time.
- Arrangement meeting date/time.
- Visitation/wake/shiva/receiving hours date/time.
- Funeral/memorial/celebration date/time.
- Burial/interment/cremation date/time.
- Obituary deadline.
- Family announcement send time.
- First-week aftercare target dates.

Rules:

- If a date is known, tasks rank around it.
- If a date is unknown but required soon, the task becomes "urgent - date needed."
- If a date is optional or not yet applicable, it should not block first actions.
- The family should be able to send one event one-pager once dates are known.

## Warm Path Task Templates

### Name The Family Coordinator

- Mode: guided manual proof.
- Owner: family coordinator.
- Proof: named person and backup.
- Dependency: none.
- Why it matters: one accountable person reduces repeated calls.

### Record Hospice Agency And On-Call Line

- Mode: guided manual proof.
- Owner: caregiver or family coordinator.
- Proof: agency, nurse/social worker contact, after-hours line.
- Dependency: none.
- Why it matters: if death occurs under hospice, the first call is usually hospice, not random institutions.

### Prepare The "When It Happens" Plan

- Mode: prepared output.
- Owner: family coordinator.
- Proof: reviewed plan.
- Dependencies: hospice contact, home/facility location, funeral home preference if known.
- Output: one-page steps for the first hour.

### Record Authority / Decision Maker

- Mode: guided manual proof.
- Owner: family coordinator.
- Proof: person authorized to coordinate next steps and documents to find.
- Dependency: none.
- Why it matters: funeral homes and institutions need a clear responsible contact.

### Choose Or Record Preferred Funeral Home

- Mode: assisted communication.
- Owner: family coordinator or hospice social worker.
- Proof: preferred home, undecided, or needs recommendation.
- Dependency: none.
- Why it matters: the handoff is smoother if the choice is known before the trigger event.

### Gather Service And Disposition Preferences

- Mode: guided manual proof.
- Owner: family coordinator.
- Proof: burial/cremation/green burial preference, ceremony tone, faith/cultural considerations, "unknown" if not discussed.
- Dependency: family permission.
- Why it matters: avoids forcing major decisions from a blank page during shock.

### Prepare Family Update List

- Mode: prepared output.
- Owner: family coordinator.
- Proof: recipient list and channel preference.
- Dependency: none.
- Output: email/SMS-ready announcement batch that does not send until approved.

### Prepare Funeral-Home Handoff Packet

- Mode: prepared output.
- Owner: family coordinator.
- Proof: packet reviewed and permissioned.
- Dependencies: family contact, hospice contact, authority, preferred funeral home if known.
- Output: contacts, dates, preferences, missing items, documents, and communication preferences.

### Activate Red Path When Death Occurs

- Mode: event-triggered guidance.
- Owner: family coordinator or caregiver.
- Proof: death occurred and first official contact path chosen.
- Dependencies: none.
- Output: red-path command center starts with known warm-path context.

## Cross-Persona Workflow

### Family Enters Through Hospice

1. Family opens "Preparing during care."
2. Passage asks for the hospice/on-call contact, primary caregiver, family coordinator, and preferred funeral home if known.
3. Passage prepares the first-hour plan and family update list.
4. Family can step away; the record stays organized.
5. When death occurs, family taps "Death has occurred."
6. Passage starts red path from known context and tells the family the first real action.
7. Funeral home receives a reviewed handoff when the family approves.

### Hospice Social Worker Invites Family

1. Hospice gives a Passage link as optional family coordination support.
2. Family creates the record and owns permissions.
3. Social worker can be added as a scoped helper if needed.
4. Passage does not ingest clinical records.
5. The family carries the record forward after hospice is no longer the primary institution.

### Funeral Home Receives The Handoff

1. Family selects or records funeral home.
2. Passage prepares the handoff packet for approval.
3. Director sees primary contacts, known dates, disposition preferences, hospice contact, authority, and missing items.
4. Director opens the case/task spine and assigns staff.
5. Family sees what is being handled without repeated calls.

### Direct Red Path Still Works

1. If the family never used warm path, red path asks the minimum immediate context.
2. Hospice case remains a red-path scenario option.
3. Missing dates and contacts become urgent tasks, not blockers to starting.

## Platform Impacts

### Homepage

Add a third door: "Preparing during care" or "Someone is seriously ill." It should sit between green and red emotionally.

### Warm Path Page

Create a demo-safe front door that explains the journey, tasks, dates, handoff packet, and red-path activation without sending anything.

### Urgent Path

Keep hospice-specific first steps. If the user came from warm path, prefill known hospice/funeral-home/context values later.

### Planning API

Future: accept `mode: warm` or `path: warm` and store warm context in `orchestration_summary`.

### Estate UI

Show lifecycle state and event-date unknowns as task priority inputs.

### Funeral Home Dashboard

Show "received from family/hospice preparation" as a confidence signal. Import/handoff should not look like a new case-management migration.

### Share / Announcement

Support event one-pagers and recipient batch prep. Sending remains approval-first and consent-aware.

### Demo Studio

Add a warm-path stop before funeral-home case creation so sales can tell the continuity story.

### Trust

Use plain language:

- Family controls the record.
- Passage is not hospice EHR or medical advice.
- Nothing is shared with a funeral home, hospice, vendor, or participant without approval.

## Sprint Plan

### Sprint 1: Demo-Safe Warm Path

- Add warm-path requirements doc.
- Add `/hospice` or `/during-care` front door.
- Add homepage entry point.
- Add demo-studio warm path rail.
- No real sends, no DB mutation required.

### Sprint 2: Persisted Warm Path Record

- Add `path: warm` creation flow using current workflow patterns.
- Store hospice/contact/date context in `orchestration_summary`.
- Generate first warm-path task set.
- Show warm lifecycle state on estate page.

### Sprint 3: Handoff Packet

- Generate funeral-home handoff packet from warm path.
- Add approval-first share route to partner dashboard.
- Add CSV/PDF-ready export fields.

### Sprint 4: Announcement And Date One-Pager

- Generate event/date one-pager.
- Support recipient batch prep with email/text/manual groups.
- Add consent-aware send queue later; no automatic sends until approved.

### Sprint 5: Hospice Partner Discovery

- Build a hospice-facing explanation page and pilot script.
- Interview hospice social workers and family coordinators.
- Keep it referral/discovery until the funeral-home wedge is proven.
