# Sample workflow access decision

**Decision:** the marketing `Explore a sample workflow` action is a lead-generation gate, but it must not create an institution Owner or require privileged MFA.

## Correct journey

```text
Explore a sample workflow
  -> Google sign-in (primary) or one-time email link
  -> authenticated sample viewer with no organization membership
  -> read-only fictional four-persona workflow
  -> book a guided walkthrough or deliberately create an institution workspace
```

Creating an institution workspace is a separate action. A new workspace gives its creator the Owner role, and the Owner must enroll an authenticator before entering `/app` because that role can manage policy, team access, billing, and authority requests.

The sample viewer may open `/sample` at AAL1 because the route contains fixed fictional content, performs no mutation, exposes no organization or participant data, and grants no organization capability. A signed-in Owner at AAL1 may also view the sample without satisfying the `/app` MFA gate; the sample does not let that Owner execute a privileged command.

## Lead-generation truth

The initial release captures an authenticated viewer in Supabase Auth and gives the viewer a direct CTA to the existing consented commercial-inquiry form. Authentication alone is not permission for sales or marketing contact. Do not project an Auth user into HubSpot or send outreach unless the person separately submits the contact form and accepts its recorded consent language.

A later analytics increment may record a privacy-reviewed `sample_viewed` product event with source attribution and aggregate conversion reporting. It must remain separate from authority records and must not include participant or authority data.

## Acceptance evidence

- Every marketing link labeled `sample workflow` routes to `/sample`.
- An unauthenticated `/sample` visit reaches `/start?intent=sample&next=/sample`.
- The sample gate leads with Google when Google OAuth is configured and retains one-time email as a fallback.
- Successful sign-in returns to `/sample`, not organization onboarding.
- `/sample` requires an authenticated user but no organization, role, or AAL2 session.
- `/sample` is dynamic, private/no-store, and `noindex`.
- The sample contains fictional read-only content and no mutation controls.
- Starting or entering an Owner/Admin institution workspace continues to require the existing MFA policy.
- Desktop and mobile browser checks pass without overflow, console errors, or misleading claims.
