# Passage demo sandbox environment contract

**Status:** Repository foundation only. No Vercel or Supabase project is created by this document.

## Purpose

The funeral-home sales sandbox is an isolated runtime target for synthetic Passage data. It is not a production preview and must not share production data, service credentials, analytics, communications, payments, or scheduled delivery effects.

## Required isolation

The sandbox must use:

- A separate Vercel project.
- A separate Supabase project.
- A unique Supabase project ref and service-role key.
- Synthetic `.invalid` recipient addresses only.
- No production custom domain.
- No Resend, Twilio, Stripe, HubSpot, or production analytics credentials.
- `PASSAGE_EXTERNAL_EFFECTS=blocked`.

The production Supabase project ref is supplied only as a comparison value. The reset script refuses to run if the demo and production refs are equal.

## Required environment variables

```text
PASSAGE_RUNTIME_ENV=demo-sandbox
PASSAGE_DEMO_SANDBOX=1
PASSAGE_EXTERNAL_EFFECTS=blocked

PASSAGE_DEMO_VERCEL_PROJECT_ID=<new isolated Vercel project id>
PASSAGE_DEMO_SUPABASE_PROJECT_REF=<new isolated Supabase ref>
PASSAGE_PRODUCTION_SUPABASE_PROJECT_REF=<production ref for inequality check>

NEXT_PUBLIC_SUPABASE_URL=https://<demo-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<demo anon key>
SUPABASE_SERVICE_ROLE_KEY=<demo service-role key>
NEXT_PUBLIC_SITE_URL=https://<demo-project>.vercel.app

PASSAGE_DEMO_DIRECTOR_EMAIL=<synthetic demo login>
PASSAGE_DEMO_DIRECTOR_PASSWORD=<sandbox-only password>
```

`SUPABASE_SERVICE_ROLE_KEY` and the demo password are server-only secrets. Never prefix either with `NEXT_PUBLIC_`.

## Credentials forbidden in the sandbox

These variables must be absent:

```text
RESEND_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
TWILIO_MESSAGING_SERVICE_SID
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
HUBSPOT_ACCESS_TOKEN
```

The reset script fails closed if any are present.

## Reset workflow

After applying repository migrations to the isolated Supabase project:

```sh
node scripts/demo/reset-sandbox.mjs \
  --confirm="RESET PASSAGE DEMO SANDBOX"
```

The script:

1. Verifies the complete isolation contract.
2. Refuses production Passage domains.
3. Refuses matching production and demo Supabase refs.
4. Refuses a mismatched Vercel project ID.
5. Refuses outbound provider credentials.
6. Creates or refreshes the synthetic director using Supabase Auth Admin.
7. Removes only rows identified by reserved deterministic demo UUIDs.
8. Recreates one funeral home, four cases, six operating tasks, one vendor, and one vendor request.
9. Verifies exact row counts.

Running the command twice must return the same IDs and counts.

## Existing unsafe paths

The following existing utilities are not the sandbox foundation:

- `pages/api/system/resetTestData.js` can perform a destructive all-table reset and is not used.
- `scripts/demo-reseed.sql` assumes a fixed organization and manual Auth work.
- `scripts/vercel-ignore-build.js` currently accepts only the canonical production project.
- `vercel.json` includes production-style scheduled jobs.

## Deployment handoff

Before the sandbox can deploy, `scripts/vercel-ignore-build.js` must be extended so:

- The production project continues accepting only production release markers.
- The isolated project accepts only an explicit sandbox marker such as `[sandbox deploy] [qa-approved]`.
- Production ignores sandbox markers.
- The sandbox ignores production-only release markers.
- Unknown project IDs remain denied.

Do not weaken the canonical-project guard before the isolated Vercel project ID exists.

The sandbox must not receive delivery credentials. Until runtime cron guards are implemented, every cron invocation must fail authorization without producing email, SMS, payment, webhook, or customer effects.

## Provisioning evidence

The sandbox is not operational until the evidence package includes:

- Separate Vercel project ID.
- Separate Supabase project ref.
- Environment inventory proving no production secrets.
- Two consecutive successful resets with identical verification counts.
- Confirmed synthetic demo login.
- Confirmed absence of outbound email, SMS, payment, webhook, and production analytics activity.
- Desktop and 390px funeral-director screenshots.
- Matching deployment commit and clean browser console.
