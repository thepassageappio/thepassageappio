# Sample workflow access decision

**Decision:** the marketing `Explore a sample workflow` action is a lead-generation gate, but it must not create an institution Owner or require privileged MFA.

## Correct journey

```text
Explore a sample workflow
  -> Google sign-in (primary) or one-time email link
  -> explicit “Agree and view sample” contact opt-in
  -> append-only consent record and durable HubSpot Contact outbox job
  -> authenticated sample viewer with no organization membership
  -> read-only fictional four-persona workflow
  -> book a guided walkthrough or deliberately create an institution workspace
```

Creating an institution workspace is a separate action. A new workspace gives its creator the Owner role, and the Owner must enroll an authenticator before entering `/app` because that role can manage policy, team access, billing, and authority requests.

The sample viewer may open `/sample` at AAL1 because the route contains fixed fictional content, performs no mutation, exposes no organization or participant data, and grants no organization capability. A signed-in Owner at AAL1 may also view the sample without satisfying the `/app` MFA gate; the sample does not let that Owner execute a privileged command.

## Lead-generation truth

Authentication alone is not permission for sales or marketing contact. After authentication, Passage presents a separate, required contact opt-in. The `Agree and view sample` action records the verified Auth user, exact consent version, source path, timestamp, and hashed email in an append-only private record. The same transaction appends a commercial event and queues an idempotent HubSpot Contact projection before the sample unlocks.

The HubSpot projection creates or updates a Contact with the source `sample_workflow`. It does not invent an institution, Company, Deal, or Ticket. A later commercial-inquiry form can collect and project those facts when the viewer supplies them. Authority records and participant data are prohibited from this payload.

A later analytics increment may record a privacy-reviewed `sample_viewed` product event with source attribution and aggregate conversion reporting. It must remain separate from authority records and must not include participant or authority data.

## Acceptance evidence

Executed September 8: the complete local email-authenticated flow reached the explicit consent screen, recorded one consent/event/outbox transaction, and opened `/sample`. The 390px Chrome replay had no console errors; a two-pixel shared marketing-header overflow found during the run was corrected and rechecked at zero document overflow. The migration was then applied to UAT and Demo, where the table, service-only grants, and sample-aware HubSpot claim were queried directly. Both hosted tables began with zero sample leads. Passage HubSpot credentials and real Contact replay remain separate open provider evidence.

- Every marketing link labeled `sample workflow` routes to `/sample`.
- An unauthenticated `/sample` visit reaches `/start?intent=sample&next=/sample`.
- The sample gate leads with Google when Google OAuth is configured and retains one-time email as a fallback.
- Successful sign-in returns to `/sample`, not organization onboarding.
- A first-time authenticated viewer reaches `/sample/access` and must explicitly opt in before the sample opens.
- The opt-in creates one append-only private consent record per Auth user, one commercial ledger event, and one idempotent HubSpot Contact outbox job.
- A returning consented viewer opens `/sample` without repeating the gate.
- `/sample` requires an authenticated, consented user but no organization, role, or AAL2 session.
- `/sample` is dynamic, private/no-store, and `noindex`.
- The sample contains fictional read-only content and no mutation controls.
- Starting or entering an Owner/Admin institution workspace continues to require the existing MFA policy.
- Desktop and mobile browser checks pass without overflow, console errors, or misleading claims.
