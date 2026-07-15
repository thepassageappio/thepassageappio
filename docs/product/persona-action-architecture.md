# Passage continuity architecture

Status: target product contract for Passage Zero. The current demo routes prove the interaction language; this document defines the complete product they grow into.

## Product model

Passage is one person-centered continuity record projected differently for each participant.

```text
person / plan
  → family-controlled intent
  → bounded consent
  → receiving organization
  → accepted case
  → owned commitment
  → visible proof
  → next handoff
  → durable history
```

Every action follows the same contract:

```text
actor → purpose → permitted scope → owner → due state
      → action → proof → notified participants → next owner
```

No task is merely complete. Completion creates evidence and advances a named next commitment.

## Primary product excellence: the funeral director's right hand

The funeral-home experience is the primary product wedge and must be excellent enough that directors prefer to operate through Passage.

The north-star walk-in flow is:

```text
family walks in with QR
  → director scans
  → Passage verifies recipient, scope, and expiry
  → director chooses location and lead
  → case is created immediately
  → approved information, documents, and wishes are attached
  → the first case commitment is assigned
  → the family and director both receive proof
  → Passage synchronizes the case into the funeral home's system
```

There is also a no-pass path. A director can create a walk-in case from person, family contact, operating location, urgency, and lead director; Passage then creates a missing-information queue instead of forcing a long intake form.

The director should never re-key information Passage already knows. Every accepted handoff preserves source, scope, actor, destination, and downstream system identifiers so integration errors are visible rather than surprising.

## Experience doctrine: zero hand-holding

Users should not need training, a walkthrough, or dense explanatory pages.

Every signed-in surface must provide:

1. A stable role-specific menu.
2. One obvious primary action.
3. Current status, owner, waiting party, and due state.
4. Short instructions next to the control that needs them.
5. Actions that change real state or produce visible proof.
6. A shared activity trail that explains what changed.
7. Clear empty states with one setup action.
8. Keyboard access, responsive mobile behavior, and plain labels.

Avoid welcome essays, dashboard card collections, internal jargon, and setup that asks for information before it is needed.

## Personas and their relationship to the record

| Persona | Entry | Default scope | Primary actions | Returns to the spine |
| --- | --- | --- | --- | --- |
| Planning individual | D2C, advisor, employer, or provider referral | Own living plan | Record wishes, name trusted people, add documents, define sharing | Versioned preferences, invitations, release rules |
| Family coordinator | D2C urgent start, invitation, or care handoff | Family space and granted case areas | Coordinate, assign, approve, issue passes, monitor | Decisions, ownership, consent, family proof |
| Invited family participant | Secure invitation | Assigned discussions, decisions, tasks, or event content | Contribute, acknowledge, complete, upload | Contribution, acknowledgment, task proof |
| Hospice / care provider | Verified organization or recipient invite | Care handoff and family-approved categories | Prepare handoff, identify contact, confirm readiness | Source record, transfer details, receipt |
| Funeral-home owner / administrator | Organization setup | Organization, locations, people, templates, audit | Configure, invite staff, assign location roles, report, integrate | Membership, policy, configuration, audit |
| Funeral director | Organization invitation or accepted handoff | Assigned or location-authorized cases | Accept intake, own case, guide decisions, assign work, commission partners | Case status, decision record, ownership, proof |
| Funeral-home employee | Organization invitation | Assigned cases and commitments | Work task, message, record blocker, attach proof, hand off | Work status, proof, escalation |
| Transfer / preparation operator | Scoped assignment | One operational commitment | Accept dispatch, confirm milestones, report exceptions | Milestone and completion proof |
| Cemetery / crematory | Verified partner account or secure request | One case request and selected details | Accept, schedule, quote, confirm, return proof | Partner acceptance, schedule, disposition proof |
| Vendor | Secure request or partner account | One bounded request/order | Accept, negotiate, propose alternative, plan order, invoice, deliver | Quote, message, order state, delivery proof |
| Celebrant / venue / clergy | Secure service invitation | Approved service brief | Confirm, request details, submit outline or proof | Availability, questions, service artifact |
| Executor / estate administrator | Family handoff or estate invitation | Estate workspace only | Inventory, assign, notify, request documents, close obligations | Authority status, packet, response, closure proof |
| Attorney / financial professional | Scoped estate matter | Assigned matter and approved documents | Advise, request, file, return status | Matter note, filing, professional proof |
| Passage support / trust admin | Internal audited access | Metadata first; break-glass only when authorized | Recover, investigate, verify organization, remediate | Support reason, session audit, resolution proof |
| Automated workflow actor | Explicit workflow grant | Named event and permitted fields only | Remind, expire, generate, synchronize, escalate | Attributed automation event and outcome |

Funeral permissions, estate permissions, organization permissions, and family permissions are independent. No role silently inherits another role's access.

## Lifecycle and page/action inventory

### 1. Discover and enter

| Surface | User action | System action | Next state / proof |
| --- | --- | --- | --- |
| `/` | Choose planning, urgent family, funeral home, or partner entry | Routes by situation, not product vocabulary | Entry source recorded |
| `/start` | Choose "planning ahead" or "someone needs help now" | Creates resumable onboarding session | Session receipt |
| `/invite/[token]` | Inspect inviter and scope, accept or decline | Validates token and binds the correct role | Membership receipt |
| `/organization/start` | Create or join funeral-home organization | Starts verified organization setup | Organization draft |
| `/partner/request/[token]` | Inspect a bounded vendor request | Opens request without exposing the case | Request view event |

### 2. D2C planning and family setup

| Surface | Primary actions | Proof / handoff |
| --- | --- | --- |
| `/plan` | Resume the next unfinished planning decision | Progress and last reviewed time |
| `/plan/wishes` | Save disposition, service, cultural, accessibility, sustainability, and communication wishes | Versioned preference snapshot |
| `/plan/people` | Name trusted people, alternates, and future participants | Invitation and acceptance audit |
| `/plan/documents` | Add document inventory and release conditions | Document record and visibility rule |
| `/plan/sharing` | Select recipient, categories, purpose, and duration | Consent grant or Transfer Pass |
| `/family` | See what changed and what needs action | Viewer-relative family briefing |
| `/family/people` | Invite, remove, and scope family participants | Membership and access history |

### 3. Hospice and anticipatory care

| Surface | Primary actions | Proof / handoff |
| --- | --- | --- |
| `/care` | See current readiness and next family/care action | Readiness status |
| `/care/team` | Confirm care location and approved contacts | Contact boundary |
| `/care/handoff` | Prepare a scoped care-to-funeral-home handoff | Care packet manifest |
| `/family/pass/new` | Choose recipient, scope, expiry, and review | Expiring token and consent snapshot |

### 4. At-need first response and Transfer Pass

| Surface | Primary actions | Proof / handoff |
| --- | --- | --- |
| `/start/situation` | Identify the person, current location, and timing | Urgent intake draft |
| `/start/people` | Confirm family coordinator and callback contact | Named contact and response expectation |
| `/start/next` | Take one next action or request human help | Callback or handoff commitment |
| `/family/pass` | Show/copy QR or manual code, inspect scope, revoke | Issued/viewed/revoked events |
| `/receive` | Enter code or scan QR | Token validation; no case mutation |
| `/receive/inspect` | Inspect sender, recipient, scope, expiry, and status | Inspection event |
| `/receive/destination` | Choose new or existing case and acknowledge | Destination choice |
| `/receive/receipt` | Confirm accepted record and owner | Acceptance receipt for both sides |
| `/director/intake` | Scan a walk-in QR, choose location and lead, create the case | Case, owner, source receipt, first commitment |
| `/director/intake/manual` | Create a minimal case when the family has no pass | Case plus missing-information queue |

Transfer Pass failures must be explicit: invalid, unauthenticated, wrong organization, expired, revoked, already accepted, duplicate case, or destination mismatch.

### 5. Funeral-home onboarding, organization, and locations

| Surface | Primary actions | Proof / handoff |
| --- | --- | --- |
| `/organization/start` | Name organization and select operating model | Organization created |
| `/organization/locations` | Add, edit, archive, and set location hours/contacts | Location audit |
| `/organization/team` | Invite employee, choose role, location, and case scope | Membership invitation |
| `/organization/roles` | Configure role templates and approval limits | Policy version |
| `/organization/routing` | Set intake destination, on-call rotation, and escalation | Routing rule |
| `/organization/templates` | Configure tasks, messages, packets, and service templates | Template version |
| `/organization/integrations` | Connect case, accounting, calendar, or communication systems | Connection and sync status |
| `/organization/integrations/mappings` | Map Passage case, person, document, and status fields | Versioned mapping |
| `/organization/integrations/jobs` | Inspect synchronized, queued, and failed records | Destination ID, retry, and exception proof |
| `/organization/audit` | Review access, changes, support sessions, and exceptions | Exportable audit evidence |

Organization setup is progressive. A single-location home can start with organization name, location, owner, and first director. Multi-location controls appear only when needed.

### 6. Director case operations

Director navigation: `Today · Cases · Decisions · Team · Partners`.

| Surface | Primary actions | Proof / handoff |
| --- | --- | --- |
| `/director` | Triage family wait, risk, blockers, ownership, and missing proof | Priority order and focus record |
| `/director/cases` | Search/filter by location, owner, status, risk, and next commitment | Saved view or assignment change |
| `/director/cases/[id]` | Orient from one concise case brief | Viewed state |
| `/director/cases/[id]/timeline` | Inspect every action, message, and proof | Immutable case activity |
| `/director/cases/[id]/team` | Assign director, employee, and location | Ownership event |
| `/director/cases/[id]/decisions` | Prepare options and request family decision | Decision request |
| `/director/cases/[id]/service` | Plan service, dependencies, participants, and readiness | Service plan and readiness proof |
| `/director/cases/[id]/costs` | Prepare transparent estimate and changes | Estimate version and acknowledgment |
| `/director/cases/[id]/documents` | Request, review, accept, or replace documents | Document status |
| `/director/cases/[id]/messages` | Message in task/case context | Recipient, delivery, reply, and related action |

### 7. Employee work

Employee navigation: `My work · Schedule · Messages`.

| Surface | Primary actions | Proof / handoff |
| --- | --- | --- |
| `/staff` | Choose or resume one owned commitment | Start state |
| `/staff/work/[id]` | Review minimum context, perform action, attach proof | Work event and proof |
| `/staff/schedule` | See commitments by time and location | Schedule acknowledgment |
| `/staff/messages` | Reply within the related case/task | Delivered message and next state |
| `/staff/work/[id]/blocker` | Name blocker, help needed, and escalation target | Blocker and director alert |

### 8. Vendor, cemetery, crematory, and service partners

Partner navigation: `Requests · Orders · Schedule · Messages`.

| Surface | Primary actions | Proof / handoff |
| --- | --- | --- |
| `/partner` | See new, negotiating, accepted, blocked, and due work | Partner queue state |
| `/partner/requests/[id]` | Inspect scope, deadline, delivery location, and contact | Request viewed |
| `/partner/requests/[id]/quote` | Accept price, counter, propose alternative, or decline | Quote version and response |
| `/partner/orders/[id]` | Confirm specifications, dates, dependencies, and responsible person | Order plan |
| `/partner/orders/[id]/messages` | Ask question without leaving request context | Thread and notified owner |
| `/partner/orders/[id]/proof` | Upload confirmation, invoice, image, permit, or completion proof | Proof returned for verification |
| `/partner/schedule` | See committed deliveries or disposition milestones | Schedule acknowledgment |

Partners never browse family records. Passage sends the minimum request context and provides a usable secure-link flow before requiring a full account.

### 9. Family decisions, tasks, status, and communication

Family navigation: `Today · Decisions · People · Service · Documents · Costs · More`.

| Surface | Primary actions | Proof / handoff |
| --- | --- | --- |
| `/case/[id]/today` | See changes, one next action, who owns what, and what happens next | View and acknowledgment |
| `/case/[id]/decisions` | Approve, decline, defer, or ask for help | Actor and decision timestamp |
| `/case/[id]/tasks` | Complete or delegate family work | Completion proof |
| `/case/[id]/messages` | Communicate in case/decision/task context | Delivery and reply status |
| `/case/[id]/service` | Review service plan and participant needs | Approval and readiness state |
| `/case/[id]/costs` | Understand selected, optional, changed, paid, and due items | Estimate/payment acknowledgment |

Communication is not a detached inbox. Every thread belongs to a case, task, decision, request, order, or proof. The record shows who is waiting and what message changes the state.

### 10. Service, disposition, and completion

| Surface | Primary actions | Proof / handoff |
| --- | --- | --- |
| `/case/[id]/service/plan` | Choose shape, schedule, accessibility, and participants | Service-plan version |
| `/case/[id]/service/participants` | Invite officiant, venue, contributors, and vendors | Invitation response |
| `/case/[id]/service/program` | Review and approve program/media/artwork | Approved proof |
| `/case/[id]/service/readiness` | Resolve dependencies before service | Readiness status |
| `/case/[id]/disposition` | Coordinate selected destination and timing | Receiving and completion proof |
| `/director/cases/[id]/closeout` | Verify all commitments and exceptions | Case closeout packet |

### 11. Estate administration

Estate navigation: `Today · Inventory · Responsibilities · People · Documents · Institutions`.

| Surface | Primary actions | Proof / handoff |
| --- | --- | --- |
| `/estate/start` | Accept invitation and establish the estate workspace | Role status |
| `/estate` | See obligations by deadline, dependency, and owner | Estate briefing |
| `/estate/inventory` | Add assets, accounts, property, debts, and subscriptions | Inventory history |
| `/estate/tasks` | Assign and complete administrative work | Completion proof |
| `/estate/documents` | Request, organize, and share selected files | Document status and grant |
| `/estate/institutions` | Generate bounded packets and monitor responses | Manifest, delivery, reference, response |
| `/professional/matters/[id]` | Collaborate with attorney or financial professional | Matter activity and filing proof |

### 12. Aftercare and archive

| Surface | Primary actions | Proof / handoff |
| --- | --- | --- |
| `/aftercare` | Choose support, reminders, communication cadence, and closure tasks | Opt-in preference |
| `/memories` | Invite and review legacy contributions | Attribution and review state |
| `/case/[id]/archive` | Export, archive, or remove collaborators | Export receipt and access-removal log |

## State machines

```text
case: planning → anticipatory → intake → arrangements → care_in_motion
      → service_ready → disposition_complete → aftercare → archived

commitment: draft → assigned → acknowledged → in_progress
            → blocked / awaiting_family / awaiting_partner
            → proof_submitted → verified → complete

decision: needed → options_ready → shared → viewed
          → approved / declined / deferred → superseded

transfer pass: draft → issued → viewed → accepted
                         ↘ expired
                         ↘ revoked

partner request: draft → sent → opened → negotiating → accepted
                 → in_progress → proof_returned → verified → closed

document: requested → uploaded → classified → reviewed
          → accepted / needs_replacement → shared by explicit grant
```

Every transition records actor, organization, location, timestamp, reason, related scope, generated notifications, and next expected action.

## Permission model

Effective access is the intersection of:

```text
identity × organization membership × location × case relationship × role
× explicit grant × data category × purpose × lifecycle state × time
```

Sensitive actions require stronger confirmation: issuing/revoking a pass, changing controllers, accepting a handoff, changing destination case, publishing guest information, approving estimates/payments, generating institution packets, exporting/archive, or elevating privileges.

Exact legal, medical, regulatory, privacy, retention, and authority claims remain behind the owner verification gate.

## Canonical demo spine

The next implementation batch must use one canonical family and one shared event history across every persona:

```text
Sofia Rivera / Rivera family
  → family issues PASS-RIVERA-7K4M
  → Northstar accepts into NS-2051
  → Elena Torres owns the next commitment
  → a staff member completes assigned work
  → a partner accepts one bounded order
  → family sees status and proof return
```

The same names, identifiers, status, owner, messages, and proof must propagate across the family, director, staff, partner, and receiving surfaces.
