# Sample workflow access decision

**Decision:** the marketing `Explore a sample workflow` action is a lead-generation gate, but it must not create an institution Owner or require privileged MFA.

## Correct journey

```text
Explore a sample workflow
  -> configured sign-in method (production currently uses a one-time email link)
  -> explicit “Agree and view sample” email and nurture opt-in
  -> append-only consent, attribution, and held nurture-enrollment events
  -> durable HubSpot Contact outbox job
  -> authenticated sample viewer with no organization membership
  -> read-only fictional four-persona workflow
  -> book a guided walkthrough or deliberately create an institution workspace
```

Creating an institution workspace is a separate action. A new workspace gives its creator the Owner role, and the Owner must enroll an authenticator before entering `/app` because that role can manage policy, team access, billing, and authority requests.

The sample viewer may open `/sample` at AAL1 because the route contains fixed fictional content, performs no mutation, exposes no organization or participant data, and grants no organization capability. A signed-in Owner at AAL1 may also view the sample without satisfying the `/app` MFA gate; the sample does not let that Owner execute a privileged command.

## Lead-generation truth

Authentication alone is not permission for sales or marketing contact. After authentication, Passage presents a separate, required email opt-in that expressly names a short sample follow-up series, product updates, and a walkthrough invitation. The `Agree and view sample` action records the verified Auth user, exact consent version, source path, timestamp, and hashed email in an append-only private record. The same transaction appends the consent and nurture-enrollment events and queues an idempotent HubSpot Contact projection before the sample unlocks.

The canonical acquisition code is `website_sample_gated`; HubSpot also receives the readable label `Website - Gated Sample`, the source path, consent version, nurture program `sample_evaluator`, and nurture status `held_until_p1_p2`. When the verified email already belongs to a Contact, Passage adds only its own lead fields and preserves the existing name and email. It does not invent an institution, Company, Deal, or Ticket. A later commercial-inquiry form can collect and project those facts when the viewer supplies them. Authority records and participant data are prohibited from this payload.

The Passage event ledger is the enrollment source of truth. Both events and the HubSpot projection name privacy notice `evaluation-2026.2`. HubSpot Workflows are unavailable in the current free portal, and the standing commercial gate prohibits buyer outreach until P1 and P2 both close. Enrollment is therefore recorded immediately while delivery remains held. Activating the series requires a later controlled release that supplies the send mechanism, unsubscribe handling, suppression checks, and delivery evidence. Consent version `sample-access-contact-2026.2` applies only to new consent revisions; prior `2026.1` records remain unchanged and do not silently acquire the broader nurture meaning.

A later analytics increment may record a privacy-reviewed `sample_viewed` product event with source attribution and aggregate conversion reporting. It must remain separate from authority records and must not include participant or authority data.

## Acceptance evidence

Executed September 8: the complete local email-authenticated flow reached the explicit consent screen, recorded one consent/event/outbox transaction, and opened `/sample`. The 390px Chrome replay had no console errors; a two-pixel shared marketing-header overflow found during the run was corrected and rechecked at zero document overflow. The migrations were applied to UAT and Demo, including append-only consent revisions and a current-version access check.

The hosted production replay then recorded `PAS-00000001`. Its first HubSpot attempt exposed a real duplicate-email edge case because the viewer already existed as Contact `535676541644`. PR #100 added email identity resolution and a service-only audited retry. Production served exact `main` SHA `b9dbcbea693ebdcd9263502aa16ba740b6a77015`; the retry applied on attempt 2 and the HubSpot record showed the expected Passage reference, consent version, source, and prospect key. Existing identity fields remained intact, with zero associated Deals and zero Tickets from the sample action.

Production UAT's Supabase Google provider is disabled as of this checkpoint. The live production path is the one-time email link. Google OAuth is enabled and previously proven in Demo, but it is not yet production evidence.

- Every marketing link labeled `sample workflow` routes to `/sample`.
- An unauthenticated `/sample` visit reaches `/start?intent=sample&next=/sample`.
- The sample gate leads with Google only when Google OAuth is configured; production currently uses the one-time email path.
- Successful sign-in returns to `/sample`, not organization onboarding.
- A first-time authenticated viewer reaches `/sample/access` and must explicitly opt in before the sample opens.
- The opt-in creates one append-only private consent record per Auth user and consent version, separate consent and nurture-enrollment ledger events, and one idempotent HubSpot Contact outbox job.
- The nurture-enrollment event carries canonical gated-sample attribution and a P1/P2 delivery hold.
- HubSpot exposes both the readable source label and stable source code, plus the source path, nurture program, nurture status, and governing consent version.
- The held series and controlled activation rules are defined in [SAMPLE-EVALUATOR-NURTURE-SERIES-2026-09-08.md](./SAMPLE-EVALUATOR-NURTURE-SERIES-2026-09-08.md).
- A returning viewer opens `/sample` without repeating the gate only while their saved consent version matches the currently required version.
- `/sample` requires an authenticated, consented user but no organization, role, or AAL2 session.
- `/sample` is dynamic, private/no-store, and `noindex`.
- The sample contains fictional read-only content and no mutation controls.
- Starting or entering an Owner/Admin institution workspace continues to require the existing MFA policy.
- Desktop and mobile browser checks pass without overflow, console errors, or misleading claims.
