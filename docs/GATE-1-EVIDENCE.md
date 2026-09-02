# Passage Authority Gate 1 evidence

**Evidence date:** August 28, 2026  
**Status:** Hosted vertical slice passed. Final post-revocation browser replay is pending a new authentication email after the provider rate window clears.

## Outcome proven in the isolated hosted Authority environment

A verified organization owner can:

1. request a one-time sign-in link;
2. create an isolated organization;
3. accept versioned evaluation terms, privacy notice, and authorized-use requirements;
4. select the New York financial POA template;
5. open the organization workspace;
6. create an expiring team invitation with a least-privilege role;
7. see the invitation and resulting access activity.

The invited operations teammate can:

1. open the secure invitation entry point;
2. sign in with the exact invited email address;
3. review the organization, role, and expiration;
4. accept access;
5. open only the receiving organization;
6. see no member-management controls.

The owner can then see the accepted teammate and the corresponding access event.

## Evidence chain

| Layer | Evidence | Result |
| --- | --- | --- |
| Browser action | Owner sign-in, organization setup, terms, template, team invite, recipient sign-in, recipient review, recipient acceptance, owner role change, and owner revocation | Passed in the optimized production build against hosted Supabase |
| Authenticated command | Organization, terms, template, invite, accept, role, and revoke commands derive the actor and organization from the verified session | Passed in database replay; invite and accept also passed in browser |
| Durable state | Organizations, memberships, invitations, acceptances, template selections, command receipts, and audit events persist in Postgres | Passed |
| Other-person visibility | The invited teammate opened the organization as operations staff; the owner saw the teammate and activation event | Passed |
| Negative boundary | Wrong recipient, cross-tenant reads, staff member management, stale version, last owner, revoked membership, and audit mutation | Passed in database replay. Revoked membership now also returns zero hosted authority records through RLS. |
| Independent replay | One script creates two organizations and four users, then replays positive and negative Gate 1 behavior | Passed with 11 named assertions and 9 audit events |

Sanitized machine evidence is stored at `work/evidence/gate1-database.json`. Invitation tokens are not written to that evidence.

## Verification results

| Check | Result |
| --- | --- |
| Gate 1 database replay | Passed |
| Supabase database lint for `public` and `authority_private` | No schema errors |
| Authority domain, hosted-input, persistence, and email tests | 22 passed |
| TypeScript | Passed |
| ESLint | Passed |
| Optimized Next.js build | Passed |
| Canonical authentication redirect replay | Passed on `http://127.0.0.1:3400/app` |
| Hosted owner role change | Passed in browser and database; staff changed to reviewer with one audit event |
| Hosted owner revocation | Passed in browser and database; reviewer changed to revoked with one audit event and zero visible authority records through RLS |
| Post-revocation browser denial | Pending because the hosted authentication provider rejected another email inside its rate window; no repeated send was attempted |
| Desktop owner workspace inspection | Passed |
| Desktop access-management inspection | Passed |

## Defects found and corrected before the pass

| Defect | User or system effect | Correction |
| --- | --- | --- |
| Deliberate stale-version errors used PostgreSQL serialization code `40001` | The gateway retried the expected denial until timeout | Expected stale denials now use a non-retryable application error |
| A missing membership produced `NULL NOT IN (...)` in the member-manager assertion | A revoked or missing member could pass the procedural guard even though row reads were denied | The guard now explicitly rejects a missing role before checking allowed roles |
| The confirmation route rebuilt the final redirect from Next.js internal host state | A successful one-time sign-in could land on `localhost` while its session cookie belonged to `127.0.0.1` | All confirmation outcomes now use the configured canonical application origin |
| The team page rendered `1 people` and showed mutation controls for the sole owner | The screen looked unfinished and invited an action the database would reject | Singular copy is correct and the sole owner is visibly protected |
| Next.js development controls intercepted a sidebar click during automation | A development-only overlay made the sign-out interaction unreliable | Browser UAT was moved to the optimized production build |

## Release closeout still open

- Replay the revoked member's direct `/app` request after a new approved authentication email can be issued. Expected result: the user sees the access-removed explanation and no organization or authority record information.
- Capture a real narrow-screen hosted browser pass.
- Harden authentication email delivery, CAPTCHA, and MFA before controlled real data or a commercial pilot.
- The general inventory tool flags RLS as disabled on two tables in the non-exposed `authority_private` schema. Direct privileges are revoked and the hosted security advisor reports no table exposure issue. Defense-in-depth RLS should be reviewed in the next security hardening migration without weakening the command functions.

Gate 2 may proceed because the durable revocation and row-level denial boundaries passed. The missing browser replay remains a named release closeout item, not a hidden pass.
