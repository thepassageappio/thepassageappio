# Passage Authority implementation traceability

**Version:** 1.0  
**Date:** August 27, 2026  
**Depends on:** `PRODUCT-SOURCE-OF-TRUTH.md`

This document is the build checklist. A feature is not complete when a screen exists. It is complete only when the initiating action, durable result, event, receiving-person effect, receipt, negative tests, and independent replay all agree.

## 1. Vertical slice map

| Slice | Use cases | Screens | Server boundary | Durable result | Receiving effect | Required proof |
| --- | --- | --- | --- | --- | --- | --- |
| S-01 Commercial discovery | CV-01 through CV-08 | W-01 through W-08 | Public read only; pilot form submission | Lead or evaluation start only after explicit submit | Confirmation page and approved internal notification | Navigation, copy, forms, mobile, accessibility, no unsupported claims |
| S-02 Owner authentication | OA-01, OA-02 | O-01 through O-04 | `request_sign_in`, `confirm_sign_in`, `create_organization`, `accept_terms` | User, session, organization, owner membership, acceptance event | Owner can open organization workspace | Expired link, reused link, wrong email, versioned terms, cross-tenant denial |
| S-03 Team membership | OA-03, OA-08 | I-07 | `invite_member`, `accept_member_invitation`, `change_member_role`, `revoke_member` | Membership and append-only access events | Invited staff can access only authorized organization | Duplicate, expiry, revocation, last-owner protection, role escalation denial |
| S-04 Draft request | IR-01 through IR-04 | I-02, I-03 | `create_draft`, `update_draft`, `preview_draft` | Draft record, selected immutable policy version, no usage debit | No participant receives access yet | Draft restart, duplicate warning, validation, no invitation, no trial clock |
| S-05 Activation and trial | IR-05, OA-05 | I-03, I-09 | `activate_request` | Activated time, one usage event, trial start if first, participant invitations, lifecycle event | Principal receives a secure invitation | Five allowed, sixth blocked, resend free, expired trial behavior, atomic rollback |
| S-06 Principal grant | P-01 through P-05, P-09 | H-01 through H-04, H-10 | `exchange_invitation`, `confirm_grant`, `decline_grant`, `request_fresh_link` | Participant session, consent or decline event | Representative becomes actionable only after confirmation | Forward, reuse, expiry, session revoke, role denial, no inferred consent |
| S-07 Representative responsibility | R-01, R-02 | H-01, H-02, H-05 | `exchange_invitation`, `accept_responsibility`, `decline_responsibility` | Acceptance artifact or terminal decline event | Institution queue and principal status update | Wrong role, decline reason, duplicate submit, stale version |
| S-08 Evidence collection | R-03 through R-07 | H-06, H-07 | `create_upload`, `complete_upload`, `save_finding_review`, `complete_requirement` | Private artifact, provider result, finding review, requirement event | Reviewer sees source-linked result, not a legal-validity claim | MIME, size, malware state, provider failure, identity mismatch, storage policy denial |
| S-09 Disclosure and submit | R-08 | H-08 | `create_disclosure_preview`, `submit_assessment` | Consent snapshot, disclosure receipt, submitted event | Reviewer receives review work and email | Missing consent, changed packet, stale version, minimum fields only |
| S-10 Information request | IR-09, R-09 | I-04, I-05, H-09 | `request_information`, `respond_to_information` | Requirement-linked request, response, evidence, events | Representative receives exact request; reviewer sees response | Duplicate open request, resolved request, wrong requirement, role denial |
| S-11 Institution decision | IR-07, IR-08, IR-10 | I-04, I-05 | `record_decision` | Decision, accepted scope, limits, policy version, event | Principal and representative receive matching receipt | Reason required, limited outcome needs limits, policy snapshot immutable, stale decision denied |
| S-12 Receipt and lifecycle | P-06 through P-08, IR-11, R-10, R-11 | H-10, H-11, I-06 | `revoke_authority`, `withdraw_responsibility`, `expire_authority`, `export_receipt` | Current lifecycle status and append-only history | All authorized people and integration update | Revocation during review, expiry, withdrawal, old session, export authorization |
| S-13 Integration | D-01 through D-05 | D-01 through D-04, I-10 | Versioned REST commands, webhook delivery, replay, credential rotation | API request IDs, events, deliveries, attempts, key events | Customer endpoint receives signed event | Signature, retry, dedupe, ordering, endpoint failure, rotated key denial |
| S-14 Billing and entitlement | OA-05 through OA-07 | I-09, W-04 | `create_billing_session`, Stripe webhook, portal session | Billing event, customer mapping, entitlement state | Organization activation limit changes only after confirmation | Redirect spoof, invalid signature, duplicate event, failed payment, cancellation, reconciliation |
| S-15 Audit and support | OA-10, A-01, A-02 | I-11, I-06 | `list_audit_events`, `export_audit`, `start_support_session` | Read-only access and export events | Authorized auditor sees complete chain | Support cannot decide, export scope, access logging, revoked auditor |

## 2. Screen interaction contract

### W-01 Homepage

| Element | Behavior | Destination or result | Failure behavior |
| --- | --- | --- | --- |
| Product navigation | Opens real public route in same tab | Selected page | No dead links or placeholder route |
| Try free | Starts O-01 | `/start` | Product remains browsable if authentication provider is unavailable |
| Watch demonstration | Opens fictional demo introduction | `/demo` | Never routes into real-data workspace |
| Active template | Opens template detail | `/templates/financial-poa-new-york` or selected final route | Future templates remain visibly unavailable |
| Pricing offer | Opens W-04 | `/pricing` | Current approved prices only |
| Security link | Opens W-05 | `/security` | No unsupported certification language |
| Sign in | Opens O-01 in returning-user mode | `/start?intent=sign-in` | Does not create a second organization automatically |

### W-04 Pricing

| Element | Behavior | Destination or result | Failure behavior |
| --- | --- | --- | --- |
| Try 5 real requests free | Opens O-01 | No card requested | If already signed in, opens onboarding or I-01 based on state |
| Request founding pilot | Opens qualified pilot form | W-08 | Does not grant pilot entitlement |
| Annual relationship | Opens sales contact with current organization context when signed in | W-08 or I-09 | Does not create subscription automatically |
| Pricing detail disclosure | Explains transaction count and trial clock | Inline readable content | No hidden critical limits |

### O-01 Start and sign in

| Element | Behavior | Command | Durable result | Failure behavior |
| --- | --- | --- | --- | --- |
| Work email | Validates format and normalization | None until submit | None | Field-specific message, input preserved |
| Continue | Requests one secure sign-in link | `request_sign_in` | Rate-limited auth attempt and provider result | Generic response prevents account enumeration |
| Privacy and terms links | Open readable current documents | Public read only | None | No forced loss of form state |

### O-03 Organization setup

| Element | Behavior | Command | Durable result | Failure behavior |
| --- | --- | --- | --- | --- |
| Organization fields | Collect legal or operating identity | None until submit | None | Required fields identify correction |
| Address | Provider-assisted search with manual option | Optional validation boundary | Parsed and display values saved separately | Manual entry always available |
| Authorized-use checkbox | Requires affirmative authority | `create_organization` | Organization, owner membership, attestation event | No organization created if unchecked |
| Continue | Creates one organization idempotently | `create_organization` | Owner workspace identity | Duplicate domain or name is reviewed, not silently merged |

### O-04 Terms and privacy

| Element | Behavior | Command | Durable result | Failure behavior |
| --- | --- | --- | --- | --- |
| Terms link | Opens exact version | Read only | None | Current form state retained |
| Privacy link | Opens exact version | Read only | None | Current form state retained |
| Data-use attestation | Confirms only authorized real data will be submitted | `accept_terms` | User, organization, document versions, time, IP or request context per policy | Real-data activation remains locked until complete |

### I-01 Institution home

| Element | Behavior | Destination or command | Durable result | Failure behavior |
| --- | --- | --- | --- | --- |
| Start a request | Opens template-backed draft flow | I-02 | None until save | If limit reached, draft remains available and activation limit is explained later |
| Trial meter | Reads entitlement and usage events | I-09 | None | Never calculated from browser storage |
| Queue row | Opens authorized record | I-04 | Optional access event | Unauthorized or missing record is not disclosed |
| Search and filters | Filter server-authorized result set | Query parameters | None | Empty state explains next action |
| Review action | Opens reviewer context | I-04 | None | Only shown for allowed reviewer |

### I-02 Request setup

| Step | Inputs | Save behavior | Validation | Exit behavior |
| --- | --- | --- | --- | --- |
| Template | Active policy template and version | Saves immutable version reference | Only published, allowed template | Back to template gallery |
| People | Principal and representative name and email | Saves normalized party records | Valid email, distinct roles, duplicate warning | Save and leave |
| Scope | Account boundary, allowed actions, end date | Saves exact selected actions and prohibitions | At least one supported action, future end date | Save and leave |
| Review | Full summary and participant message previews | No mutation until send | Current draft version | Back to any prior step |

### I-03 Preview and activate

| Element | Behavior | Command | Durable result | Receiving effect |
| --- | --- | --- | --- | --- |
| Edit links | Return to exact draft step | None | None | None |
| Participant preview tabs | Show role-specific message and next step | None | None | None |
| Usage consequence | Shows request number and trial start consequence | Server read | None | None |
| Send secure invitations | Atomically checks entitlement, activates, counts, creates invitations and event | `activate_request` | One usage event and activation event | Principal email send is queued |
| Resend | Reissues current role invitation without usage debit | `resend_invitation` | Old unused invitation revoked, new invitation stored | New secure email queued |

### H-01 Secure invitation introduction

| Element | Behavior | Command | Durable result | Failure behavior |
| --- | --- | --- | --- | --- |
| Continue securely | Exchanges valid token for participant session | `exchange_invitation` | Invitation accepted and session issued | Expired, revoked, used, or invalid link shows safe recovery |
| How information is used | Opens role-specific data explanation | Read only | None | No token appears in analytics or referrer |
| Get help | Starts safe support path | Support request | Request record without evidence content | No institution or other participant data exposed |

### H-04 Principal grant

| Element | Behavior | Command | Durable result | Receiving effect |
| --- | --- | --- | --- | --- |
| Allowed and prohibited lists | Always visible before decision | Read only | None | None |
| Confirm checkbox | Requires explicit understanding | Part of `confirm_grant` | Consent snapshot text version | None until submit |
| Confirm request | Records grant | `confirm_grant` | Requirement, consent, event, version | Representative invitation becomes actionable and notification queues |
| Decline | Opens reason and consequence confirmation | `decline_grant` | Terminal state and event | Institution and representative status update |
| Leave and return | Saves no implied choice | None | Current state unchanged | Secure resume is available |

### H-05 Representative responsibility

| Element | Behavior | Command | Durable result | Receiving effect |
| --- | --- | --- | --- | --- |
| Accept responsibility | Requires duties acknowledgment | `accept_responsibility` | Acceptance artifact and event | Evidence checklist unlocks |
| Decline | Requires reason and explicit confirmation | `decline_responsibility` | Terminal event | Principal and institution notified |
| Scope summary | Remains visible | Read only | None | None |

### H-06 Requirement list

| Element | Behavior | Destination or command | Durable result | Failure behavior |
| --- | --- | --- | --- | --- |
| Continue next task | Opens first available incomplete task | H-07 or provider flow | None | Explains external provider outage and safe retry |
| Completed task | Opens read-only result and provenance | Requirement detail | Optional access event | Cannot be edited without explicit correction flow |
| Why required | Expands policy-authored reason | Read only | None | Never shows internal key |
| Get help | Opens task-specific help | Support or policy content | None | Does not mark task complete |

### H-07 Evidence task

| Element | Behavior | Command | Durable result | Failure behavior |
| --- | --- | --- | --- | --- |
| Upload | Obtains constrained upload target, then sends file | `create_upload`, storage upload, `complete_upload` | Artifact with scan state | Invalid type or size blocked before processing |
| Provider verification | Opens selected hosted provider flow | Provider session command | Provider reference only until callback | Exit or failure remains incomplete |
| Finding review | Confirms or flags each sourced fact | `save_finding_review` | Human review state and correction history | Unsupported correction requires reviewer path |
| Save and continue | Completes requirement only when accepted method succeeds | `complete_requirement` | Requirement event | No false completion on provider or storage failure |

### H-08 Review and share

| Element | Behavior | Command | Durable result | Receiving effect |
| --- | --- | --- | --- | --- |
| Recipient, purpose, fields | Generated from current record version | Read only | Preview hash or version | None |
| View source detail | Opens authorized evidence detail | Read only | Optional access event | Private raw document never attached to email |
| Consent checkbox | Captures explicit permission for listed disclosure | Part of submit command | Exact text version | None until submit |
| Submit | Revalidates packet and version | `submit_assessment` | Consent, disclosure receipt, submitted event | Reviewer receives work item and notification |

### I-04 Reviewer workspace

| Element | Behavior | Destination or command | Durable result | Failure behavior |
| --- | --- | --- | --- | --- |
| Requirement row | Opens result, provider, source, time, and review state | Detail panel or route | Optional access event | Missing source remains visible as incomplete |
| Document preview | Opens short-lived authorized view | `create_document_view` | Access event | Expired URL or wrong role denied |
| Request information | Opens I-05 in request mode | None until submit | None | Only current review state allows action |
| Record decision | Opens I-05 in decision mode | None until submit | None | Blocked if mandatory institution conditions remain incomplete |
| Receipt | Opens I-06 | Read only | None | Current status always visible |

### I-05 Information request and decision

| Mode | Inputs | Command | Durable result | Receiving effect |
| --- | --- | --- | --- | --- |
| Request information | Requirement, plain request, due context if policy uses it | `request_information` | Open request and event | Representative receives exact task |
| Accept | Reason and acknowledgment | `record_decision` | Accepted decision and event | Matching receipt and notices |
| Accept with limits | Reason, explicit limits, accepted actions, acknowledgment | `record_decision` | Limited decision and event | Matching receipt and notices |
| Reject | Reason and acknowledgment | `record_decision` | Rejected decision and event | Matching receipt and notices |

### H-11 and I-06 Receipt

| Element | Behavior | Command | Durable result | Failure behavior |
| --- | --- | --- | --- | --- |
| Current status | Reads canonical lifecycle | None | None | Never cached past revocation without revalidation |
| Download | Creates authorized point-in-time export | `export_receipt` | Export event and immutable file reference if retained | Wrong role denied |
| Revoke | Principal sees consequence and confirms | `revoke_authority` | Revocation event and current state | Stale or already ended request denied safely |
| Evidence references | Show minimum necessary references by role | Read only | Optional access event | Private fields filtered server side |

### I-09 Usage and billing

| Element | Behavior | Command | Durable result | Failure behavior |
| --- | --- | --- | --- | --- |
| Usage meter | Reads entitlement and activation usage | Read only | None | No browser-side counter |
| Request pilot | Starts qualified pilot path | `request_pilot` | Commercial request, not entitlement | No product upgrade until payment confirmation |
| Pay invoice or checkout | Opens Stripe-hosted payment surface | `create_billing_session` | Pending billing session | Cancel returns to pending or current plan |
| Manage billing | Opens Stripe portal for authorized owner | `create_portal_session` | Optional audit event | Non-owner denied |
| Payment status | Reads processed Stripe events | Read only | None | Redirect does not mark paid |

### I-10 and D-03 Integration

| Element | Behavior | Command | Durable result | Failure behavior |
| --- | --- | --- | --- | --- |
| Add endpoint | Validates HTTPS destination and sends challenge if required | `create_webhook_endpoint` | Endpoint and verification state | Unverified endpoint receives no live events |
| Reveal secret | Shows once to authorized developer | `rotate_webhook_secret` | Key event | Secret never stored in browser state or logs |
| Delivery row | Shows event, record version, attempt, response, next retry | Read only | None | Sensitive payload fields redacted by role |
| Replay | Requeues failed or terminally retryable delivery idempotently | `replay_webhook` | New attempt event | Delivered event cannot be duplicated by repeated click |

## 3. State and action table

| State | Current owner | Visible primary action | Allowed commands | Forbidden examples |
| --- | --- | --- | --- | --- |
| Draft | Organization creator or assignee | Review and send | update draft, activate, cancel draft | principal grant, representative evidence, decision |
| Awaiting principal | Principal | Review and confirm | confirm, decline, resend by authorized staff, cancel by policy | representative accept, reviewer decide |
| Awaiting representative | Representative | Accept or decline | accept, decline, revoke by principal | evidence submit before acceptance, reviewer decide |
| Evidence required | Representative | Continue next requirement | complete allowed requirement, withdraw, revoke | submit incomplete packet, reviewer decide |
| Ready to submit | Representative | Review and submit | submit, withdraw, revoke | change immutable policy, reviewer decide before submit |
| Under review | Reviewer | Review and decide | request information, decide, withdraw, revoke | participant edits disclosed packet silently |
| Information requested | Representative | Respond | respond, withdraw, revoke | second independent decision, silent requirement rewrite |
| Accepted | No routine owner | View receipt | revoke, withdraw, expire | expand scope without new request |
| Accepted with limits | No routine owner | View receipt | revoke, withdraw, expire | remove limits without new decision version |
| Rejected | Complete | View receipt | export only | reopen by editing history |
| Declined | Complete | View receipt | export only | treat click as later acceptance |
| Withdrawn | Complete | View receipt | export only | representative action under old scope |
| Revoked | Complete | View receipt | export only | stale session action |
| Expired | Complete | View receipt | export only | action under expired scope |

## 4. Data-to-interface language map

Human-facing product copy must use the right column. Developer and audit surfaces may show the internal value alongside the human label when necessary.

| Internal value | Human label |
| --- | --- |
| `principal` | Person granting authority |
| `representative` | Representative |
| `reviewer` | Institution reviewer |
| `awaiting_principal` | Waiting for the person granting authority |
| `awaiting_representative` | Waiting for the representative |
| `evidence_required` | Requirements in progress |
| `ready_to_submit` | Ready to send for review |
| `under_review` | Institution review |
| `information_requested` | More information requested |
| `accepted` | Accepted |
| `accepted_with_limits` | Accepted with limits |
| `rejected` | Not accepted |
| `declined` | Request declined |
| `withdrawn` | Representative withdrew |
| `revoked` | Revoked |
| `expired` | Expired |
| `authority_record` | Authority request |
| `evidence_artifact` | Evidence result or document, based on type |
| `policy_version` | Institution policy version |
| `disclosure_receipt` | Information-sharing receipt |
| `webhook_delivery` | Integration event delivery |
| `entitlement` | Plan and access |
| `usage_event` | Activated request |

## 5. Release evidence record

Every slice release record must include:

- deployed commit identifier;
- environment and Authority database project identifier;
- tested account and organization IDs;
- tested record and invitation IDs with secrets removed;
- browser screenshots at decision points;
- server request IDs;
- database assertions before and after the action;
- event IDs and sequence numbers;
- email provider message and delivery IDs;
- storage object and access-policy assertions when applicable;
- Stripe test event, customer, invoice, payment, and entitlement IDs when applicable;
- receiving-person screenshots and successful action;
- receipt comparison;
- independent replay output;
- negative-path results;
- responsive, accessibility, network, and console results;
- known limitations and owner-approved exceptions.

## 6. No-build checklist

Do not begin a slice when any answer is no:

- Is the use case listed in the product source of truth?
- Is the persona and access mode explicit?
- Is there one primary action?
- Is the server command named?
- Is the durable state change defined?
- Is the event defined?
- Is the receiving-person effect defined?
- Is entitlement behavior defined?
- Are failure, retry, idempotency, stale-version, and authorization behaviors defined?
- Is human-facing copy free of implementation language?
- Is the full verification chain defined?

Do not mark a slice complete when any required release evidence is missing.
