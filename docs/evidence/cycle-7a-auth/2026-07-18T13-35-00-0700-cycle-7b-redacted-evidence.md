# Cycle 7B hosted operating-loop evidence (redacted)

Recorded: 2026-07-18 13:35 -07:00

Scope: Vercel Preview deployment `dpl_5jaw5SMPekKLEPbzzRgjRJePiKMW` for branch `greenfield/passage-zero` and isolated Supabase project `uyacxqtsiwlvtmhxvoxr` only. Production Supabase `qsveqfchwylsbncsfgxe`, production Vercel configuration, family access, vendors, pricing, and external delivery were not used or changed. Passwords, browser storage, private share URLs, raw invitation credentials, and service credentials are omitted.

## Preserved Cycle 7A boundary

Immediately before the Cycle 7B fixture, the isolated manifest was re-read as exactly one organization, one location, two active memberships, two active location grants, one accepted invitation, one invitation-location row, two invitation command events, zero workflows, and zero tasks. The Cycle 7B fixture was then applied once. It produced exactly two workflows and three tasks and retained the accepted-invitation proof.

## Hosted operating story

- A verified director saw three durable Portland commitments, assigned one previously unowned commitment to the accepted staff member, and received a server-authored receipt.
- The staff member used an independent deployment hostname and browser storage context, saw only the one assigned commitment, started it, and retained `in_progress` after reload.
- Director Activity showed one assignment event and one start event with actor, location, previous/next state, server time, proof reference, and authorized-team visibility.
- The director reassigned the in-progress commitment to the alternate Portland staff member. The former assignee then saw zero work after reload.
- The director created and revoked a separate pending invitation. The accepted Cycle 7A invitation was not modified.
- After active work had been reassigned away, the director revoked the accepted staff membership. The former staff session then rendered `Workspace access remains closed` and disclosed no funeral-home work.
- The final durable manifest contains two invitations (one accepted, one separately revoked while pending), two active memberships (director and alternate staff), one revoked staff membership and revoked location grant, two workflows, three tasks, and eight append-only events.

## Final cardinality and redacted event ledger

| Durable projection | Final count |
| --- | ---: |
| Organizations / locations | 1 / 1 |
| Invitations: accepted / revoked pending | 1 / 1 |
| Active memberships / revoked memberships | 2 / 1 |
| Active location grants / revoked location grants | 2 / 1 |
| Workflows / tasks | 2 / 3 |
| Append-only events | 8 |

| Redacted proof handle | Semantic event kind | Count for durable event ID / idempotency key |
| --- | --- | ---: |
| E1 | `organization_invitation.created` (accepted invitation) | 1 / 1 |
| E2 | `organization_invitation.accepted` | 1 / 1 |
| E3 | `task.assigned` | 1 / 1 |
| E4 | `task.started` | 1 / 1 |
| E5 | `task.reassigned` | 1 / 1 |
| E6 | `organization_invitation.created` (separate pending invitation) | 1 / 1 |
| E7 | `organization_invitation.revoked` | 1 / 1 |
| E8 | `organization_member.revoked` | 1 / 1 |

The eight stable database event UUIDs and command idempotency keys were inspected for uniqueness and replay identity, then replaced by redacted handles E1-E8 here. No raw identifier is required to reproduce the cardinality or authority finding, and no retry added a ninth event.

## Replay, conflict, denial, and append-only proof

- Assignment, start, reassignment, and member-revocation replays returned the original receipt with `replayed = true`; every idempotency key retained exactly one event.
- A conflicting assignment replay returned SQLSTATE `22023`; a stale start returned `40001`; a conflicting reassignment replay returned `22023`. None added an event.
- Former-assignee, unassigned-user, wrong-location, wrong-organization, and revoked-user commands returned `42501`. Unauthorized workload projections returned zero rows, and the rollback-only wrong-scope probes created zero events.
- Direct authenticated event insertion and direct event update/delete attempts returned `42501`. The eight-event Activity spine remained unchanged.
- The repository Cycle 7B rollback SQL suite passed against the isolated project. The older Cycle 7A SQL file is explicitly local-fixture dependent and correctly refused standalone hosted execution; its transaction rolled back. Its hosted invitation/acceptance/replay/cardinality equivalent was already proven in Cycle 7A.

## Responsive and runtime evidence

- `2026-07-18T13-30-00-0700-cycle-7b-activity-1440.jpg`, `...-390.jpg`, and `...-360.jpg` preserve the final read-only Activity projection. They are genuine JPEG/JFIF page-content captures encoded at 1425 x 891, 375 x 812, and 345 x 767 while the browser viewports were configured to 1440 x 900, 390 x 844, and 360 x 800 respectively. Browser chrome/scrollbar account for the difference; file dimensions are not presented as viewport dimensions.
- `/director`, `/director/team`, and `/director/activity` passed at 1440 x 900, 390 x 844, and 360 x 800. At every route/size, document scroll width equaled client width, visible application controls were at least 48 pixels, functional typography resolved to Montserrat, and the primary heading resolved to Cormorant Garamond.
- The revoked-user denial passed at 390 x 844 and 360 x 800 plus the browser's 1280 x 720 desktop surface, with no overflow and 48-pixel actions.
- Browser console warning/error logs were empty. Vercel returned no grouped runtime errors and no deployment-scoped error, warning, or fatal logs; the reviewed deployment window contained 217 status-200 responses and 36 status-204 responses, with no 4xx/5xx response.

## Automated gates and advisories

- Frontend/backend parity passed 11/11, including the accepted/revoked invitation projection regression. Server Action exports passed with ten prohibited fixtures rejected.
- Runtime configuration isolation, operational route matrix, all 16 deploy-gate cases, TypeScript, and the optimized Next.js build passed.
- Supabase security advisors reported one expected isolated-lab warning: leaked-password protection is disabled while public providers and external delivery remain disabled. Performance advisors reported informational unused indexes on newly exercised lab paths. No RLS or exposed-write advisory was returned.
- The wrong-location and wrong-organization probes were rollback-only and left both durable state and event count unchanged. Former, unassigned, and revoked personas each read zero tasks/workflows after denial. Conflicting/stale commands likewise had no partial effect.
- Funeral-home readiness remains 94% guided / 40% operational. D2C remains 85% guided / 25% operational. This is beta operating-loop evidence, not pilot-operational or full-production approval.
