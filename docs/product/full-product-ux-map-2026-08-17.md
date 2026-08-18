# Passage full product UX map — every page, every button, every outcome (2026-08-17)

**Why this exists.** The founder asked directly, more than once: "if I click a button on the homepage, what exactly happens?" and pointed out correctly that a rigorous version of this ("wireframes we did") should already exist and be kept current, not rediscovered ad hoc each session. It does exist in spirit — `docs/product/frontend-backend-contracts.json` is a real, machine-checked contract ledger — but it stopped being updated after Cycle 8 (2026-07-27) and covers roughly 15% of what's shipped since. This document is the current, full-coverage replacement: every route in the app (44 `page.tsx` files), every button/link/form on every one of them, exactly which server action or RPC it calls, and exactly what the user sees on success and on every failure branch the code actually has.

**How this was built.** Five parallel research passes, one per site section (marketing/onboarding, signup/invite/blog, family/D2C case pages, director/staff operations, vendor/partner), each reading every page file *and* every component/action file it imports — not guessing from the rendered UI, reading the actual server action / RPC call and its exact error-code branches. Nothing here is inferred; every claim traces to a specific file. The full unedited output of each pass is preserved below, organized by persona, after this summary.

**What this is not.** This is a snapshot of *current behavior*, not a redesign. It does not propose new features. It answers "what does the code actually do right now," which is the prerequisite for deciding what to fix and in what order.

---

## Executive summary: ranked findings

### Tier 1 — Trust risks: pages that look real but aren't, reachable without realizing it

1. **`/receive` has zero authentication.** No layout, no role check, no session check anywhere in the file. Anyone with the URL — signed in or not, any role or none — loads it and sees a hardcoded fake identity ("Elena Torres · Director · Northstar"). The entire flow is a client-only sandbox (no server calls at all) that ends with a link reading "Open {caseId} ↗" pointing at the real `/director` — implying a real handoff was received when nothing was written anywhere. There is a "PREVIEW DEMO" banner on the entry screen, so the *intent* to label it as a demo exists, but the complete absence of an auth gate (unlike every other operational page) means this is reachable by literally anyone, including a competitor, a curious lead, or Google's crawler.
2. **`/director/intake` requires real director sign-in but is also a pure client-side sandbox** with no RPCs or server actions anywhere in the directory. A signed-in real director using this could believe they created a real case — the copy does disclaim "This demo will not create a real case," but the very next screen offers "Open secure Preview workspace →" pointing at the real `/director`, which directly contradicts that disclaimer in effect if not in wording.
3. **`/family` and `/family/pass` are a fully disconnected demo sandbox** (hardcoded "Sofia Rivera" data, `localStorage`/`sessionStorage` only, zero Supabase calls) whose URL structure and copy closely mirror the real `/case/[id]/*` family experience. No auth gate. If ever linked to from a real product surface or found by a real family via search, it would be actively confusing.

**Why this matters for "ready to demo":** these three pages are the most likely to embarrass the founder in front of a funeral home if clicked into by accident during a live walkthrough, since they look finished and on-brand but do nothing real.

### Tier 2 — Confirmed functional bugs (not missing features — the code has a bug)

4. **`/family-invite/[token]` silently drops every error.** The page component never reads `searchParams` at all. Every failure in `acceptFamilyInvitation` (wrong email, already claimed, expired, retry) redirects to `?error=<code>`, and the page has a `failureMessages` map ready to show the right copy for each — but the code path that would read the query string doesn't exist. A family participant whose acceptance fails for any reason sees the form again with **zero explanation of what went wrong.**
5. **`/pricing` never shows checkout failures.** All four Stripe checkout actions redirect to `/pricing?checkout=invalid|unavailable|cancelled` on failure or cancellation, but `app/pricing/page.tsx` never reads that query param. A declined card, a cancelled session, or a Stripe misconfiguration all silently dump the visitor back on the pricing page with no error shown at all.
6. **`/account/billing`'s error banner never says what went wrong.** All four distinct failure reasons (`unavailable`, `denied`, `no-subscription`, and implicitly others) render the identical generic text "Passage couldn't complete that. Nothing changed. Try again." This is the exact shape of complaint the founder raised tonight independently, confirmed in code.
7. **`/guides`' lead-capture form always claims success.** `unlockGuide` calls `recordContactInquiry` (the HubSpot integration) and never checks its return value — the guide unlocks and the user is told it worked even if the HubSpot call silently failed. The code even has an `'unavailable'` status defined for this case that is never actually returned.
8. **A literal copy bug in the director Case Room's proof-review conflict message.** A version-conflict (`40001`) during proof verification shows "Ownership changed before your action was saved..." — copy that belongs to the assignment-reassignment flow, leaked in because the error-formatting helper is shared and not fully specialized per action.
9. **Vendor category display bug.** `VENDOR_CATEGORY_LABELS` doesn't have entries for `catering`, `restaurant`, `cemetery`, or `printer_stationery` — all valid categories a vendor can select at signup — so any request in those categories silently displays as the generic "Vendor request" instead of its real category, on both `/partner` and `/partner/requests/[id]`.
10. **Vendor-payment return from Stripe shows no confirmation.** The Case Room's "Approve & pay quote" redirects to Stripe and back to `?vendorPayment=success|cancelled`, but nothing reads that param — a director returning from paying a vendor gets no on-page acknowledgment that it worked.

### Tier 3 — Real dead ends with no workaround in the UI

11. **Three separate "upgrade required" walls with no upgrade button.** Trial-ended denials on vendor-request creation, case creation from an urgent-intake claim, and (as of tonight, now fixed going forward per the founder's explicit instruction) adding a second location all hit the same shape of problem: a `55001` error with copy like "Your 90-day trial has ended... Upgrade to open another" — with **no link or button that actually starts an upgrade.** Tonight's location-creation work fixes this pattern for locations specifically (see below); the other two are not yet fixed.
12. **`/partner/payouts` is only ever linked to once**, from the one-time vendor-signup success screen. Nothing in the vendor's real navigation (the `AppFrame` nav for `active="partner"` shows only "Requests") links back to it. A vendor who doesn't finish Stripe onboarding in one sitting, or wants to check payout status later, has no discoverable way back — a real gap in a real-money flow.
13. **HubSpot side-effects fail silently everywhere they exist** (`/organization/start`, `/partner/start`, `/admin/organizations/new`, others): wrapped in `.catch(() => null)`, so the org/vendor is created successfully but sales/marketing tracking can silently not happen, with zero visibility to anyone that it didn't.
14. **Family case nav's disabled items (Decisions, Service, Costs) have no page behind them at all.** The nav correctly disables them, but a bookmarked or typed URL to `/case/[id]/decisions` etc. hits Next.js's bare default 404, not a branded "coming soon."
15. **`/director/team` has no way to grant a new location to an existing staff member** — only toggle an existing grant's case-creation flag. Getting a member their first location requires a fresh invitation.
16. **`/admin/organizations/new`'s non-platform-admin screen is a complete dead end** — no link home, no way to request access, nothing but static text.
17. **A vendor request "claimed by another organization" screen offers zero action** beyond the persistent back-link at the top.

### Tier 4 — Consistency gaps (lower severity, still worth fixing)

18. `/` and `/mission` route the same two user intents (planning ahead, funeral home) to two different funnels — direct self-serve checkout vs. a contact form — for no apparent reason.
19. The Case Room's family-invitation secure link is plain unclickable text; the staff-invitation flow's equivalent link is a real clickable link. Same underlying pattern, inconsistent implementation.
20. `/blog/[slug]` has no link back to `/blog` anywhere on the page.
21. `/login` gives no resend/cooldown feedback after requesting a magic link or OTP.

### What's already good (don't rebuild this)

The core operational loops — director task assignment, staff proof submission/review, vendor quote/deliver/payout, urgent-intake claim-to-case, the whole L.1–L.4 family task/communication spine built tonight — all have real, specific, mostly-correct error-code-to-copy mappings, real idempotent RPCs, and real revalidation. The problems above are concentrated in **query-param-driven feedback being dropped** (a recurring pattern — items 4, 5, 6, 10 are all the same underlying mistake: a redirect sets `?error=`/`?checkout=`/`?vendorPayment=` and the destination page never reads it) and **a handful of sandbox pages that were built for demo purposes but never fenced off from looking real**. Both are fixable without a redesign.

### Recommended fix order

1. Fence off or clearly, unmissably re-label the three Tier-1 sandbox pages (`/receive`, `/director/intake`, `/family`+`/family/pass`) — cheapest, highest trust-risk-reduction fix available.
2. Fix the four dropped-query-param bugs (items 4–7, 10) — each is a small, contained fix (read the param, render the existing/missing copy) with no architecture change.
3. Add the upgrade-now button to the two remaining trial-wall dead ends (vendor requests, urgent-intake case creation), matching the pattern just built for locations tonight.
4. Add a persistent "Payouts" nav link for vendors.
5. Everything else in Tier 3/4 as capacity allows — none of it blocks a demo, all of it is real polish.

---


## Group A — Marketing / Public / Urgent-Planning funnel

# Group A: Marketing / Public / Urgent-Planning funnel pages

## /
**Purpose:** Public homepage / gateway that routes visitors into one of four entry funnels (urgent, planning, funeral home, vendor).
**Auth:** Public.
**Every interactive element:**
- Header brand link "PASSAGE" (logo) → `/` (TopShell, shared on every marketing page)
- Header nav links: "Funeral homes" → `/organization/start`; "Vendors" → `/partner/start`; "Our story" → `/story`; "Mission" → `/mission`; "Pricing" → `/pricing`; "Guides" → `/guides`; "Blog" → `/blog`; "Contact" → `/contact`
- Header "Sign in" → `/login`
- Header "Get started" → `/#what-you-need` (anchor scroll to the paths section on the same page)
- Mobile hamburger "Menu" button (`MobileNavDisclosure`) → toggles a slide-out panel containing the same nav links plus Sign in / Get started
- Hero "Get started" button → `/#what-you-need`
- Hero "See how it works" → `/demo`
- Path card "Someone just passed" → `/start`
- Path card "Planning ahead" → `/pricing`
- Path card "Funeral home" → `/organization/start`
- Path card "Care provider or vendor" → `/partner/start`
- Inline link "our mission" (inside the pledge paragraph) → `/mission`
- Footer: "Contact Passage" → `/contact`; "Privacy" → `/privacy`; "Terms" → `/terms`
- "Skip to main content" accessibility link → `#main-content`

**On success/failure:** All elements are plain `next/link` navigations or an in-page anchor scroll; no form submission or server action on this page.

**Dead ends or gaps:**
- None of the links target missing routes.
- The "Care provider or vendor" card promises coordination "without the back-and-forth," but clicking only routes to `/partner/start` (a vendor-onboarding form) — no immediate coordination happens on this page, worth noting since the section header says "What do you need right now?" and none of these are truly instant.

## /start
**Purpose:** Entry landing page for the urgent ("someone just passed") triage wizard.
**Auth:** Public. Wrapped in `StartWizardProvider` (app/start/layout.tsx), which seeds a `sessionStorage`-backed draft object (`passage-start-draft`) with a fresh UUID `requestId` on first load.
**Every interactive element:**
- "Someone needs help now" (block button) → `/start/situation`
- Inline text link "See planning options" → `/pricing`

**On success/failure:** Pure navigation links; no form, no failure state.

**Dead ends or gaps:**
- No header/nav besides the custom `StartWordmark` — a user who lands here has no way back to the marketing site except browser back (no `TopShell`, no "Sign in"/global nav).

## /start/situation
**Purpose:** Step 1 of 3 of the urgent wizard — situation category, person's name, location, optional timing, into the client-side wizard draft (no network call yet).
**Auth:** Public.
**Every interactive element:**
- "PASSAGE" wordmark (presumed link home, not confirmed)
- "Exit" link → `/start`
- Select "Which best describes it?" (`situationCategory`) — options: "It happened at home, unexpectedly", "They were in hospice care", "They are at a hospital", "They were at a care facility", "The first steps are already handled", "Something else". Local draft only.
- Text input "Their name" (`personName`)
- Text input "Where they are right now" (`personLocation`)
- Text input "When did this happen? (optional)" (`personTiming`)
- "Continue" — client-side validation only (no server call): requires `situationCategory`, non-empty `personName`, non-empty `personLocation`.
  - **On success:** `router.push('/start/people')`
  - **On failure:** Inline alert (first failing rule wins): "Choose the option closest to what is happening." / "Enter the name of the person this is about." / "Enter where they are right now." Page copy explicitly states "Nothing is sent anywhere yet."

**Dead ends or gaps:**
- Validation is entirely client-side (`noValidate`, no `required` attrs) — no server-side re-validation until step 3's server action.
- Progress-bar indicator is purely visual/`aria-hidden`.

## /start/people
**Purpose:** Step 2 of 3 — captures the callback coordinator's contact info into the wizard draft.
**Auth:** Public. Guards against skipping ahead: if the draft has no `situationCategory` once hydrated, `router.replace('/start/situation')` fires (brief blank screen while checking).
**Every interactive element:**
- Wordmark → presumed `/` (unconfirmed)
- "Exit" link → `/start`
- Text input "Their name" (`coordinatorName`)
- Text input "Phone number" (`coordinatorPhone`)
- Text input "Email (optional if you gave a phone number)" (`coordinatorEmail`)
- Textarea "Anything else we should know? (optional)" (`callbackNotes`)
- "Continue" — requires non-empty `coordinatorName`, and at least one of phone/email.
  - **On success:** `router.push('/start/next')`
  - **On failure:** "Enter the name of the best person to contact." or "Enter a phone number or an email address so we can reach this person."
- "← Back" link → `/start/situation`

**Dead ends or gaps:**
- Same client-only validation gap as step 1.
- Direct navigation with an empty draft (e.g. blocked storage) redirects back to step 1 but the brief `null` render before redirect could look like a blank/broken page.

## /start/next
**Purpose:** Step 3 of 3 — situation-specific emergency guidance, requires auth to save/submit the urgent intake record, offers callback request or private save.
**Auth:** Public to view; save action requires signed-in Supabase user (inline sign-up/sign-in offered).
**Variants:**
- Runtime config unavailable → static "This isn't available right now." + reason + call-911 note. No interactivity.
- Otherwise renders `UrgentNextClient`, phases: `checking` → (`needs-auth` | `already-saved` | `ready` | `recovery-error`).

**Every interactive element (available variant):**
- Wordmark (presumed `/`) and "Exit" → `/start`
- **Phase `checking`:** no interactive elements, "One moment…"
- **Phase `recovery-error`:** alert "Passage could not check whether this exact request was already saved. Nothing new was sent." + "Reload and check" → `window.location.reload()`
- **Phase `already-saved`:** read-only receipt card; if saved-event timestamp unconfirmed, "Reload and check" button → reload.
- **Phase `needs-auth`:**
  - Toggle buttons "Create account" / "I already have one" (visual mode switch)
  - Email input, Password input (`minLength=8`)
  - Submit "Create account and continue" / "Sign in and continue" (or "Please wait…") — calls Supabase `auth.signUp` or `auth.signInWithPassword` directly from browser.
    - Create success (session returned) → `phase = ready`. No session (email confirmation needed) → "Your account was created. Check your email to confirm it, or ask Passage to confirm it for you."
    - Create failure → "Passage could not create that account. Try a different email or sign in instead."
    - Signin success → `phase = ready`. Signin failure → "That email and password did not match. Try again."
- **Phase `ready`:** form bound to server action `submitUrgentIntake` (app/start/actions.ts), hidden inputs carry the full wizard draft + `requestId`. Two submit buttons, same form, differ by `wantsCallback`:
  - "Save and request a callback from Passage" (`wantsCallback=true`, "Saving…" pending)
  - "Save privately, no callback" (`wantsCallback=false`)
  - Server action validates situation category enum, `personName` (1–200), `personLocation` (1–300), `coordinatorName` (1–200), phone-or-email, valid UUID `requestId`.
    - Validation failure → `status: 'validation'`, "A few details are missing. Nothing was sent. Go back and check each step."
    - No Supabase client → `unavailable`, "Passage could not save this right now. Nothing changed. Try again in a moment." + "Reload and check" button.
    - Not signed in → `denied`, "Sign in or create a free account to save this and request a callback." (no recovery button)
    - RPC `submit_urgent_intake_idempotent` error `28000` → `denied`, same message.
    - Error `22023` (duplicate conflict) → `conflict`, "This request is different from what was already saved. Reload to check the saved request before trying again." + recovery button.
    - Other error → `unavailable`, "We could not confirm whether this was saved. Reload and check before trying again." + recovery button.
    - No `urgent_intake_request_id` returned → same `unavailable` fallback.
    - Re-query of `urgent_intake_events` fails/no timestamp → `unavailable`, "This may have been saved, but Passage could not confirm when. Reload and check before trying again."
    - **Full success:** `revalidatePath('/director/urgent')`, `status: 'saved'`, "Sent to Passage. A team member will reach out shortly." (callback) or "Saved privately." (no callback), plus receipt (checkmark, contextual sentence, fact list: Sent to/Visibility, Contact, Saved timestamp in `America/Los_Angeles`).

**Dead ends or gaps:**
- Client-side Supabase auth calls never distinguish network failure from bad credentials — both fall into the same generic messages.
- `formatSavedTime` failure → "Saved time could not be displayed. Reload to check." — confusing since the record WAS actually saved; copy doesn't clarify this is just a display glitch.
- Code comment documents this page used to link straight into authenticated routes and was deliberately reworked (mirrors the `/demo` fix below) — team is aware of and actively fixing "looks interactive but isn't" dead ends elsewhere.
- No "back" link on this final step (steps 1–2 have Exit/Back) — only browser back to revise earlier answers.

## /pricing
**Purpose:** D2C (individual/couple/family) subscription plans, one-time single-estate purchase, one-time urgent purchase, and B2B funeral-home plans — all wired to Stripe Checkout.
**Auth:** Public.
**Every interactive element:**
- Standard TopShell nav (same as `/`).
- Urgent card "Get help now" → `/start`
- 3 D2C plan cards (Individual, Couple, Family), each with:
  - Form → `startCheckout` (hidden `plan`, `period=monthly`), button "Subscribe monthly"
  - Form → `startCheckout` (hidden `plan`, `period=annual`), button "Subscribe annually"
    - Success: validates plan/period, builds Stripe Checkout Session (subscription mode), `success_url=/pricing/success?session_id=...`, `cancel_url=/pricing?checkout=cancelled`, auto-applies participant discount if RPC-eligible else allows promo code on Stripe's page. Redirects to Stripe.
    - Failure: invalid plan/period → `redirect('/pricing?checkout=invalid')`; Stripe not configured/no price ID → `redirect('/pricing?checkout=unavailable')`; session created but no URL → same. **None of these query params are read/displayed on `/pricing/page.tsx`** — see gap below.
  - Link "or talk to us first" → `/contact?category=pricing&plan=<planKey>`
- One-time estate card: form → `startOneTimeEstateCheckout`, button "Buy Single Estate — $299.99 one-time" (one-time payment-mode session, same redirect pattern).
- 3 B2B plan cards (Pilot, Local, Multiple Locations): form → `startB2bCheckout` (hidden `plan`), button "Subscribe" — validates against B2B allow-list, subscription-mode session also collects billing address + required custom field "Funeral home name" (used by webhook to auto-provision org). Same redirect pattern.
  - Link "or talk to us first" → `/contact?category=funeral-home&plan=<planKey>`
- Urgent one-time purchase card: form → `startUrgentOneTimeCheckout`, button "Buy Urgent record — $79.99 one-time" (one-time payment mode, same redirect pattern). Clarifying inline link "free immediate help" → `/start`.
- Footer: "Contact Passage" → `/contact`

**Dead ends or gaps:**
- **Confirmed gap:** all 4 checkout actions redirect to `/pricing?checkout=invalid|unavailable|cancelled` on failure/cancel, but `app/pricing/page.tsx` never reads `searchParams` — a declined card, cancelled session, or Stripe misconfiguration silently dumps the user back on `/pricing` with **no visible error message at all**.
- Participant-discount coupon lookup silently swallows RPC errors — a legitimate participant who should get a discount but hits a transient RPC error just loses it silently.

## /pricing/success
**Purpose:** Post-Stripe-Checkout landing page confirming payment status by re-fetching the Checkout Session.
**Auth:** Public (reads `session_id` query param; links to `/case` for signed-in users).
**Variants:**
- `session_id` present + Stripe confirms `paid`/`complete`: "Payment confirmed" / "You are all set." + "Your subscription is active. Use the secure link in your confirmation email to sign in and start your family record." Card: "Already signed in? Go to your family record" → `/case`.
- Otherwise: "Checking your payment." + "We could not confirm this checkout session. If you completed payment, check your email for a receipt, or contact Passage." No interactive retry.

**Every interactive element:**
- (paid only) "Go to your family record" → `/case`
- "Contact Passage" → `/contact`
- "the homepage" → `/`

**Dead ends or gaps:**
- Unpaid/unconfirmed variant gives no actionable retry button and no distinction between "network error," "actually unpaid," and "missing session_id" — all folded into one message.
- `.catch(() => null)` around Stripe's session retrieve means a transient API error looks identical to "you didn't pay."

## /contact
**Purpose:** General contact/support form routed into HubSpot, pre-filled from `?category=`/`?plan=` params.
**Auth:** Public.
**Every interactive element:**
- Standard TopShell nav.
- Static note: "Emergencies: contact local emergency services..." (not interactive).
- Fields: Name (optional), Email (required), Category select (defaults based on `?category=`: vendor→"Vendor conversation", hospice/care→"Hospice or care-facility conversation", funeral/partner→"Funeral home inquiry", planning/pricing→"Planning-ahead question", else "Urgent family support"), "How can we help?" required textarea (pre-filled with plan interest if `?plan=` present).
- Submit "Send to Passage" ("Sending…" pending) → `submitContactInquiry` (app/contact/actions.ts).
  - Validation failure → "Please fill in an email, category, and message before sending."
  - HubSpot call fails → "Passage could not send this right now. Please email steventurrisi@gmail.com directly instead." (hardcoded fallback email)
  - Success → form replaced by confirmation: "Thanks. Your message was sent to Passage. We'll follow up at {email}."

**Dead ends or gaps:**
- No explicit email-format regex validation server-side (relies on native `type=email`) — inconsistent with `/guides`, which does validate server-side.

## /story
**Purpose:** Brand/founder-story marketing page.
**Auth:** Public.
**Every interactive element:**
- TopShell nav. "Start urgent help" → `/start`. "Read the mission" → `/mission`. Footer: Contact/Privacy/Terms.

**Dead ends or gaps:** None found.

## /mission
**Purpose:** Mission/pledge page with a "choose your path" section mirroring the homepage funnels.
**Auth:** Public.
**Every interactive element:**
- TopShell nav. Path card "Urgent help" → `/start`. Path card "Plan ahead" → `/contact?category=planning`. Path card "Funeral homes" → `/contact?category=funeral-home`. Footer: Contact.

**Dead ends or gaps:**
- **Inconsistency with homepage:** on `/`, "Planning ahead" and "Funeral home" cards link directly to `/pricing` and `/organization/start`; on `/mission` the equivalent cards route to `/contact` with a pre-filled category instead. Two marketing pages send the same intent down two different funnels (self-serve checkout vs. contact-first).

## /guides
**Purpose:** Gated content library (4 guides) that unlocks after email submission — lead-gen into HubSpot.
**Auth:** Public. Unlock state remembered via `localStorage` key `passage_guides_unlocked_email` (not a real account).
**Every interactive element:**
- TopShell nav.
- Tab buttons (one per guide, 4 total) — pure client state, switches displayed guide, no network call.
- **If not unlocked:** form instead of content — hidden `guideTitle`, "Name" (optional), "Email" (required), submit "Unlock this guide" ("Unlocking…" pending) → `unlockGuide` (app/guides/actions.ts).
  - Invalid email → "Enter a valid email to unlock this guide."
  - Calls `recordContactInquiry(...)` and **ignores its return value entirely** — success is always reported regardless of whether HubSpot actually succeeded.
  - Always returns `status: 'unlocked'` on regex-valid email; sets localStorage; reveals ALL 4 guides (unlock is global, not per-guide).
- **If unlocked:** guide content renders directly.

**Dead ends or gaps:**
- **Confirmed gap:** `unlockGuide` never checks `recordContactInquiry`'s result — even if HubSpot lead capture silently fails, the user is told it worked. The `GuideUnlockState` type includes an `'unavailable'` status that is never actually returned.
- Unlock is a client-only `localStorage` flag — clearing storage/different browser re-locks; no re-unlock-without-resubmitting mechanism; submitting for one guide unlocks all 4 (inconsistent with the per-guide `guideTitle` tracking).

## /privacy
**Purpose:** Static privacy policy (effective Aug 15, 2026).
**Auth:** Public.
**Every interactive element:** TopShell nav, "Contact Passage" → `/contact`, "Terms of service" → `/terms`, footer Contact/Terms.
**Dead ends or gaps:** None.

## /terms
**Purpose:** Static terms of service (effective Aug 15, 2026).
**Auth:** Public.
**Every interactive element:** TopShell nav, "Contact Passage" → `/contact`, "Privacy overview" → `/privacy`, footer Contact/Privacy.
**Dead ends or gaps:** None.

## /login
**Purpose:** Unified sign-in gateway for general/funeral-home/vendor audiences, with `?next=`-derived copy and `?error=`/`?status=` messaging.
**Auth:** Public page; redirects post-success.
**Variants:**
- `next` sanitized via `safeInternalPath`. Audience derived from `next` prefix: `/partner*`→vendor copy; `/director*`/`/staff*`/`/organization*`→funeralHome copy; else→general copy.
- `?error=` map: `callback`→"Passage could not verify that sign-in. Nothing was joined or changed. Please try again."; `unavailable`→"Secure sign-in is unavailable in this environment."; `membership-required`→"This account does not have an active membership here."; `director-required`→"This workspace is limited to an authorized director." Unrecognized codes render nothing.
- `?status=signed-out` (no error) → "You are signed out. No workspace data is visible."
- `error=membership-required` + funeralHome audience → extra "New funeral home? Set up your organization" → `/organization/start`.
- `error=membership-required` + vendor audience → extra "New vendor? Set up your vendor account" → `/partner/start`.
- Runtime config unavailable → static "Secure sign-in is not available here." block, no interactivity.
- Audience "general" → footer "New here? Set up a funeral home" / "set up a vendor account" links.

**Every interactive element (LoginClient):**
- (if googleEnabled) "Continue with Google" ("Opening Google…") → Supabase `auth.signInWithOAuth` (Google, `redirectTo=/auth/callback?next=<next>`).
  - Disabled-but-rendered defensive check → "Google sign-in is not enabled in this environment..." (dead code — button only renders when enabled).
  - Supabase error → "Google sign-in is unavailable right now. Your invitation has not been changed."
  - Success → browser redirected into Google OAuth, eventually `/auth/callback`.
- (if emailEnabled) Email input + "Request secure email link" → Supabase `auth.signInWithOtp` (`emailRedirectTo=/auth/callback?next=<next>`; `shouldCreateUser` true only if `next` looks like a valid `/invite/<token>`).
  - Failure → "Passage could not request an email sign-in link. No account access was granted."
  - Success → "Request received. If email delivery is available for this invited address, use the link to return and finish server verification." (no navigation, check email)
- (if passwordEnabled) Email + Password + "Sign in securely" ("Verifying account…") → `auth.signInWithPassword`.
  - Failure → "Passage could not verify that email and password. No workspace access was granted."
  - Success → `router.replace(next)` then `router.refresh()`.
- "Invitation code" input + "Review invitation" → validates token format client-side.
  - Failure → "Use the complete invitation code from your email link."
  - Success → `router.push('/invite/<encoded token>')`.
- If neither Google nor email enabled: static "Email delivery and Google sign-in are not available here. Use the secure account credentials provided by your administrator."

**Dead ends or gaps:**
- After requesting a magic link/OTP, no resend/cooldown UI, no indication of link validity duration.
- `error=director-required` and `error=callback` have no follow-up action link (unlike `membership-required`, which gets a helpful setup link).

## /demo
**Purpose:** Illustrative-only "how Passage works" walkthrough using a fixed example case (Sofia Rivera / Northstar Funeral Home) — explicitly NOT a real interactive demo.
**Auth:** Public.
**Every interactive element:**
- TopShell nav.
- `ContinuityRail` component (visual steps, not confirmed further interactive here).
- "Book a live walkthrough" → `/contact?category=demo`
- "Set up your funeral home" → `/organization/start`
- Footer "Back to passage home" → `/`

**Dead ends or gaps:**
- Source comment documents this page used to link each persona card straight into real authenticated routes (`/director`, `/staff`, `/family`, `/receive`), so an anonymous visitor clicking "OPEN" landed on a login wall — deliberately removed. A real interactive/no-login demo is tracked separately (roadmap Phase K) but doesn't exist yet — so the homepage's "See how it works" button (which links here) doesn't deliver an actual live demo, just a static walkthrough.

## Group B — Signup / Invitation acceptance / Blog

# Group B: Signup / Invite / Blog pages

## /organization/start
**Purpose:** Self-serve signup flow for a funeral home to create its own organization (the signed-in user becomes owner).
**Auth:** Requires sign-in. If runtime config unavailable, shows "Set up isn't available here." If not signed in, shows sign-in prompt. If the user already has an active `organization_members` row, redirects them to a "already set up" state instead of the form.

**Every interactive element:**

*Variant: runtime unavailable*
- No interactive elements besides the header "PASSAGE" logo link (`Link href="/"`).

*Variant: not signed in*
- "PASSAGE" logo link → `/`
- "Sign in or create an account" (link, styled as primary button) → `loginPath('/organization/start')` i.e. `/login?next=%2Forganization%2Fstart`. No server action; just navigation.

*Variant: already belongs to an active org*
- "PASSAGE" logo link → `/`
- "Open your workspace" (link) → `/director`

*Variant: form (signed in, no active membership)*
- "PASSAGE" logo link → `/`
- Form fields: Funeral home name (`organizationName`, required, maxLength 200), First location name (`locationName`, required, maxLength 200), City (`city`, optional, maxLength 100), State (`state`, optional, maxLength 56).
- Submit button "Create my organization" (shows "Setting up…" while pending) → calls server action `createOrganization` (app/organization/start/actions.ts), which:
  - Re-validates sign-in server-side (`verifiedUser`).
  - Calls Supabase RPC `self_serve_create_organization` with the four fields (empty city/state become `null`).
  - On success: fires non-blocking HubSpot side-effects (`upsertOrganizationCompany`, `upsertContact` with lifecycle stage "funeral home director/employee", `createTrialDeal` for a 90-day "Pilot Active" trial deal, `createSelfServeSignupTask`) — all wrapped in `.catch(() => null)` so HubSpot failures never block org creation.
- **On success:** Form is replaced with: notice "Your organization is set up. Head to your workspace to add locations, invite your team, and start your first case." plus link "Open your workspace" → `/director`.
- **On failure (exact copy from code):**
  - Empty/too-long org name → "Enter your funeral home's name. Nothing was created."
  - Empty/too-long location name → "Enter your first location's name. Nothing was created."
  - City > 100 chars → "Shorten the city name. Nothing was created."
  - State > 56 chars → "Shorten the state. Nothing was created."
  - No Supabase client (env unavailable) → "Passage could not verify sign-in right now. Nothing was created."
  - Not signed in server-side → "Sign in before creating an organization. Nothing was created."
  - RPC error code `28000` → "Sign in before creating an organization. Nothing was created."
  - RPC error code `22023` with message containing "already belongs" → "This account already belongs to an active organization. Sign in with a different account, or ask that organization's owner to invite you."
  - RPC error code `22023` (other) → "Review the organization and location names. Nothing was created."
  - Any other RPC error → "Passage could not create the organization right now. Nothing was created."
  - RPC succeeded but no receipt row returned → "Passage did not confirm the new organization. Nothing is shown as created."

**Dead ends/gaps:**
- The failure states render inline via `role="alert"` but the form fields are **not cleared or repopulated with prior values** — after any error, the user must retype everything.
- HubSpot failures are silently swallowed (`.catch(() => null)`) — if company/contact/deal/task creation fails, there is no visible indication to the user or any retry/backfill mechanism; the org exists but sales/marketing tracking silently didn't happen.
- No client-side validation matching server limits beyond native HTML `maxLength`.

## /partner/start
**Purpose:** Self-serve signup for a vendor/partner business to create its own vendor organization (signed-in user becomes owner).
**Auth:** Requires sign-in. Unavailable-runtime and already-member states mirror `/organization/start`.

**Every interactive element:**

*Variant: runtime unavailable* — same pattern, no vendor-specific interactivity.

*Variant: not signed in*
- "PASSAGE" logo → `/`
- "Sign in or create an account" → `loginPath('/partner/start')` → `/login?next=%2Fpartner%2Fstart`

*Variant: already belongs to an active vendor org*
- "PASSAGE" logo → `/`
- "Open your workspace" → `/partner`

*Variant: form (signed in, no active vendor membership)*
- "PASSAGE" logo → `/`
- Fields: Business name (`organizationName`, required, maxLength 200), Category (`category`, `<select>` required, options from `VENDOR_CATEGORIES`/`VENDOR_CATEGORY_LABELS`), Contact email (`contactEmail`, optional, type email), Contact phone (`contactPhone`, optional, type tel).
- Submit "Create my vendor account" (pending label "Setting up…") → server action `createVendorOrganization` (app/partner/start/actions.ts):
  - Validates org name and category against `VENDOR_CATEGORIES`.
  - Re-verifies sign-in.
  - Calls RPC `self_serve_create_partner_organization` with name, category, contact email/phone (empty → `null`).
  - On success: non-blocking HubSpot `upsertOrganizationCompany` (with vendor category and phone) and `upsertContact` (using `contactEmail` if provided, else the signed-in user's email) with lifecycle stage "vendor owner/employee".
- **On success:** Form replaced by notice "Your vendor account is set up. Next, set up payouts so funeral-home directors can send you requests." plus link "Set up payouts" → `/partner/payouts`.
- **On failure (exact copy):**
  - Missing/too-long business name → "Enter your business name. Nothing was created."
  - Invalid/missing category → "Choose a category. Nothing was created."
  - No Supabase client → "Passage could not verify sign-in right now. Nothing was created."
  - Not signed in → "Sign in before setting up your vendor account. Nothing was created."
  - RPC error `28000` → "Sign in before setting up your vendor account. Nothing was created."
  - RPC error `22023` + "already belongs" → "This account already belongs to an active vendor organization. Sign in with a different account."
  - RPC error `22023` (other) → "Review the business name and category. Nothing was created."
  - Other RPC error → "Passage could not create your vendor account right now. Nothing was created."
  - No receipt row → "Passage did not confirm the new vendor account. Nothing is shown as created."

**Dead ends/gaps:**
- Same HubSpot-silent-failure pattern as `/organization/start`.
- The success copy only offers "Set up payouts" — no "Skip for now" / "Go to dashboard" link if the vendor doesn't want to configure payouts immediately.

## /admin/organizations/new
**Purpose:** Platform-admin-only, sales-assisted tool to bootstrap a new funeral-home organization plus a director invitation, without automatic email.
**Auth:** Requires sign-in; additionally requires `is_platform_admin` RPC to return `true`. `force-dynamic`, `revalidate = 0`.

**Every interactive element:**

*Variant: runtime unavailable*
- Static message only, "Not available here." + reason text. No links at all (not even logo/home).

*Variant: not signed in*
- "Sign in" (link) → `loginPath('/admin/organizations/new')`. (No logo/home link in this variant either.)

*Variant: signed in, not a platform admin*
- No interactive elements at all — just "Your account isn't a platform admin." **Genuine dead end: no link back home, no way to request access, nothing.**

*Variant: platform admin, form*
- "PASSAGE" logo → `/`
- Fields: Funeral home name (`organizationName`, required, maxLength 200), First location name (`locationName`, required, maxLength 200), Director email (`directorEmail`, required, type email), Purpose (`purpose`, optional, maxLength 240, defaults to "New funeral home onboarding.").
- Submit "Create organization and invitation" (pending: "Creating…") → server action `adminCreateOrganization`:
  - Validates all fields (email regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`).
  - Re-verifies sign-in (does **not** re-check `is_platform_admin` in the action — relies on the RPC's own authorization).
  - Calls RPC `admin_bootstrap_organization`.
  - On success: non-blocking HubSpot `upsertOrganizationCompany`/`upsertContact`.
- **On success:** Receipt view — notice "Organization created. Share this secure invitation link with the director through your approved private channel. Passage cannot show it again." `<dl>` with Director email, Expires, Token proof. If `receipt.invitePath` truthy: link "Open secure invitation" → `/invite/{raw_token}` (`prefetch={false}`). Link "Onboard another funeral home" → `/admin/organizations/new`.
- **On failure (exact copy):**
  - Missing/too-long org name → "Enter the organization name. Nothing was created."
  - Missing/too-long location name → "Enter the first location name. Nothing was created."
  - Invalid director email → "Enter a valid director email address. Nothing was created."
  - No Supabase client → "Passage could not verify sign-in right now. Nothing was created."
  - Not signed in → "Sign in with a platform-admin account. Nothing was created."
  - RPC error `42501` or `28000` → "Platform admin authority is required. Nothing was created."
  - RPC error `22023` → "Review the organization, location, and director email. Nothing was created."
  - Other RPC error → "Passage could not create the organization right now. Nothing was created."
  - Receipt missing ids → "Passage did not return a complete creation receipt."

**Dead ends/gaps:**
- **Non-admin dead end:** zero navigation, no way out except browser back/URL bar.
- **One-shot invite token risk:** if the RPC succeeds but doesn't return `raw_token`, the admin sees the receipt (email, expiry, token hint) but **no way to actually retrieve or open the invitation link** — no resend/regenerate fallback.
- No copy-to-clipboard for the invite link/token.
- Page-level `is_platform_admin` check is purely a rendering gate, not a security boundary (auth fully delegated to the RPC).

## /invite/[token]
**Purpose:** Organization (staff/director) invitation acceptance page.
**Auth:** Public to view; accepting requires sign-in with the matching verified email.

**State/variant logic:** Token format validated first (`^[A-Za-z0-9_-]{32,256}$`), then `inspect_organization_invitation` RPC fetches details regardless of auth state.

**Every interactive element, by variant:**

*Global:* "PASSAGE" logo → `/`. Runtime label badge if applicable.

*Error banner variants* (`?error=` query param, or `stateError`):
- `invalid` → "This invitation link is incomplete or invalid."
- `environment` → "Invitation acceptance is unavailable in this environment. Nothing was joined or changed."
- `email-mismatch` → "Sign in with the verified email address that received this invitation."
- `claimed-other` → "This invitation or membership needs help from the funeral-home administrator."
- `access-ended` → "This invitation was accepted earlier, but that team access has ended. No funeral-home work is visible."
- `unavailable` → "This invitation is no longer available. Ask the funeral-home administrator for a new one."
- `verification` → "Passage accepted the request but could not verify the refreshed membership. Access remains closed; try again or ask the administrator for help."
- `retry` → "Passage could not verify the invitation right now. Nothing is shown as accepted. Please retry."
- Link "Retry invitation check" → reloads same page, clears query params.

*Variant: receipt (`?receipt=accepted`, invitation state `accepted`)*
- Page re-runs `accept_organization_invitation` RPC server-side on this GET (idempotent replay) to fetch the receipt.
- "MEMBERSHIP VERIFIED" / "You're ready to enter your workspace." Full `<dl>`: Organization, Locations, Account, Role, Status, Accepted, Visible to, Proof saved to, Next action.
- Link/button "Open staff workspace" or "Open director workspace" (depends on role) → `/staff` or `/director`.

*Variant: `available`, not signed in*
- "Sign in before joining." Link "Continue to secure sign-in" → `loginPath(invitePath)`.

*Variant: `available`, signed in*
- "Ready to join {organization_name}?" Form → `acceptInvitation(token)` server action, button "Accept invitation" ("Accepting…" pending).
  - Server action flow: validates token → no client → not signed in (redirect to login) → calls RPC `accept_organization_invitation` → maps errors to codes (`email-mismatch`, `claimed-other`, `access-ended`, `unavailable`, `retry`) → re-verifies session → **replays the same RPC a second time** and compares results (durability check) → mismatch → `?error=verification` → on full success, non-blocking HubSpot upsert → redirects to `${invitePath}?receipt=accepted` (triggering a **third** RPC call on page render).

*Variant: `expired`*
- Static text only: "This invitation expired. Ask the funeral-home administrator for a new invitation." No action button.

*Variant: `revoked`*
- Static text: "This invitation was revoked. No access was granted." No action.

*Variant: `accepted` (revisited without `?receipt=accepted`)*
- Static text: "This invitation was already claimed. Sign in with the accepting account or ask the administrator for a new invitation." **No actionable sign-in link offered** (unlike the `available`+signed-out variant).

*Variant: `access_ended`*
- Static text, no action.

**Dead ends/gaps:**
- **Triple RPC call for one acceptance** (accept action calls it twice for a replay/durability check, then the page calls it a third time for the receipt). If that third call fails silently, the user lands on `?receipt=accepted` but sees the confusing "already claimed" static-text dead end instead of their receipt/workspace link.
- **`accepted` state (non-receipt) has no sign-in link** — genuine dead end requiring manual navigation to `/login`.
- **`expired`, `revoked`, `access_ended` states offer zero next-step links.**

## /family-invite/[token]
**Purpose:** Family/case-participant invitation acceptance — grants read-only visibility into one case (not staff access).
**Auth:** Public to view; accepting requires sign-in with matching email.

**Every interactive element, by variant:**

*Global:* "PASSAGE" logo → `/`. Runtime label badge if applicable.

*Error/state-error variant* — **this page has no `?error=` query-param handling at all**, only `stateError` computed from token/config/RPC state:
- Invalid token format / no invitation row → "This invitation link is incomplete or invalid."
- Runtime unavailable → `configuration.reason`.
- RPC error → "Passage could not verify the invitation right now. Nothing is shown as accepted. Please retry."
- Link "Retry invitation check" → reloads page.

*Variant: `available`, not signed in*
- "Sign in before joining." Link "Continue to secure sign-in" → `loginPath('/family-invite/{token}')`.

*Variant: `available`, signed in*
- "Ready to view this case?" Form → `acceptFamilyInvitation(token)`, button "Accept invitation" ("Accepting…").
  - Server action: token check → no client → not signed in → calls RPC `accept_case_family_invitation` → maps errors (`email-mismatch`, `claimed-other`, `unavailable`, `retry`) → no `workflow_id` → `retry` → on success, non-blocking HubSpot upsert (lifecycle "participant") → **redirects directly to `/case/{workflow_id}/today`** — no intermediate receipt screen, no idempotency-replay double-check (only one RPC call, unlike the org-invite flow's two).

*Variant: `expired`*
- Static: "This invitation expired. Ask whoever sent it for a new invitation." No action.

*Variant: `revoked`*
- Static: "This invitation was revoked. No access was granted." No action.

*Variant: `accepted`*
- Static: "This invitation was already claimed. Sign in with the accepting account or ask for a new invitation." No sign-in link (same gap as org-invite page).

**Dead ends/gaps — CONFIRMED BUG:**
- **Error query params are silently dropped.** `FamilyInvitationPage`'s function signature only destructures `{ params }`, never reads `searchParams`. Every failure path in `acceptFamilyInvitation` redirects to `${invitePath}?error=<code>`, but the page has no code path that surfaces it — the specific, helpful failure copy defined in the page's own `failureMessages` map is **dead code that can never be shown to the user**. On any failure (email mismatch, claimed by another account, unavailable, retry), the user just sees the form again with **zero explanation of what went wrong.**
- **No receipt/confirmation screen** on success — redirects straight into `/case/{workflow_id}/today` with no "Membership verified" interstitial and no durability replay-check (unlike the org-invite flow).
- Same "`accepted`" state dead end: no sign-in link for a signed-out user revisiting an already-claimed link.
- `expired`/`revoked`: no next-step link at all.

## /blog
**Purpose:** Public marketing blog index.
**Auth:** Fully public.

**Every interactive element:**
- Standard `TopShell` nav (mode="gateway", context="Blog").
- Cross-link card "Need the practical checklist right now?" → `/guides` (entire card clickable).
- Per-post card (category · date, title, excerpt, "Read post") → `/blog/{post.slug}` (entire card is one link).
- Footer: "Contact Passage" → `/contact`; "Privacy" → `/privacy`; "Terms" → `/terms`.

**On success/failure:** Pure navigation, no forms/RPCs. Nothing can fail except a broken destination or zero posts (no empty-state copy for an empty list).

**Dead ends/gaps:**
- No empty-state message if `getSortedBlogPosts()` returns nothing.
- No pagination/search/category filtering.

## /blog/[slug]
**Purpose:** Individual blog article (public, statically generated).
**Auth:** Fully public.

**Every interactive element:**
- `TopShell` nav (context="Blog", mode="gateway").
- Sidebar "Start here" links: "Start urgent help" → `/start`; "Plan ahead" → `/pricing`; "Open free guides" → `/guides`; "Talk to Passage" → `/contact`.
- Article body: static sections/FAQ, no interactive elements.
- JSON-LD script tag (SEO only, not interactive).

**On success/failure:** Unknown slug → `notFound()` (standard Next.js 404; no local `not-found.tsx` found in this directory, so likely not custom-branded).

**Dead ends/gaps:**
- **No "back to blog" / "all posts" link anywhere on the article page.** Sidebar only offers `/start`, `/pricing`, `/guides`, `/contact` — none is `/blog`. Reader has no direct way back to the index besides browser back or top nav.
- Possible unbranded 404 for unknown slugs (needs separate confirmation).

## Group C — Family / D2C case pages + billing

# Group C: Family / D2C case pages + billing

## /case
**Purpose:** Landing redirector for a signed-in D2C subscriber (target of Stripe invite email and `/pricing/success`) — resolves the user's own workflow and forwards them into it.
**Auth:** Requires sign-in. Supabase client unavailable → redirect `/`. Not signed in → `loginPath('/case')`.
**Every interactive element:** None — pure server-side redirect.
- Queries `workflows` for earliest `id` where `user_id = current user`. Found → `redirect('/case/${id}/today')`. None → `redirect('/case/start')`.
**Dead ends or gaps:** Only ever picks the single oldest workflow — a user with multiple family records (e.g. from `addEstateSeat`) has no way from this route to choose among them; always sent to the first created.

## /case/start
**Purpose:** Fallback manual entry point to create a family record for a signed-in, actively-subscribed user without one yet (normal path is automatic at Stripe checkout).
**Auth:** Requires sign-in + active/trialing subscription. Redirects to `/case/${id}/today` if a workflow already exists.
**Every interactive element:**
- Not signed in → "Sign in or create an account" → `loginPath('/case/start')`.
- No active subscription → "View plans" → `/pricing`.
- Eligible → `StartFamilyRecordForm`: "Who is this record for?" (`personName`, required, ≤200), "Your relationship" (`relationship`, optional, ≤100), button "Start my family record" ("Starting…" pending) → `startFamilyRecord` action.
  - Empty/too-long name → `validation`: "Enter a name. Nothing was created."
  - No Supabase client → `unavailable`: "Passage could not verify sign-in right now. Nothing was created."
  - Not signed in → `denied`: "Sign in before starting your family record. Nothing was created."
  - RPC `self_serve_create_family_record`: `28000`→same denied message; `42501`→`denied`: "An active plan is required. Choose a plan to continue."; `22023`→`validation`: "Enter a valid name. Nothing was created."; other→`unavailable`: "Passage could not start your family record right now. Nothing was created."
  - Missing `workflow_id` in receipt → `unavailable`: "We could not confirm your family record was created. Try again."
  - Success → `redirect('/case/${workflow_id}/today')`.
**Dead ends or gaps:** None major.

## /case/[id]
**Purpose:** Pure redirector to Today tab.
**Auth:** None enforced here (delegated to `today`).
**Dead ends or gaps:** None.

## /case/[id]/today
**Purpose:** "What's happening now" home page — current task + recent updates.
**Auth:** Requires sign-in (`loginPath('/case/${id}/today')`). Authorization via `loadFamilyCaseView` (owner via RLS, or bounded participant view).
**Every interactive element:** `CaseNav` top nav only — page itself is read-only (hero with phase/person/family name + current task, "Recent updates" list). No buttons/forms.
**On failure (`Closed`):** `not-authorized`→"This case is not available to your account."; `not-found`→"This case could not be found."; `unavailable`(default)→"Passage could not open this case right now." All: "Nothing changed, and no case details were shown. Ask the funeral home for a new link, or try again." + link "Return home" → `/`.
**Dead ends or gaps:** No way to act on the "Now" task from here (must go to Tasks). "Recent updates" capped at 3 with no "view all" link — older history unreachable from this page.

## /case/[id]/tasks
**Purpose:** Full list of case steps (open + completed), including vendor/partner requests, with self-serve completion toggle when applicable.
**Auth:** Requires sign-in. Uses `loadFamilyTaskList`.
**Every interactive element:**
- `CaseNav` top nav.
- Per open task: `TaskCompletionToggle` — only rendered when `item.version !== null` (self-serve/no-org case, owner-completable). Vendor-request items always `version: null` → never get this control.
  - Button "Mark done" ("Saving…" pending) → `setFamilyTaskCompletion` action → RPC `set_family_task_completion_idempotent`.
    - Validation failure → "This step could not be updated. Reload the page, then try again."
    - No client → "We could not open this case right now. Nothing changed. Try again."
    - Not signed in → "Sign in to update this step."
    - RPC `42501`/`28000` → "This step is not available to your account. Nothing changed." (actual gate: org-backed/non-owner always denied)
    - RPC `40001` (version conflict) → "This step changed elsewhere. Reload the page, then try again."
    - Other error → "Passage could not update this step. Nothing changed. Try again."
    - Missing receipt → "We could not confirm this step was updated. Reload before trying again."
    - Success → "Marked complete." (or "Reopened." if un-completing); revalidates tasks+today; form remounts with fresh version.
- Completed items with `version !== null`: same toggle pre-set to "Mark not done" (submits `completed=false`).
- Non-toggleable items (vendor requests, org-backed tasks): plain text status, no button.
**On page-load failure (`Closed`):** `not-authorized`; `not-found`; `participant-not-supported`→"The full task list isn't available for invited access yet. Check Today for what's currently happening." (accepted, updates-scoped participant — not owner — tries direct access); `unavailable`(default). All + link "Back to Today" → `../today`.
**Dead ends or gaps:**
- A participant (invited/accepted, non-owner) hitting this URL directly is explicitly blocked with the "not available for invited access yet" message — documented gap, not a bug.
- Vendor-request items always read-only for family, no way to message the vendor from this page.

## /case/[id]/messages
**Purpose:** Two things in one page: (1) in-app message thread with the care team, (2) real outbound email composer/sender to relatives/friends/care team.
**Auth:** Requires sign-in. Uses `loadFamilyMessagesView`. Communications RPC fails closed to empty list for callers who can't reach it (e.g. invited participants).
**Every interactive element:**
- `CaseNav` top nav.
- **MessageThread** (shared with director's Case Room):
  - Textarea "Write a message about this case" (required, ≤4000) + "Add message" ("Adding…") → `postWorkflowMessage` → RPC `post_workflow_message_idempotent`.
    - Validation failure → "Write a message before adding it."
    - No client → "We could not open this case right now. Nothing was added. Try again."
    - Not signed in → "Sign in to add a message to this case."
    - RPC `42501`/`28000` → "This case is not available to your account. Nothing was added."
    - RPC `22023` → "This message conflicts with an earlier request. Reload the case, then add it again."
    - Other error → "Passage could not add this message. Nothing was added. Try again."
    - Missing receipt → "We could not confirm the message was saved. Reload before trying again."
    - Success → "Message added to this case." (or "This message was already added." if replayed); revalidates messages+director case room.
  - Boundary copy: "People who can open this case can read it. Passage saves it here; no email or text is sent." (clarifies these are NOT emails)
- **Email updates section** (real outbound email, distinct from thread):
  - Existing communications listed: subject, body, recipients, status ("Sent."/"Failed to send: <reason>"/"Prepared, not yet sent.")
  - Per communication with `status !== 'sent'`: `SendFamilyCommunicationButton` — "Send" ("Sending…") → `sendTaskCommunication` action.
    - Validation failure → "This draft could not be sent. Reload the page, then try again."
    - No client → "We could not open this case right now. Nothing was sent. Try again."
    - Not signed in → "Sign in to send this message."
    - Can't reload draft list → "Passage could not open this draft. Nothing was sent. Try again."
    - Draft not found for account → "This draft is not available to your account. Nothing was sent."
    - Already sent (race) → "This was already sent." (no dup send)
    - Send failure (real email attempt) → calls `confirm_task_communication_failed_idempotent` → "Could not send: <reason>"
    - Send succeeds but confirm RPC errors → "This was sent, but Passage could not save the confirmation. Reload to check its status." (email genuinely went out; UI may be stale)
    - Full success → "Sent."; revalidates director case room + tasks + today.
  - `PrepareFamilyCommunicationForm` (always rendered at bottom): Subject (required, ≤200), Message (textarea, required, ≤4000), "Send to" (textarea, required, one email/line or comma-separated, e.g. `Aunt Carol <carol@example.com>`). "Prepare draft" ("Preparing…") → `prepareTaskCommunication` → RPC `prepare_task_communication_idempotent`.
    - Validation failure → "Write a subject and message before preparing this."
    - No valid recipient parsed → "Add at least one valid recipient email, one per line."
    - No client → "We could not open this case right now. Nothing was prepared. Try again."
    - Not signed in → "Sign in to prepare a message for this case."
    - RPC `42501`/`28000` → "This case is not available to your account. Nothing was prepared."
    - RPC `22023` → RPC's own message or fallback "This could not be prepared. Check the subject, message, and recipients."
    - Other error → "Passage could not prepare this message. Nothing was sent. Try again."
    - Missing receipt → "We could not confirm this draft was saved. Reload before trying again."
    - Success → "Draft prepared. Review it, then send."; **does NOT send the email**, only creates a row the user must then click Send on ("Nothing sends automatically.")
**On page-load failure (`Closed`):** `not-authorized`; `not-found`; `unavailable`(default). All + "Return home" → `/`.
**Dead ends or gaps:**
- Recipient parser silently drops any line that doesn't match a valid email regex — no per-line feedback; if ALL lines drop, generic error only.
- No delete/edit for a "Prepared, not yet sent" draft — only Send; mistaken drafts stay visible forever.
- Failed communications show raw `failure_reason`; clicking "Send" again on a failed draft just re-attempts (status isn't `'sent'`) — no distinct "retry" affordance.

## /family (SEPARATE SANDBOX — NOT the real family case UI)
**Purpose:** A self-contained interactive preview/demo (NOT connected to any real case/account) letting a visitor role-play creating a "family handoff" to a funeral home. Explicit in-copy label: "Preview demo: this choice stays on this device. It does not create an account, contact anyone, or change a real family record." Hardcoded data (Sofia Rivera / Rivera family), state in `localStorage`/`sessionStorage` + in-memory sandbox repository — **no Supabase calls, no auth check at all.**
**Auth:** None — fully public, no sign-in check anywhere.
**Every interactive element:**
- Wordmark "Passage" → `/family` (self-link, no-op).
- Skip link "Skip to handoff" → `#family-journey`.
- `FamilyIntentJourney`: buttons "Planning ahead" / "I need help today" (`aria-pressed`) — sets local intent, persists to `localStorage`. No navigation/backend.
- `TransferComposer` (4-step wizard, entirely local state):
  - Step nav "01 Receiver"/"02 Access"/"03 Timing"/"04 Review" — clickable only for completed/current steps.
  - Step 1: radio "Northstar Funeral Home" (selectable) / "Cedar & Stone Memorial" (**permanently disabled**, "Available in a later partner slice" — real dead end).
  - Step 2: checkboxes for 5 scope categories, live "N visible / N private" readout.
  - Step 3: radio 24h/3d/7d expiry.
  - Step 4: read-only review summary.
  - "Back" (hidden step 0) → phase-1. "Continue →" (steps 0-2, disabled unless step requirement met) → phase+1. Step 3: "Create preview pass →" ("Creating preview pass..." pending) — writes draft to `sessionStorage`, dispatches local in-memory action (no server call), `router.push('/family/pass')`.
**Dead ends or gaps:**
- "Cedar & Stone Memorial" option permanently disabled.
- **This entire `/family` and `/family/pass` flow is an unconnected marketing/product-preview sandbox**, not wired to any real case/workflow/account — its URL structure and copy closely resemble the real `/case/[id]/*` family experience but persist nothing real. Worth flagging as potentially confusing if surfaced to real users.
- No auth gate — publicly reachable, always shows the same hardcoded "Sofia Rivera" data regardless of viewer.

## /family/pass (same sandbox)
**Purpose:** Shows the "active" preview transfer pass from the `/family` wizard (or a hardcoded fallback if none created), with revoke control.
**Auth:** None.
**Every interactive element:**
- Wordmark → `/family`. "Family space" link → `/family`.
- `ActivePass`: reads `sessionStorage`, falls back to hardcoded `FALLBACK_PASS` if absent.
  - "Copy code" ("Copied" after click) → `navigator.clipboard.writeText(...)`; clipboard failures silently swallowed (still shows "Copied"). Disabled if status is `accepted`.
  - If `accepted`: "Return to family space" → `/family` (no revoke shown).
  - If not accepted: "Close this handoff" → confirm panel ("Close access now?...") with "Keep open" (dismiss) / "Yes, close it" → `revoke()`: clears sessionStorage, local in-memory action only (no server call), flips to `revoked` state.
  - Revoked state: "This pass cannot be opened now." + "Create a new handoff →" → `/family`.
**Dead ends or gaps:**
- Direct navigation with no prior sessionStorage draft shows a fully populated fake "active pass" (Northstar, 72h, three scopes) that the visitor never actually created — potentially misleading if ever linked from real product surfaces.
- "Accepted" status is unreachable through any visible UI action in this codebase — dead code path only reachable via the sandbox reducer, not any button here.

## /account/billing
**Purpose:** Shows current subscription plan/price/status; offers adding an extra "estate" seat or jumping to Stripe's hosted billing portal.
**Auth:** Requires sign-in (shows sign-in gate rather than redirecting when signed out).
**Every interactive element:**
- Signed-out → "Sign in" → `loginPath('/account/billing')`.
- No subscription → "View plans" → `/pricing`.
- Load-error → "We couldn't load your billing details." + "Nothing changed. Try again." — **no retry button**, static text only.
- Normal state:
  - `?error=...` banner → "Passage couldn't complete that. Nothing changed. Try again." (**generic — doesn't vary by the actual error reason** `unavailable`/`denied`/`no-subscription`, all rendered identically).
  - `?added=estate` banner → "Estate added to your subscription. It will appear on your next invoice."
  - Plan card: label (mapped via `PLAN_LABELS`, e.g. "Individual · Monthly"), amount, interval, renewal date, add-on seat count, raw subscription status.
  - "Add another estate" button (only when `canAddSeat`: `interval !== 'once'` AND status active/trialing — hidden for one-time plans, `past_due`, other statuses) → `addEstateSeat` action.
    - No client → `redirect(?error=unavailable)`. Not signed in → `?error=denied`. No active subscription/one-time interval → `?error=no-subscription`. No Stripe client → `?error=unavailable`.
    - Otherwise: increments existing Estate Add-On Stripe item quantity, or creates a new one at the plan-matched (monthly/annual) add-on price. Success → `revalidatePath`, `?added=estate`.
  - "Manage billing" button (only when `interval !== 'once'`) → `openBillingPortal` action.
    - Same error redirects as above (`unavailable`/`denied`/`no-subscription`).
    - Otherwise creates Stripe Billing Portal session (`return_url=/account/billing`), redirects browser off-site to Stripe (payment method, invoices, cancellation all handled there).
  - Footer "Contact Passage" → `/contact`.
**Dead ends or gaps:**
- **One-time/lifetime plans get NEITHER card** — no "Add another estate," no "Manage billing." Such a user has zero interactive billing controls, just read-only plan summary + Contact link. Real dead end if they need to update payment or need a receipt/invoice.
- **`past_due` status:** page shows the billing page but `canAddSeat` excludes `past_due` — seat-add silently hidden with no explanation, while "Manage billing" (interval-gated only) IS still shown so they can fix payment.
- **Generic `?error=` banner never differentiates reason** — matches the founder's stated frustration exactly: neither user nor support can tell from the UI what specifically failed.
- `addEstateSeat`/`openBillingPortal` always end in `redirect(...)` with no visible try/catch around the Stripe calls — an unhandled Stripe exception would surface as an uncaught server error/500 rather than the friendly banner.

## Shared component: CaseNav (components/family/CaseNav.tsx)
Used by Today/Tasks/Messages. Renders 6 segments:
- **Available (real links):** Today, Tasks, Messages.
- **Not available:** **Decisions, Service, Costs** — rendered as `<span aria-disabled="true" title="Not available yet">`, not links; clicking does nothing.
- **Confirmed gap:** no page files exist for `/case/[id]/decisions`, `/case/[id]/service`, `/case/[id]/costs` anywhere in the repo — direct URL navigation to those routes hits Next.js's default 404, not any custom Passage "coming soon" screen. The nav item is disabled in the UI, but a bookmarked/typed URL gets a generic 404.

## Group D — Director / Staff operations (funeral home internal tool)

# Group D: Director / Staff Operations pages

## /director (Today / Command Center)
**Purpose:** Director's daily work queue — active tasks org-wide, ownership, reassignment.
**Auth:** `OperationalBoundary` (`requiredWorkspace="/director"`), owner/director only. Staff hitting this → "This workspace is outside your role" + link to `/staff`. Signed-out → login. `demo` runtime wraps with a demo banner instead of blocking.

**Every interactive element:**
- "Manage team access" (link, only when zero tasks) → `/director/team`.
- "Review task" (link, per task card) → `/director/cases/{workflowId}?task={taskId}#proof`.
- `AssignTaskForm` (hidden for `proof_submitted`/`completed`): "New owner" select (authorized staff at that location) + required "Reason" → `assignTask` → RPC `assign_task_idempotent`.
  - Success → "Saved by Passage" receipt with timestamp (or "already saved" if replayed); revalidates `/director`, `/staff`, `/director/activity`.
  - Failure: permission (`42501`/`28000`) → "You do not have access to change this assignment. Nothing changed. Ask an organization owner for help."; version conflict (`40001`) → "Ownership changed before your action was saved. No change was made. Reload current work."; generic → "We could not save this assignment. Nothing changed. Try again."; client validation → "Choose authorized staff and explain why ownership is changing. Nothing changed."; not-director → "You need director access to make this change. Nothing changed."

**Dead ends or gaps:**
- Load failure → `Unavailable` with only "Reload today's work" back to `/director` itself — a loop if the failure persists.
- Reassignment candidate list is filtered to staff with an active location grant; if none exist, the button is permanently disabled with **no link to Team from the form itself** to fix it.

## /director/team
**Purpose:** Manage staff invitations, location access, case-creation rights.
**Auth:** Same `OperationalBoundary`, owner/director only.

**Every interactive element:**
- "Invite staff" (link) → `/director/invitations/new`.
- `RevokeInvitationForm` (per pending invite): required "Reason" → `revokeInvitation` → RPC `revoke_organization_invitation`.
  - Success → "The invitation was revoked. No access was granted." (or already-revoked replay); revalidates team + activity.
  - Failure: denied → "You need director access to make this change. Nothing changed."; validation → "Name the invitation and explain why access is being revoked. Nothing changed."; generic → "We could not save this invitation. Nothing changed. Try again."
- `StaffCaseCreationGrantForm` (per active member × location): granted → required "Reason" + "Remove case-creation rights"; not granted → "Allow creating cases here" (no reason needed) → `setStaffCaseCreationGrant` → RPC `set_staff_case_creation_grant_idempotent`.
  - Success → "This staff member can now create cases at this location." or "Case-creation rights were removed." (or replay message); revalidates team + activity.
  - Failure: standard denied/validation/conflict/unavailable pattern (conflict `55000` → "The case-creation grant changed before this action was saved. Reload and review it again.").
- `RevokeMemberForm` (per active member): required "Reason." **Disabled and labeled "Reassign N commitment(s) first"** if member has active (`assigned`/`in_progress`/`blocked`) tasks; otherwise "End team access" → `revokeMember` → RPC `revoke_organization_member_idempotent`.
  - Success → "Team access ended. Earlier activity remains in the record." (or replay); revalidates team, activity, staff.
  - Failure: standard pattern; conflict specifically → "Reassign active commitments before ending access. Nothing changed."

**Dead ends or gaps:**
- Load failure → only "Retry Team" self-loop link.
- **No UI to add a new location grant for an existing member** — only toggles an existing grant's `can_create_cases`. A member with no grants shows "No active location" with no in-page path to get one; must go through a fresh invitation.

## /director/activity
**Purpose:** Read-only audit log — invitations, assignments, task lifecycle events, actor, before/after state, reason.
**Auth:** Same `OperationalBoundary`, owner/director only.
**Every interactive element:** "Retry Activity" (link, only on load failure) → `/director/activity`. No forms/buttons otherwise — pure rendered list.

**Dead ends or gaps:**
- Entirely non-interactive despite being a full page — no filtering, pagination, or per-event links to jump to the referenced case/task (even though `task_title` is known in metadata).
- `humanState`/`eventLabels`/`stateLabels` are hardcoded maps; unmapped event names/states silently degrade to "Team activity updated"/"Status unavailable" — could hide real activity types silently as the schema evolves.

## /director/intake
**Purpose:** Marketing/demo "director quick intake" — simulate accepting a family Transfer Pass or starting a manual walk-in case.
**Auth:** Inherits `/director`'s `OperationalBoundary` (owner/director only) via shared layout. **BUT once inside, the entire page runs on `usePassageZero()` — a local, in-browser sandbox context, not real Supabase-backed data. No RPCs, no server actions, no `'use server'` file in this directory at all.**

**Every interactive element (all client-only, nothing persisted server-side):**
- "Open pass" (Transfer Pass code form) — validates against sandbox state. Failure: "Pass not found. Check the code or create a walk-in case." / "This family pass was closed. Ask the family to issue a new handoff." / "This pass was already accepted into {caseId}. Open the existing case instead." Success → local "verified" step, no server call.
- "Create minimal case" (manual walk-in form, requires Person + Family contact) — failure "Add the person and one family contact."; success → local "verified" step.
- "Start over" → resets to start step.
- Review step selects (location/accountable director/first assignee) — local state only, from `record.routingRules`.
- "Create preview case" / "Prepare preview draft" — pass mode validates locally via `validateIntakeRoute`; success dispatches a **local sandbox reducer action (no backend write)** and shows a "created" receipt. Manual mode always succeeds locally.
- "Open secure Preview workspace →" (pass mode, on receipt screen) → **`/director`** (the REAL page) — but nothing was actually created there.
- "Preview another family" → resets.

**Dead ends or gaps:**
- **Major gap:** entirely disconnected from the real case-creation pipeline. A director could believe they created a real case here — the header does say "This demo will not create a real case," but the "Open secure Preview workspace" link right after "Case created" strongly implies continuity into the real workspace. **This is the single biggest "if I click a button, what actually happens" trap in the director surface** — looks and behaves like production but silently no-ops server-side.
- Manual "Create minimal case" button's `onClick` redundantly calls `setMode('manual')` alongside the form's own `onSubmit` — harmless but sloppy.

## /director/invitations/new
**Purpose:** Create a single staff invitation with a location grant.
**Auth:** Calls `resolveOperationalViewer()` directly, additionally requires `isolatedPreviewInvitationEnabled(configuration)` AND role owner/director. Either check failing → no form rendered.

**Every interactive element:**
- "← Director workspace" (link) → `/director`.
- `InvitationForm`: "Verified staff email" (required), "Authorized location" (select, required), "Purpose" (required, default "Team access for this location"), "Expires" (datetime-local, required, min 1 day/max 30 days, default 7) → `createStaffInvitation` → RPC `create_employee_invitation_idempotent_v2`.
  - Success ("created"/"already-pending") → receipt panel (recipient, role, location, purpose, expiry, created-by/at, invitation ID, delivery "Not sent · manual controlled handoff", token hint) + — **only if this exact call created it (not a replay)** — clickable **"Open secure invitation →"** link to `/invite/{token}` + warning not to screenshot/log it. Replayed calls show no link (token not recoverable).
  - Failure: exact copy — "Enter the verified staff email address. Nothing was created." / "Choose a location inside your verified authority. Nothing was created." / "Explain why this staff access is needed. Nothing was created." / "This invitation request expired before submission. Reload and try again." (stale request id) / "Choose a valid invitation expiry. Nothing was created."; server: "Passage could not verify authority for that invitation. Nothing was created." (denied), "That person already has active access or this request conflicts with another invitation. Nothing new was created." (conflict `23505`), generic unavailable.

**Dead ends or gaps:**
- If `canCreate` is false (feature flag off or role check fails redundantly), page shows: "We couldn't confirm your team access. No invitation was created. Return to the director workspace and try again." — **no explanation of WHY** (flag off vs. role vs. viewer-load failure), so a legitimate director with the feature disabled has no way to know it's a config issue.

## /director/urgent
**Purpose:** Triage queue of urgent intake requests (unclaimed org-wide + claimed-by-this-org) for a director to claim/convert.
**Auth:** Page-level re-check (`resolveOperationalViewer()` + owner/director), not solely relying on the shared layout boundary; own `Closed()` on failure.

**Every interactive element:**
- "Open request" (link, per card, both lists) → `/director/urgent/{requestId}`. No forms on the list page itself.

**Dead ends or gaps:**
- `Closed()`'s only exit is "Return to Today" — no retry-in-place link back to `/director/urgent` itself for a transient load failure, unlike most other pages.
- No urgency indicator beyond "Received {time}," no sort/filter, no visibility into whether another org already claimed an apparently-identical request.

## /director/urgent/[requestId]
**Purpose:** Detail view — claim a request, then create a case from it.
**Auth:** Same page-level owner/director check; `Closed()` fallback on failure.

**Every interactive element:**
- "← Urgent requests" (link) → `/director/urgent`.
- `ClaimUrgentIntakeForm` (only when `status === 'submitted'`): no fields → `claimUrgentIntake` → RPC `claim_urgent_intake_idempotent`.
  - Success → "Claimed. Create the case when ready." (or "You already claimed this request." if replayed); revalidates list + this detail path.
  - Failure: validation → "This changed before the action was ready. Reload the queue."; denied → "You do not have director authority to claim this. Nothing changed."; conflict `40001` → "This request changed before it was claimed. Reload the queue."; conflict `55000` (already claimed) → "This request is no longer waiting to be claimed. Reload the queue."; generic → "Passage could not claim this request. Nothing changed."
- `CreateCaseFromUrgentIntakeForm` (only when `status === 'claimed'` by viewer's org): "Location" (select, required), "Case reference" (required, ≤60), "Family name" (required, ≤200). If org has zero locations: replaced with static "No authorized location is available to open this case under yet." — **dead end, no link to fix.** → `createCaseFromUrgentIntake` → RPC `create_case_from_urgent_intake_idempotent`.
  - Success → "Case created." (or "This case was already created." if replayed); revalidates list, detail, `/director`.
  - Failure: validation → "Review the case details. Nothing was created."; denied → "You do not have director authority for this organization and location. Nothing changed."; conflict `40001`/`55000` → "This request changed before the case was created. Reload the page." / "This request is not ready for a case yet. Reload the page."; **trial-limit `55001`** → "Your 90-day trial has ended and you already have an active case. Upgrade to open another." — **no upgrade link/button provided, dead end**; generic unavailable.
- "Open the case →" (link, only when `status === 'case_created'` + `workflow_id` present) → `/director/cases/{workflowId}`.
- If claimed by a *different* org: "Another organization has claimed this." — **pure dead end, no action at all** besides the persistent "← Urgent requests" at top.

**Dead ends or gaps:**
- Trial-ended denial gives no way to actually upgrade from this screen — real dead end for a trial director trying to help a family mid-urgent-situation.
- No polling/live-refresh — if another org claims the request between load and click, recovery is just "reload the queue," no auto-redirect.

## /director/cases/[workflowId] (Case Room)
**Purpose:** Central per-case workspace — proof review for the selected task, vendor request management, family invitations, messaging, email communications, all scoped to one case.
**Auth:** `loadHostedOperations` (internally resolves operational viewer, owner/director gate); not-ok or unresolvable workflow/task → `Closed()`.

**This page has the most forms of any page in the app — every one listed individually:**

### Proof panel
1. **Verify proof** (`ProofReviewForms`): no fields (hidden `decision=verified`) → `reviewTaskProof` → RPC `review_task_proof_idempotent`.
   - Success → "Proof verified. The task is complete."; revalidates `/director`, this case page, activity, `/staff`.
   - Failure: validation → "Choose a valid proof decision and explain any replacement request. Nothing changed."; denied → "You need director access to make this change. Nothing changed."; **conflict `40001` → "Ownership changed before your action was saved. No change was made. Reload current work." — a copy bug: this message literally says "Ownership" even though it's shown for a proof-review conflict, because `rpcFailure()` is a shared helper reused verbatim from the assign-task code path**; `55000` → "The proof review changed before this action was saved. Reload and review it again."; generic unavailable.
2. **"Request replacement"** toggle button — expands/collapses a reason panel, local state only.
3. **Send replacement request** (inside expanded panel): required "Replacement reason" (≤500), client-validated before submit ("Explain what the task owner needs to replace. Nothing was changed.", focus returned to textarea). "Cancel" button closes panel. Calls same `reviewTaskProof` with `decision='needs_replacement'`.
   - Success → "Replacement requested. The task returned to the current owner."; same revalidation.
   - Failure: same shared error paths as #1 (including the same copy bug).
   - Recovery links on any result: "Reload current task" (→ `?task={taskId}`) and "Return to Today" (→ `/director`).

### Vendor (partner request) section — per request, status-dependent
4. **Approve & pay quote** (only `status === 'quoted'`): no fields → `approvePartnerQuote` → **redirects to a real Stripe Checkout Session** for the exact quoted amount (genuine external redirect).
   - Success: browser navigates to Stripe; `success_url`/`cancel_url` both point to `?vendorPayment=success|cancelled` — **but nothing in the page reads/displays that query param**, so a director returning from Stripe gets no on-page acknowledgment (see gap below).
   - Failure (pre-redirect): validation → "This request changed before the action was ready. Reload the case."; denied → "Approving a vendor quote requires director authority for this case. Nothing changed."; load failure → "We could not load this vendor request. Nothing changed."; conflict → "This request changed before approval. Reload the case."; no valid quote → "This request has no valid quote to pay. Reload the case."; Stripe unavailable → "Payments are not available right now. Nothing changed." / "Passage could not start the payment. Nothing changed."
5. **Decline quote** (only `status === 'quoted'`): required "Reason" (≤500) → `rejectPartnerQuote` → RPC `reject_partner_quote_idempotent`.
   - Success → "Vendor quote declined and saved in case history." (or replay); revalidates case page + `/director`.
   - Failure: validation → "Explain why you are declining this quote before saving."; denied → "Declining a vendor quote requires director authority for this case. Nothing changed."; conflict `40001` → "This quote changed before it was declined. Reload the case."; `55000` → "This request is no longer a quote waiting for approval. Reload the case."; generic unavailable.
6. **Verify vendor delivery** (only `status === 'proof_submitted'`): no fields → `verifyPartnerRequest` → RPC `verify_partner_request_idempotent`, then **automatically** attempts a Stripe transfer payout (`attemptPartnerPayoutRelease`), swallowing any payout error.
   - Success → "Vendor delivery verified. Payment to the vendor is being released automatically." (or replay); revalidates.
   - Failure: standard denied/conflict `40001`/conflict `55000` ("No delivery proof is waiting for review. Reload the case.")/generic pattern.
7. **Release vendor payment** (only `status === 'verified'` and `!payout_released_at` — manual recovery when step 6's automatic payout failed): no fields → `releaseVendorPayout` (re-attempts `attemptPartnerPayoutRelease`).
   - Success → "Vendor payment released."
   - "Nothing to release" (not an error) → "Nothing to release. This request may already be paid out, or the vendor has not finished payout setup."
   - Denied → "Releasing vendor payment requires director authority for this case. Nothing changed."
   - Exception → "Passage could not release this payment. Nothing changed. Try again."
8. **Send vendor request** (always shown unless `partnerOrganizations` is empty, replaced with static "No active vendors are available to request from yet." — **dead end, no link to add a vendor**): "Vendor" (select, required, shows name+specialty), "Category" (select, required, helper text: "Must match the chosen vendor's specialty" — **not enforced client-side**, only server-side after submit), "Title" (required, ≤200), "Details" (required textarea, ≤2000), "Needed by" (optional datetime-local) → `createPartnerRequest` → RPC `create_partner_request_idempotent`.
   - Success → "Vendor request sent and saved in case history." (or replay); revalidates case page + `/director`.
   - Failure: category mismatch `PS001` → "This vendor doesn't handle that category of request. Choose a matching vendor or category." (round-trip required since client doesn't pre-filter); denied → "You do not have director authority for this case. Nothing changed."; validation `22023` → "This request conflicts with an earlier command. Reload the case."; **trial limit `55001`** → "Your 90-day trial has ended. Upgrade to send vendor requests." — again **no upgrade action provided**; generic unavailable.

### Family access section
9. **Create family invitation**: "Their email" (required), "Their name" (required, ≤120), "Relationship to the case" (required, ≤80, default "Family member"), "Purpose" (required, ≤240, default "Stay updated on this case"), "Expires" (required datetime-local, default 14 days) → `createFamilyInvitation` → RPC `create_case_family_invitation_idempotent`.
   - Success → receipt (recipient, relationship, purpose, expiry) — if fresh token issued, **the raw secure link is shown as plain text inside a `<code>` tag, NOT a clickable link** (inconsistent with `/director/invitations/new`'s clickable "Open secure invitation →"). Director must manually copy/select text.
   - Failure: field-specific validation copy; denied → "Inviting family access requires director authority for this case. Nothing changed."; conflict `23505` → "That person already has active access or a pending invitation for this case. Nothing new was created."; generic unavailable.

### Messages section
10. **Add message** (`MessageThread`): required textarea (≤4000) → `postWorkflowMessage` → RPC `post_workflow_message_idempotent`.
    - Success → "Message added to this case." (or replay); revalidates `/case/{id}/messages` + this case page.
    - Failure: "Write a message before adding it." (client `required`); denied → "This case is not available to your account. Nothing was added."; validation `22023` → "This message conflicts with an earlier request. Reload the case, then add it again."; generic → "Passage could not add this message. Nothing was added. Try again."
    - **If `loadWorkflowMessages` fails to load, there is NO recovery link at all** — `recoveryHref` isn't passed to `MessageThread` on this page (unlike other load-failure states elsewhere that consistently offer a link back), just the bare error text.

### Communications section
11. **Prepare draft**: "About" (optional select — case in general or specific task), "Subject" (required, ≤200), "Message" (required, ≤4000), "Recipients" (required textarea, one email or "Name <email>" per line, malformed lines silently dropped by `parseRecipients` rather than flagged individually) → `prepareTaskCommunication` → RPC `prepare_task_communication_idempotent`.
    - Success → "Draft prepared. Review it, then send." — form resets, new draft appears in the list with a Send button; revalidates case page + family-facing `/case/{id}/tasks` + `/today`.
    - Failure: "Write a subject and message before preparing this." / "Add at least one valid recipient email, one per line."; denied → "This case is not available to your account. Nothing was prepared."; RPC validation `22023` → surfaces raw RPC message or fallback "This could not be prepared. Check the subject, message, and recipients."; generic unavailable.
12. **Send** (per prepared/failed communication, hidden once `sent`): no fields → `sendTaskCommunication` — re-reads the persisted draft server-side (doesn't trust client state), sends via `sendTaskCommunicationEmail`, confirms via RPC.
    - Success → "Sent."; revalidates case page + family tasks + today.
    - Partial success (email sent, confirm RPC failed) → "This was sent, but Passage could not save the confirmation. Reload to check its status." — genuine ambiguity surfaced honestly.
    - Already sent (race) → "This was already sent."
    - True failure → "Could not send: {reason}" (records via `confirm_task_communication_failed_idempotent`; list item then shows "Failed to send: {reason}").
    - Denied → "Sign in to send this message."
    - Validation (stale ids) → "This draft could not be sent. Reload the page, then try again."

**Dead ends or gaps (Case Room overall):**
- Two separate "trial ended" dead ends (vendor request, case creation from urgent intake) with **no in-app upgrade path/button anywhere in this section.**
- **Copy bug:** the shared `rpcFailure()` helper produces a conflict message saying "Ownership changed..." even for proof-review conflicts (`40001` specifically) — a real, visible bug a director would see during proof verification.
- Family invitation secure link is plain text, not clickable — inconsistent with the staff-invitation flow, easy copy/paste error.
- `MessageThread` on this page has zero recovery link on load failure (unlike elsewhere).
- Stripe `?vendorPayment=success|cancelled` redirect target is never read/displayed anywhere — no on-page confirmation banner after returning from a vendor-quote payment.
- Vendor category dropdown doesn't pre-filter/disable mismatched categories client-side — mismatch only caught server-side after submit (`PS001`), forcing an avoidable round trip.

## /staff (My Work)
**Purpose:** Staff member's personal queue of assigned tasks.
**Auth:** `OperationalBoundary` (`requiredWorkspace="/staff"`), role staff only. Owner/director hitting this → "This workspace is outside your role" + link to `/director`.

**Every interactive element:**
- `StartTaskForm` (only `status === 'assigned'`): no fields → `startTask` → RPC `start_task_idempotent`.
  - Success → "Work started and was saved in team activity." (or replay); revalidates `/staff`, `/director`, activity.
  - Failure: validation (stale version) → "This work changed before the action was ready. Reload My work."; denied (client-side copy) → "This task is not available to your account. Ask a director to confirm your assignment." — **note this differs from the RPC-error denied copy** ("This work is not available to your account. Nothing changed.") — two slightly different denial messages depending on which check catches it; conflict `40001` → "This work changed before your action was saved. No change was made. Reload My work."; conflict `55000` → "This work is no longer waiting to be started. Reload My work."; generic → "Passage could not start this work. Nothing is shown as changed."
- "Open proof step" (link, `status === 'in_progress'`) → `/staff/work/{taskId}`.
- "Open task history" (link, `status` `proof_submitted`/`completed`) → `/staff/work/{taskId}`.

**Dead ends or gaps:**
- `Unavailable()` only offers "Reload My work" self-loop.
- **No detail link at all for `assigned` tasks other than the Start button** — a staff member who wants to read task facts before starting has no way to reach `/staff/work/{taskId}` pre-start.

## /staff/work/[taskId]
**Purpose:** Single-task detail for staff — facts, proof submission, full proof/replacement history.
**Auth:** Via `loadHostedOperations`; unresolvable task/workflow → `Closed()`. No separate explicit role check visible beyond the viewer resolution itself.

**Every interactive element:**
- "← My work" (link) → `/staff`.
- `ProofSubmissionForm` (only when `canSubmit`: `in_progress` + (no proof yet, or latest review requested replacement)): "Evidence type" (select, required: Confirmation/Completed handoff/Reference confirmation/Completion note, default "Confirmation"), "What was completed" (required, ≤2000), "Supporting reference" (optional, ≤240, explicit warning against passwords/access codes/account numbers) → `submitTaskProof` → RPC `submit_task_proof_idempotent`.
  - Success → "Proof submitted for director review." (or "Already recorded. The original proof receipt was returned." if replayed); revalidates `/staff`, this page, `/director`, activity. Focus programmatically moved to result box.
  - Failure: validation (bad type/length/stale ids) → "Review the proof fields and reload if this task changed. Nothing changed."; denied `42501`/`28000` → "You no longer have access to this work. Nothing changed."; conflict `40001` → "This task changed since you opened it. Nothing changed. Reload current task."; conflict `22023`/`55000` → "This proof request no longer matches the current task. Nothing changed. Reload current task."; generic → "We could not save this proof. Nothing changed. Try again." Recovery links on any non-success: "Reload current task" + "Return to My work."

**Dead ends or gaps:**
- `Closed()` only offers "Return to My work," no retry-in-place.
- When `status === 'blocked'`: page says "Ask your director to help clear the blocker" but **provides no way to actually contact a director from this screen** (no Messages link/form — that only exists in the director-side Case Room).
- When `status === 'assigned'`: "Now" heading says "Start this work from My work," but **there's no button/link on this page itself to do so** — must navigate back to `/staff` and click Start there.

## /receive
**Purpose:** "Family Transfer Pass" inspection/acceptance flow — apparently meant to let a director accept an inbound family-controlled handoff into a case.
**Auth:** **NONE WHATSOEVER.** `app/receive/page.tsx` has no layout, no `OperationalBoundary`, no role/session check anywhere in `ReceiveWorkspace.tsx` — sits directly under root `app/layout.tsx`. Hardcodes `identity="Elena Torres"` / `role="Director · Northstar"` in every `AppFrame` call. **The entire flow runs against local sandbox state** (`usePassageZero()`) plus a hardcoded `PASS_RECORDS` lookup table — zero server calls anywhere in the file.

**Every interactive element:**
- "Inspect pass" (code-entry form, free text normalized uppercase) — validates against sandbox record + hardcoded `PASS_RECORDS` map, then `router.replace('/receive?code=...')` (purely a client-side URL update, not a real lookup).
  - Failure: "Enter the code shown beneath the family's QR pass." if empty. Four hardcoded example codes exist (`PASS-RIVERA-7K4M` active, `PASS-CHEN-EXPIRED` expired, `PASS-BROOKS-REVOKED` revoked, `PASS-LEE-ACCEPTED` already accepted) plus whatever the sandbox's current code is.
- "Different pass" (button) → `clearPass()`, resets, `router.replace('/receive')`.
- Case-destination radios: "Create intake" (selectable) vs "No other eligible case" (**permanently disabled**, "Duplicate destination is blocked for this handoff" — always unusable).
- "I reviewed the sender, scope, expiry, and destination" checkbox — required before accept.
- "Accept in preview →" — unchecked → "Confirm your review before accepting." Otherwise dispatches a local sandbox action and polls locally for confirmed state.
  - Failure (local reducer didn't confirm) → "Passage could not accept this handoff. Review the active pass and your director access, then try again." — **a purely client-side failure mode that references "your director access" even though no auth check exists on this page at all.**
- "Enter another code →" (on failure screens: expired/revoked/accepted/invalid) → `clearPass()`.
- "Open {caseId} ↗" (on final Receipt screen) → **`/director`** — again implying continuity into the real workspace that never actually received this data.
- "Receive another pass" (Receipt screen) → `clearPass()`.

**Dead ends or gaps:**
- **The single most significant gap in the entire director/staff surface: `/receive` has no authentication or authorization boundary at all**, unlike every other page in this section. Anyone with the URL — logged in or not, any role — can load it, and it displays a hardcoded "Elena Torres · Director · Northstar" identity regardless of who's viewing. It IS labeled with a "PREVIEW DEMO · CHANGES STAY ON THIS DEVICE" banner on the entry screen (so the intent to mark it as a demo exists — same pattern as `/director/intake`), but unlike `/director/intake` (which at least requires being signed in as a director first via the shared layout), `/receive` is reachable by literally anyone, signed in or not.
- Like `/director/intake`, the final "Open {caseId} ↗" link to `/director` is misleading — no such case exists in the real backend.
- "No other eligible case" destination option is permanently disabled with no explanation of when it would become available.

## Group E — Vendor / Partner

# Group E: Vendor / Partner pages

## /partner
**Purpose:** Vendor home page — queue of service requests sent to the vendor's organization, split Open/Closed.
**Auth:** `PartnerBoundary`/`resolvePartnerViewer()` gate on all `/partner/*`: active `partner_members` row (status active) linked to an active `partner_organizations` row, role owner/member. Not signed in → `loginPath('/partner')`. No active partner membership/inactive org/invalid role/DB error → "access remains closed" screen with "Return to sign in" + Sign out form. A funeral-home director/staff account has no path in here — hits `membership-required`.

**Every interactive element:**
- "Reload requests" (link, only if loader fails) → `/partner` (full reload).
- Per open request, `status === 'sent'`: `RespondToRequestForm` — radio "Send a quote"/"Decline" (toggles fields, no server call); quote path: amount (required, min 0, step 0.01) + optional note (≤2000); decline path: required reason (1–500). Submit → `respondToPartnerRequest` → RPC `respond_to_partner_request_idempotent`.
  - Validation failure → "Enter a valid quote amount before accepting." / "Explain why you are declining before saving." / "This request changed before the action was ready. Reload the queue."
  - Not authorized → "This request is not available to your account. Nothing changed."
  - No client → "We could not open this request right now. Nothing changed. Try again."
  - RPC `42501`/`28000` → same denied message.
  - RPC `40001` (version conflict) → "This request changed before your response was saved. Reload the queue."
  - RPC `55000` (wrong state) → "This request is no longer waiting for a response. Reload the queue."
  - Other error → "Passage could not save your response. Nothing changed."
  - Missing receipt → "We could not confirm your response was saved. Reload before trying again."
  - Success → replayed: "This response was already saved. The original decision is shown below."; new: "Quote sent. Work begins once the funeral home approves and payment is captured." (accept) or "Request declined and saved." (decline). Revalidates `/partner`, `/partner/requests/[id]`, `/director`.
- Per open request, `status === 'quoted'`: static "Quote sent. Work begins once the funeral home approves and payment is captured." No button.
- Per open request, `status === 'in_progress'`: `SubmitDeliveryProofForm` (same as `[requestId]` page, see below).
- Per open request, `status === 'proof_submitted'`: static "Delivery proof is waiting for the funeral home director to review." No button.
- "Open full history" (link, every card) → `/partner/requests/{id}`.
- Closed section (declined/verified): title + "Open full history" only.
- AppFrame chrome: brand "PASSAGE" → `/partner`; nav "Requests" (only item for `active="partner"`) → `/partner`; mobile disclosure + Sign out forms.

**Dead ends or gaps:**
- **No in-app link to Payouts from anywhere in the vendor's normal navigation.** `AppFrame` nav for `active="partner"` shows only "Requests." `/partner/page.tsx` never links to `/partner/payouts`. The only link anywhere is the one-time vendor-signup success screen. A vendor who abandons Stripe onboarding partway, or wants to check payout status later, has no discoverable way back — must know to type the URL. Real dead end for a money-movement flow.
- `Unavailable` (data-load-failure) discards the actual `result.message` (`function Unavailable({ message: _message })`) — specific failure reason never shown, only generic text.
- Category label mismatch: `HostedPartnerRequest.category` includes `'catering'`, but `VENDOR_CATEGORY_LABELS` keys it `'caterer'` (no `'catering'`/`'restaurant'`/`'cemetery'`/`'printer_stationery'` keys either, despite these being valid signup categories). Any request in those categories silently falls back to the generic label "Vendor request" — a real display bug for several vendor categories.

## /partner/payouts
**Purpose:** Vendor Stripe Connect (Express) payout account setup/status — must complete before a vendor is visible to directors' vendor picker.
**Auth:** Same `PartnerBoundary` gate. Owner-only for the actual setup action; a `member`-role user sees read-only status, no button.

**Every interactive element:**
- "Return to requests" (link, only if `loadPayoutStatus()` fails) → `/partner`.
- Error banners (`?error=`): `denied` → "Only the vendor account owner can set up payouts."; `unavailable` → "Passage could not start payout setup right now. Nothing changed."
- Status panel (read-only `<dl>`): Payout account (Created/Not created), Details submitted, Can accept charges, Can receive payouts, Visible to directors (Yes.../No — finish setup to appear in the vendor picker), Platform fee (static "12% of each verified order, withheld automatically before payout").
- "Set up payouts" / "Continue payout setup" (owner only, label depends on `hasAccount`) → `startPayoutOnboarding` action:
  1. Re-resolves viewer; not owner → `redirect(?error=denied)`.
  2. Stripe/Supabase client unavailable → `redirect(?error=unavailable)`.
  3. No `stripe_connect_account_id` yet: creates Stripe Express account, persists via RPC `create_partner_connect_account_idempotent`. RPC error → `redirect(?error=unavailable)` — **note: the Stripe account was already created at this point, just not linked in Passage's DB** — possible orphaned-Stripe-account edge case.
  4. Creates Stripe Account Link (`refresh_url=/partner/payouts?onboarding=refresh`, `return_url=/partner/payouts?onboarding=return`), redirects browser to Stripe-hosted onboarding (leaves the app entirely).
- Non-owner ("member") view: static "Only the account owner can set up or change payout details." — no action at all, by design.
- Return from Stripe (`?onboarding=return`): auto-runs `syncPayoutStatusOnReturn()` server-side on load (not a button) — re-fetches live Stripe account status, calls RPC `sync_own_partner_connect_status` to sync immediately rather than waiting for the webhook. Retrieval/RPC failures silently swallowed (`.catch(() => null)`), no error surfaced — page just shows last-persisted status.
- `?onboarding=refresh` (Stripe's refresh_url, expired/invalid account link): **no special handling at all** — loads the normal status view, no sync, no banner explaining why the user was sent back.
- AppFrame chrome: same as `/partner`.

**Every state a vendor's Stripe Connect account can be in, and what the UI shows:**
| State | hasAccount | detailsSubmitted | chargesEnabled | payoutsEnabled | Label | Button | Visible to directors |
|---|---|---|---|---|---|---|---|
| Never started | false | false | false | false | "Not set up yet" | "Set up payouts" | No |
| Account created, onboarding unfinished | true | false | false | false | "Setup in progress" | "Continue payout setup" | No |
| Details submitted, Stripe verifying | true | true | false/varies | false | "Setup in progress" | "Continue payout setup" | No |
| Charges enabled, payouts pending | true | true | true | false | "Setup in progress" | "Continue payout setup" | No |
| Fully enabled | true | true | true | true | "Ready to receive requests" | "Continue payout setup" (still re-clickable, lets owner re-enter Stripe to update details) | Yes |

**No explicit "restricted"/"rejected"/"disabled" state is surfaced** — Stripe accounts can enter `requirements.disabled_reason` states (e.g. rejected for fraud, requirements past due) that show identically to a simply-incomplete account ("Setup in progress"/"Continue payout setup"), with no indication of whether Stripe flagged something requiring vendor action vs. normal in-progress verification.

**Dead ends or gaps:**
- **The only entry point into this page from elsewhere in the app is the one-time vendor-signup success link.** After that, nothing links here again (see gap under `/partner`). A vendor who doesn't finish onboarding in one sitting has no discoverable way back — significant for a real-money flow.
- `onboarding=refresh` is a genuine dead end: no "your session expired, click to restart" messaging, no auto-regenerated Account Link.
- `syncPayoutStatusOnReturn()` failures fully swallowed — no error banner if sync fails after a possibly-successful Stripe onboarding; vendor just sees stale status.
- Orphaned Stripe account risk if the linking RPC fails after account creation — clicking "Set up payouts" again creates a *second* Stripe account (lookup found nothing), no dedup/reconciliation visible.
- "12% platform fee" is static informational copy on this page with no cross-check against the actual persisted `platform_fee_cents` per request.

## /partner/requests/[requestId]
**Purpose:** Full detail/history for one vendor request — same respond/proof actions as the list page, plus status timeline and event history log.
**Auth:** Same `PartnerBoundary` gate, additionally scoped per-request via RLS to the caller's `partner_organization_id`. Not found in the vendor's own scoped list (wrong org, typo, or a funeral-home user navigating here) → same generic `Closed` fallback — **no distinction between "doesn't exist" and "not yours,"** by design (avoids leaking existence of other orgs' requests).

**Every interactive element:**
- "← Requests" (link) → `/partner`.
- Status timeline (Respond/Approval/Deliver/Verified) — display only.
- `status === 'sent'`: `RespondToRequestForm` — identical to `/partner` list page.
- `status === 'quoted'`: static receipt — "Quote sent: {amount}" / "Work begins once the funeral home approves and payment is captured. You'll see this move to 'in progress' automatically."
- `status === 'in_progress'`: `SubmitDeliveryProofForm` — "What was delivered" (required textarea, ≤2000), "Supporting reference" (optional, ≤240, explicit warning against passwords/access codes/account numbers), static disclaimer "This does not mark the request complete. A director authorized for this case reviews it next." Submit "Submit delivery proof" ("Submitting…") → `submitPartnerRequestProof` → RPC `submit_partner_request_proof_idempotent`.
  - Validation failure → "Review the delivery proof fields. Nothing changed."
  - Not authorized → "This request is not available to your account. Nothing changed."
  - No client → "We could not open this request right now. Nothing changed. Try again."
  - RPC `42501`/`28000` → denied, same as above.
  - RPC `40001` → "This request changed before your proof was saved. Reload the current request."
  - RPC `55000` (not in_progress) → "Only accepted, in-progress work can receive delivery proof. Reload the current request."
  - Other error → "Passage could not save this proof. Nothing changed."
  - Missing receipt → "We could not confirm your proof was saved. Reload before trying again."
  - On any non-success: two recovery links appear — "Reload current request" and "Return to requests."
  - Success → replayed: "This delivery proof was already saved."; new: "Delivery proof submitted for director review." Focus programmatically moved to result banner.
- `status === 'proof_submitted'`: static receipt (summary, optional reference, submitted timestamp, "waiting for director review"). No button.
- `status === 'verified'`: static receipt — proof summary; payout line "You were paid {amount}" (if released) or "{amount} is being released to you" (if not), plus "(platform fee {amount} deducted)"; verified timestamp. No button, no receipt/invoice download link.
- `status === 'declined'`: static receipt — decline reason (vendor's own earlier text) + timestamp. No button.
- History section — read-only reverse-chronological `partner_request_events` list via `eventLabel()` mapping (Request sent / Quote sent / Quote declined by director / Payment captured — approved / Declined / Delivery proof submitted / Verified by director / Payment released to you); unmapped names fall back to raw event name string. "No history yet." if empty.
- `Closed()` fallback: "This request is not available to your account." / "Nothing changed, and no request details were shown." + "Return to requests" link.
- AppFrame chrome: same nav/Sign-out.

**Dead ends or gaps:**
- No way to view/download delivery proof beyond plain text — `proof_reference` rendered as raw `<p>` text, not a clickable link/image even if it was meant to reference something.
- Once `verified`, no link to any payment/payout receipt/ledger — amount+fee shown once inline, no historical view across multiple verified requests.
- Same category-label mismatch as `/partner` affects this page's category header line and "Category" fact row.
- `Closed()` conflates "not found" and "not yours" by design — reasonable for privacy, but a vendor who loses/fat-fingers a bookmarked URL gets the same generic message as being blocked from another org's request.
