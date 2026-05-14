# Passage Stripe Connect, HubSpot, Vercel, Supabase, and GitHub Runbook

Prepared for Steve. Last updated: May 14, 2026.

This is the practical setup checklist to get Passage over the line for vendor payments, Passage's 12 percent marketplace fee, HubSpot lead/deal sync, production environment variables, Supabase migrations, and GitHub/Vercel deployment flow.

## What This Runbook Is For

Use this when you are setting up or checking:

- Stripe Checkout for family plans and urgent path payments.
- Stripe Connect for vendor payouts.
- Vendor service payments where the family pays Passage, Passage keeps 12 percent, and Stripe transfers the remainder to the connected vendor account.
- HubSpot contact, company, and deal creation.
- Vercel production environment variables.
- Supabase live schema and migrations.
- GitHub push-to-deploy flow.
- QA mode so test notifications route only to Steve.

## Current Passage Integration Map

Relevant production code paths:

- Family/D2C checkout: `pages/api/checkout.js`
- Stripe webhook: `pages/api/stripeWebhook.js`
- Vendor Stripe Connect onboarding: `pages/api/vendors/connect/start.js`
- Vendor quote/payment checkout: `pages/api/vendorRequests/checkout.js`
- Vendor request lifecycle: `lib/vendorLifecycle.js`
- Vendor economics: `lib/vendorEconomics.js`
- HubSpot sync helper: `lib/hubspot.js`
- Web lead capture: `pages/api/saveLead.js`
- Support/contact inquiry: `pages/api/supportInquiry.js`
- Vendor application: `pages/api/vendors/apply.js`
- Care-provider application: `pages/api/careProviders/apply.js`
- Notification safety: `lib/notificationSafety.js`
- Supabase migrations: `supabase/migrations`

Official references used:

- Stripe destination charges: https://docs.stripe.com/connect/destination-charges
- Stripe account links for Connect onboarding: https://docs.stripe.com/api/account_links
- Stripe webhooks: https://docs.stripe.com/webhooks
- HubSpot private app scopes: https://developers.hubspot.com/docs/apps/legacy-apps/authentication/scopes
- HubSpot associations v4: https://developers.hubspot.com/docs/guides/api/crm/associations/associations-v4
- HubSpot deals API: https://developers.hubspot.com/docs/reference/api/crm/objects/deals
- Vercel environment variables: https://vercel.com/docs/projects/environment-variables

## Priority Order

Do this in this order:

1. Confirm Supabase production migrations are applied.
2. Set Vercel production environment variables.
3. Configure Stripe products, prices, Connect, and webhooks.
4. Configure HubSpot private app, pipelines, and stage IDs.
5. Confirm GitHub main branch deploys to Vercel production.
6. Run QA mode tests with all email routed to Steve.
7. Turn off QA mode before real customers.

## Supabase Setup

### Project

Production Supabase project:

```text
Project ref: qsveqfchwylsbncsfgxe
Region: us-east-2
```

### Required Supabase Values

In Supabase dashboard:

1. Open the Passage project.
2. Go to Project Settings -> API.
3. Copy:
   - Project URL
   - Anon public key
   - Service role key

Put these in Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL=https://qsveqfchwylsbncsfgxe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Never put the service role key in frontend code, GitHub commits, screenshots, or browser-exposed `NEXT_PUBLIC_` variables.

### Apply Migrations

From repo root:

```powershell
cd "C:\Users\steve\Documents\Codex\2026-04-30\you-are-working-on-a-production"
$env:SUPABASE_ACCESS_TOKEN="sbp_your_real_access_token"
npx supabase link --project-ref qsveqfchwylsbncsfgxe
```

Then apply the current critical migrations:

```powershell
npx supabase db query --linked -f supabase/migrations/20260513072356_notification_safety_audit_fields.sql
npx supabase db query --linked -f supabase/migrations/20260513_green_to_red_activation_circle.sql
npx supabase db query --linked -f supabase/migrations/20260513_vendor_payment_spine_hardening.sql
npx supabase db query --linked -f supabase/migrations/20260513_funeral_home_location_slots.sql
npx supabase db query --linked -f supabase/migrations/20260513_care_provider_handoff_spine.sql
```

Verify the important live tables and columns:

```powershell
npx supabase db query --linked "select table_name from information_schema.tables where table_schema='public' and table_name in ('activation_witnesses','activation_requests','activation_confirmations','vendor_payments','care_provider_applications','provider_handoffs') order by table_name;"

npx supabase db query --linked "select column_name from information_schema.columns where table_schema='public' and table_name='vendor_requests' and column_name in ('payment_collection_status','gross_amount','passage_fee_percent','vendor_net_amount','service_start_at','payout_status') order by column_name;"
```

Success criteria:

- Activation tables exist.
- Vendor payment table exists.
- Vendor request payment/status columns exist.
- Care-provider application and provider handoff tables exist.
- No migration command returns a SQL error.

## Vercel Setup

### Project

Vercel project:

```text
Project name: thepassageappio
Project ID: prj_b7CKwanQaKwFQSHInr3l6wsZy9nD
Team/org ID: team_X0ta3bEEbRVGNM9xOwdBtCga
Production domain: https://www.thepassageapp.io
```

### Where to Add Variables

In Vercel:

1. Open project `thepassageappio`.
2. Go to Settings -> Environment Variables.
3. Add each variable to Production.
4. Add safe equivalents to Preview if you want preview testing.
5. Redeploy production after adding or changing variables.

Vercel variables are scoped by environment. A value set only for Preview will be undefined in Production.

### Core Production Variables

Required:

```text
NEXT_PUBLIC_SITE_URL=https://www.thepassageapp.io
NEXT_PUBLIC_BASE_URL=https://www.thepassageapp.io
NEXT_PUBLIC_SUPABASE_URL=https://qsveqfchwylsbncsfgxe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PASSAGE_INTERNAL_API_SECRET=generate-a-long-random-secret
PASSAGE_ADMIN_EMAILS=steventurrisi@gmail.com,thepassageappio@gmail.com
NEXT_PUBLIC_PASSAGE_ADMIN_EMAILS=steventurrisi@gmail.com,thepassageappio@gmail.com
```

Recommended:

```text
SUPPORT_EMAIL=support@thepassageapp.io
PASSAGE_LEADS_EMAIL=steventurrisi@gmail.com
RESEND_SUPPORT_EMAIL=support@thepassageapp.io
```

Email:

```text
RESEND_API_KEY=...
RESEND_FROM_EMAIL=Passage <notifications@thepassageapp.io>
RESEND_WEBHOOK_SECRET=...
```

Google Places/address autocomplete:

```text
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=...
GOOGLE_MAPS_API_KEY=...
GOOGLE_PLACES_API_KEY=...
```

SMS, currently only when ready:

```text
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
TWILIO_MESSAGING_SERVICE_SID=...
PASSAGE_SMS_LIVE_ENABLED=false
```

QA notification safety:

```text
QA_NOTIFICATION_MODE=true
QA_NOTIFICATION_OVERRIDE_EMAIL=steventurrisi@gmail.com
```

Important: keep QA mode on while testing in production. Turn it off before real customer use:

```text
QA_NOTIFICATION_MODE=false
```

## Stripe Setup

## Stripe Architecture Decision

Use two Stripe tracks:

1. Normal Checkout/Billing for Passage D2C and funeral-home subscriptions.
2. Stripe Connect for vendor marketplace services.

For vendor services, use destination charges:

- Family pays the full vendor quote.
- Charge is created on the Passage platform account.
- `application_fee_amount` is Passage's fee.
- `transfer_data[destination]` is the vendor's connected account.
- Passage default marketplace fee is 12 percent.

This matches the current Passage code in `pages/api/vendorRequests/checkout.js`.

## Stripe Account Checklist

In Stripe Dashboard:

1. Confirm you are in the correct account for Passage.
2. Decide Test mode first, then Live mode after successful QA.
3. Go to Developers -> API keys.
4. Copy:
   - Secret key for server-side usage.
   - Publishable key if later needed by client-side Stripe Elements.
5. Go to Connect settings.
6. Confirm the platform profile, business details, public support details, and payout settings.
7. Use Stripe-hosted Connect onboarding for vendors.

Vercel variables:

```text
STRIPE_SECRET_KEY=sk_test_or_sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Only use live keys in Production when ready to transact for real.

## Stripe Products and Prices

Create these products/prices in Stripe. Copy each price ID into Vercel.

### D2C Family/Urgent

```text
Product: Passage Urgent Family Record
Price: $79 one-time
Vercel: STRIPE_PRICE_URGENT=price_...
```

Planning subscription options, as applicable:

```text
STRIPE_PRICE_SINGLE_MONTHLY=price_...
STRIPE_PRICE_SINGLE_ANNUAL=price_...
STRIPE_PRICE_COUPLE_MONTHLY=price_...
STRIPE_PRICE_COUPLE_ANNUAL=price_...
STRIPE_PRICE_FAMILY_MONTHLY=price_...
STRIPE_PRICE_FAMILY_ANNUAL=price_...
STRIPE_PRICE_ADDON_ESTATE_MONTHLY=price_...
STRIPE_PRICE_ADDON_ESTATE_ANNUAL=price_...
```

### Funeral Home

```text
STRIPE_PRICE_PARTNER_PILOT_MONTHLY=price_...
STRIPE_PRICE_FUNERAL_HOME_PILOT_MONTHLY=price_...
STRIPE_PRICE_PARTNER_LOCAL_MONTHLY=price_...
STRIPE_PRICE_FUNERAL_HOME_LOCAL_MONTHLY=price_...
STRIPE_PRICE_PARTNER_GROUP_MONTHLY=price_...
STRIPE_PRICE_FUNERAL_HOME_GROUP_MONTHLY=price_...
STRIPE_PRICE_FUNERAL_HOME_LOCATION_ADDON_MONTHLY=price_...
STRIPE_PRICE_PARTNER_LOCATION_ADDON_MONTHLY=price_...
```

Pilot coupon or promo code variables if using the $0 pilot:

```text
STRIPE_COUPON_FUNERAL_HOME_PILOT=coupon_...
STRIPE_PROMOTION_CODE_FUNERAL_HOME_PILOT=promo_...
```

## Stripe Connect Vendor Setup

Current Passage route:

```text
POST /api/vendors/connect/start
```

What it does:

- Requires signed-in approved vendor owner or manager.
- Creates a connected account if one does not exist.
- Requests `card_payments` and `transfers` capabilities.
- Creates a Stripe account link for hosted onboarding.
- Saves `stripe_connect_account_id` and readiness fields on the vendor record.

Vendor success criteria:

- Approved vendor signs in.
- Vendor clicks payout setup.
- Stripe hosted onboarding opens.
- Vendor completes identity/bank setup.
- Stripe sends `account.updated`.
- Passage records:
  - `stripe_connect_account_id`
  - `stripe_connect_status`
  - `stripe_charges_enabled`
  - `stripe_payouts_enabled`
  - `stripe_details_submitted`

## Stripe Webhook Setup

Current Passage webhook route:

```text
https://www.thepassageapp.io/api/stripeWebhook
```

In Stripe Dashboard:

1. Go to Developers -> Webhooks.
2. Add endpoint:
   - URL: `https://www.thepassageapp.io/api/stripeWebhook`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
   - `customer.subscription.deleted`
   - `account.updated`
4. Save endpoint.
5. Reveal signing secret.
6. Add to Vercel:

```text
STRIPE_WEBHOOK_SECRET=whsec_...
```

If Stripe asks about Connect events, make sure `account.updated` reaches the same webhook or configure the relevant Connect webhook depending on Stripe Dashboard options.

## Vendor Quote and Payment Test

Use Stripe test mode first.

Required state before test:

- Vendor exists and is approved.
- Vendor has completed Connect onboarding in test mode.
- Vendor has `stripe_charges_enabled=true` and `stripe_payouts_enabled=true`.
- Family/coordinator has access to a task.
- Vendor request exists from that task.

Test flow:

1. Family requests a vendor from a task.
2. Vendor receives the request.
3. Vendor opens request portal.
4. Vendor submits quote with amount, service date/time, location, and notes.
5. Family accepts quote.
6. Passage creates Checkout Session through `/api/vendorRequests/checkout`.
7. Use Stripe test card:

```text
4242 4242 4242 4242
Any future expiration
Any CVC
Any ZIP
```

8. Stripe sends `checkout.session.completed`.
9. Passage updates:
   - `vendor_requests.status=paid`
   - `vendor_requests.payment_collection_status=paid`
   - `vendor_payments.status=paid`
   - gross amount
   - Passage/application fee amount
   - vendor net
   - payout status
   - estate/task communication event
10. Vendor dashboard shows paid/scheduled state and revenue.

Success criteria:

- Family gets a secure payment link.
- Vendor cannot collect payment unless Connect is ready.
- Passage fee is 12 percent.
- Vendor net is gross minus Passage fee.
- Webhook updates Supabase without manual intervention.
- Vendor and family get clear status updates.

## HubSpot Setup

## HubSpot Architecture Decision

HubSpot should be the CRM of record for:

- Family leads.
- Paid D2C family customers.
- Funeral-home leads.
- Family-requested funeral-home warm inbounds.
- Vendor applications.
- Vendor marketplace revenue.
- Hospice/care/assisted-living leads.

Supabase remains the product database. HubSpot is the sales and lifecycle CRM.

Current Passage sync helper:

```text
lib/hubspot.js
```

It supports:

- Upsert contact by email.
- Upsert company by domain or name.
- Create deal.
- Associate contact-company, deal-contact, and deal-company.
- Log sync result into `crm_sync_events`.

## Create HubSpot Private App

In HubSpot:

1. Settings -> Integrations -> Private Apps.
2. Create private app: `Passage Production Sync`.
3. Add scopes for:
   - CRM contacts read/write
   - CRM companies read/write
   - CRM deals read/write
   - CRM associations read/write
4. Copy the private app access token.
5. Add to Vercel:

```text
HUBSPOT_PRIVATE_APP_TOKEN=pat-na1-...
```

If your HubSpot UI uses exact technical scope names, choose scopes equivalent to:

```text
crm.objects.contacts.read
crm.objects.contacts.write
crm.objects.companies.read
crm.objects.companies.write
crm.objects.deals.read
crm.objects.deals.write
crm.objects.associations.read
crm.objects.associations.write
```

## HubSpot Pipelines

Create or confirm these pipelines.

### 1. D2C Family Pipeline

Purpose: red/green family leads, urgent path, paid planning.

Stages:

- New Lead
- Record Started
- Checkout Started
- Paid
- Nurture
- Closed Lost

### 2. Funeral Home B2B Pipeline

Purpose: directors, pilot conversations, partner setup.

Stages:

- New Lead
- Demo Booked
- Pilot Proposed
- Pilot Active
- Contract Sent
- Closed Won
- Closed Lost

### 3. Vendor Network Pipeline

Purpose: vendor applications and approval process.

Stages:

- Applied
- Reviewing
- Approved
- Stripe Connect Pending
- Active
- Paused
- Rejected

### 4. Marketplace GMV Pipeline

Purpose: individual vendor service revenue.

Stages:

- Quote Requested
- Quote Sent
- Accepted
- Payment Pending
- Paid
- Fulfilled
- Cancelled

### 5. Care and Hospice Partnerships Pipeline

Purpose: hospice, assisted living, senior living, home care, care facilities.

Stages:

- New Lead
- Discovery
- Pilot Design
- Pilot Active
- Contract Sent
- Closed Won
- Closed Lost

## HubSpot Env Vars

Minimum currently used by code:

```text
HUBSPOT_PRIVATE_APP_TOKEN=...
HUBSPOT_DEFAULT_PIPELINE=...
HUBSPOT_DEFAULT_DEALSTAGE=...
HUBSPOT_CLOSED_WON_DEALSTAGE=...
HUBSPOT_CARE_PIPELINE=...
HUBSPOT_CARE_NEW_STAGE=...
```

Recommended next-stage variables:

```text
HUBSPOT_D2C_PIPELINE=...
HUBSPOT_D2C_NEW_STAGE=...
HUBSPOT_D2C_CHECKOUT_STAGE=...
HUBSPOT_D2C_CLOSED_WON_STAGE=...

HUBSPOT_FUNERAL_HOME_PIPELINE=...
HUBSPOT_FUNERAL_HOME_NEW_STAGE=...
HUBSPOT_FUNERAL_HOME_DEMO_STAGE=...
HUBSPOT_FUNERAL_HOME_PILOT_STAGE=...
HUBSPOT_FUNERAL_HOME_CLOSED_WON_STAGE=...

HUBSPOT_VENDOR_PIPELINE=...
HUBSPOT_VENDOR_APPLIED_STAGE=...
HUBSPOT_VENDOR_APPROVED_STAGE=...
HUBSPOT_VENDOR_ACTIVE_STAGE=...

HUBSPOT_MARKETPLACE_PIPELINE=...
HUBSPOT_MARKETPLACE_QUOTE_STAGE=...
HUBSPOT_MARKETPLACE_PAYMENT_PENDING_STAGE=...
HUBSPOT_MARKETPLACE_PAID_STAGE=...

HUBSPOT_CARE_PIPELINE=...
HUBSPOT_CARE_NEW_STAGE=...
HUBSPOT_CARE_PILOT_STAGE=...
HUBSPOT_CARE_CLOSED_WON_STAGE=...
```

HubSpot deal creation requires internal pipeline and deal stage IDs, not just display names.

## HubSpot Object Rules

### Family Leads

Create/update contact.

Create deal only when there is purchase intent:

- Urgent path lead.
- Checkout started.
- Checkout completed.
- Paid plan.

Contact:

- Email
- Name
- Phone if available
- Lifecycle stage: Lead
- Persona: Family, Red Path, Green Path, Participant conversion

Deal:

- Pipeline: D2C Family
- Amount: 79 for urgent, plan amount for subscriptions
- Associate to contact

### Paid Family Customers

Triggered by Stripe webhook `checkout.session.completed`.

Update:

- Contact lifecycle stage: Customer
- Deal stage: Closed Won
- Amount: Stripe amount
- Store Stripe session ID in Supabase CRM sync payload

### Funeral Home Leads

Create:

- Contact for director/submitter
- Company for funeral home
- Deal in Funeral Home B2B pipeline

Highest-priority source:

- Family-requested funeral home

Outreach angle:

```text
A family using Passage requested your funeral home.
```

### Vendor Leads

Create:

- Contact for vendor owner
- Company for vendor business
- Deal in Vendor Network pipeline

Lifecycle:

- Applied
- Reviewing
- Approved
- Stripe Connect Pending
- Active

### Vendor Marketplace Deals

Create a separate deal when a vendor quote is accepted or paid.

Deal:

- Pipeline: Marketplace GMV
- Amount: gross vendor service amount
- Properties to track:
  - Passage fee percent
  - Passage fee amount
  - Vendor net
  - Stripe checkout session ID
  - Vendor request ID
  - Workflow ID
  - Task ID

### Care Provider Leads

Create:

- Contact for submitter
- Company for hospice/care/assisted-living organization
- Deal in Care and Hospice Partnerships pipeline

Sources:

- `/care-providers`
- `/hospice`
- `/assisted-living`
- contact page with care-provider category

## GitHub and Vercel Deployment Flow

Current GitHub remote:

```text
https://github.com/thepassageappio/thepassageappio.git
```

Current deployment pattern:

- Work lands on `main`.
- Push to GitHub.
- Vercel Git integration builds production.

Deployment commands:

```powershell
git status
npm run build
git add .
git commit -m "Describe the release"
git push origin main
```

If using Vercel CLI:

```powershell
npx vercel deploy --prod -y
```

GitHub should not store production secrets unless you add GitHub Actions that need them. For this app, Vercel should be the primary secret store.

Recommended GitHub protections:

- Require pull request before merging to `main` once real customers exist.
- Require build pass before merge.
- Disable force pushes to `main`.
- Add branch protection.
- Add secret scanning.

## QA Mode Checklist

Use QA mode when testing production flows.

Vercel:

```text
QA_NOTIFICATION_MODE=true
QA_NOTIFICATION_OVERRIDE_EMAIL=steventurrisi@gmail.com
PASSAGE_SMS_LIVE_ENABLED=false
```

Expected behavior:

- Every outbound email intended for someone else goes to Steve.
- Notification log records intended recipient and actual recipient.
- SMS is blocked or dry-run unless explicitly enabled.

Run admin QA:

1. Sign in as Steve.
2. Open `/system/admin`.
3. Run coordination smoke test.
4. Confirm it passes.
5. Confirm temporary records are cleaned up.
6. Confirm notification logs show intended and actual recipient fields.

## End-to-End Launch Tests

### Test 1: Family Lead to HubSpot

1. Open `/urgent`.
2. Submit a real test lead using Steve's email.
3. Confirm Supabase `leads` row.
4. Confirm HubSpot contact.
5. Confirm D2C deal if urgent path.
6. Confirm `crm_sync_events` row.

### Test 2: Vendor Application to HubSpot

1. Open `/vendors/onboard`.
2. Submit vendor application with Steve's email.
3. Confirm vendor row in Supabase.
4. Confirm branded applicant receipt email.
5. Confirm HubSpot contact/company/deal.

### Test 3: Care Provider Application to HubSpot

1. Open `/care-providers`.
2. Submit inquiry with Steve's email.
3. Confirm Supabase `care_provider_applications`.
4. Confirm branded receipt email.
5. Confirm HubSpot contact/company/deal.

### Test 4: Green-to-Red Activation

1. Open `/planning`.
2. Create Green estate.
3. Add two trusted activation witnesses.
4. Person one requests activation.
5. Person two receives email and confirms.
6. Estate becomes Red only after second confirmation.
7. Confirm activation events and proof rows.

### Test 5: Vendor Payment and Payout

1. Create approved vendor.
2. Vendor completes Stripe Connect onboarding.
3. Family creates vendor request from task.
4. Vendor quotes with date/time/location.
5. Family accepts quote.
6. Family pays via Stripe test checkout.
7. Stripe webhook marks request paid.
8. Vendor dashboard shows gross, Passage fee, net, payout status.
9. Estate timeline shows service/payment event.

## Production Cutover Checklist

Before real customers:

- QA mode off.
- Live Stripe keys in Production.
- Live Stripe webhook secret in Production.
- HubSpot token in Production.
- Supabase service role in Production.
- Resend domain verified for `thepassageapp.io`.
- `RESEND_FROM_EMAIL=Passage <notifications@thepassageapp.io>`.
- `SUPPORT_EMAIL=support@thepassageapp.io`.
- Google OAuth redirect URLs allowlisted for:
  - `https://www.thepassageapp.io`
  - `https://www.thepassageapp.io/login`
  - `https://www.thepassageapp.io/participating`
  - `https://www.thepassageapp.io/vendors/login`
  - `https://www.thepassageapp.io/funeral-home/setup`
  - `https://www.thepassageapp.io/funeral-home/staff`
- Stripe webhook endpoint shows successful recent deliveries.
- HubSpot `crm_sync_events` shows synced, not skipped.
- Admin smoke test passes.

## Known Decisions

Vendor marketplace fee:

```text
12 percent default Passage fee
```

Why:

- Normal marketplace range is commonly around 10 to 15 percent.
- 12 percent is simple, defensible, and leaves room for higher-touch categories later.
- Fee disclosure should live in gated vendor onboarding and vendor terms, not public marketing copy.

Vendor payment rule:

```text
Do not collect family payment for a vendor unless the vendor's Stripe Connect account is ready.
```

Care provider rule:

```text
Hospice, assisted living, senior living, and care providers create B2B pipeline and family-owned handoff value. They do not own the family record.
```

Funeral home rule:

```text
Funeral homes can receive warm inbounds and operate cases, but vendor marketplace revenue should not automatically cut them in unless separately contracted.
```

## Quick Debug Commands

Check build:

```powershell
npx next build --no-lint
```

Check production route:

```powershell
Invoke-WebRequest -Uri "https://www.thepassageapp.io/status" -UseBasicParsing
```

Check Supabase tables:

```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_your_real_access_token"
npx supabase db query --linked "select table_name from information_schema.tables where table_schema='public' order by table_name;"
```

Check latest Git:

```powershell
git log -1 --oneline
git status
```

## Final Success Criteria

Stripe is over the line when:

- Family can pay for Passage plans.
- Vendor can complete Stripe Connect onboarding.
- Family can accept and pay a vendor quote.
- Passage records and keeps 12 percent.
- Vendor net and payout status are visible.
- Webhooks update the spine without manual work.

HubSpot is over the line when:

- Website forms create contacts.
- B2B submissions create companies and deals.
- Paid customers close deals correctly.
- Vendor and care-provider pipelines are visible.
- Supabase logs every sync attempt in `crm_sync_events`.

Platform ops are over the line when:

- Vercel Production has all env vars.
- Supabase migrations are applied.
- GitHub push triggers Vercel deployment.
- QA mode routes all test email to Steve.
- Admin smoke test passes.
