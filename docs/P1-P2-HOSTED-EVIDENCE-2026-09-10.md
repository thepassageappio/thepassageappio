# Hosted security and release evidence — September 10, 2026 UTC

Baseline: production /api/version matches GitHub main `42976b096b7569174f3b290419a20610ea3ea638` (PR #107). This continuation changed tests and documentation only.

Local verification: 161/161 domain tests pass after installing the unchanged frozen lockfile; new document links and git diff whitespace checks pass. No application source changed, so an application build was not rerun for these documentation/SQL-test edits.

## Executed evidence

| Check | UAT | Demo | Scope |
| --- | --- | --- | --- |
| Public routes and recovery copy | Pass | Pass | 44 routes and eight recovery states combined; HTTP/content checks |
| Existing reviewer boundary SQL | Pass | Pass | Creation/activation rejected, no changed state/events/invitations/usage |
| New public security boundary SQL | 14/14 pass | 14/14 pass | Authenticated role with synthetic JWT claims, anonymous ACL, MFA, role and organization denials |
| Existing terminal/recovery SQL | Pass | Pass | Consumed link, exact exchange replay, wrong participant role, stale version, reissue/old-session revocation, rejection replay, expiration and unchanged usage |
| Daily internal reconciliation | Clean day 2 | Clean day 2 | September 9–10; not live Stripe/HubSpot comparison |
| Security advisor | Four command warnings + password warning | Same | No RLS-disabled finding; 22 private tables have RLS without policies, informational default-deny posture |

The three SQL suites ran against each hosted database inside a transaction and rolled back. No fixture, invitation send, usage charge, decision, or changed membership survives. Terminal/recovery uses internal service functions for some assertions; it does not prove browser projections or real provider delivery.

Repeatable new evidence: [authority_public_security_boundary.sql](../supabase/tests/authority_public_security_boundary.sql). The existing [reviewer test](../supabase/tests/authority_reviewer_role_boundary.sql) and [terminal/recovery test](../supabase/tests/authority_terminal_and_recovery.sql) remain intact.

## Four SECURITY DEFINER warnings reviewed

| Public RPC | Purpose | Enforcement observed | Disposition |
| --- | --- | --- | --- |
| activate_authority_request_v1 | Atomic request activation and invitation preparation | Owner/admin AAL2; verified actor; active org membership; organization-scoped record; version and idempotency; reviewer coordination trigger rejects activation and rolls back prior writes | Intentional authenticated command, bounded review passed |
| reissue_participant_invitation_v1 | Rotate role-bound invitation/session and preserve send history | Owner/admin AAL2; verified actor; active org membership; record/invitation versions; replay protection | Intentional authenticated command, bounded review passed |
| review_evidence_artifact_v1 | Record institution evidence review | Owner/admin AAL2; verified actor; owner/admin/reviewer role; record/artifact versions and scope; replay protection | Intentional authenticated command, bounded review passed |
| get_authority_notification_status_v1 | Read delivery status without exposing invitation secrets | Verified actor; active owner/admin/staff/reviewer membership; record belongs to supplied org; returns status metadata, no token/email | Intentional read; AAL2 is not required by this read RPC |

All four deny anon EXECUTE and pin an empty search_path. Definer wrappers are not made invokers merely to silence the advisor: the private table grants intentionally prohibit direct browser access. The role check in the reviewer trigger is essential to activation denial and was exercised.

The new test covers owner and admin at AAL1 on all three mutations, a no-membership organization ID against all four commands, reviewer activation, one positive AAL2 notification read, and durable-state invariants. This is not a complete penetration test, revoked-session replay, positive replay of every mutation, or every cross-record artifact combination. The advisor will continue to flag the intentional command exposure; independent security review remains required for P2.

UAT catalog query additionally confirms **22 private tables / 22 RLS enabled / zero anon or authenticated table grants**. Do not weaken this posture by adding blanket policies to remove informational “no policy” notices. [Supabase RLS notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [authenticated definer notice](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Password protection remains open

Both advisors still report leaked-password protection disabled. UAT has 15 users with nonempty password hashes (aggregate count only; no hashes retrieved). A passwordless marketing UI does not establish that password authentication is irrelevant. Do not accept this warning as “not applicable.”

[Supabase password-security documentation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) says leaked-password protection requires Pro or above. The documented Free-plan/budget decision remains an owner dependency. Enable and test it after the plan decision, or obtain a documented, scoped alternative from the security owner. No plan, password, factor, or authentication setting was changed.

## Keyboard evidence and remaining presenter gate

Chrome production /start: Tab reached brand, Security, Your name, Work email, and the submit button in order. Enter on the empty submit button produced required-field guidance and focused Work email without sending. Fields have distinct accessible labels. The browser's 1Password UI appeared at fields and Escape dismissed it.

This closes only the evaluation-entry traversal check. No authenticated sessions survived from the prior task. Full onboarding consent traversal, authenticated keyboard/accessibility, timed independent-profile presentation, receipt projection for terminal cases, deterministic inbox delivery, and a sanitized backup recording remain open. Prior 360px/390px results remain recorded evidence; they were not rerun here.

## Gate decision

The persona matrix and original MFA/RLS regression remain passed. The bounded hosted command-security review and hosted terminal/recovery database replay are now recorded. P1 and P2 are **not closed**. This file releases no outbound, LinkedIn, nurture, buyer demo, real data, or live payment.
