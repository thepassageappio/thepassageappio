# Hard-bar string scrub — external UI (Milestone 1 P0)

**Owner:** Product Designer  
**Implementer:** Engineering  
**Date:** 2026-09-15  
**Hard bar (Steve):** No AI fluff. No AI-sounding verbiage. A five-year-old must understand and be able to use it.  
**Also follow:** `docs/PLAIN-LANGUAGE-STANDARD.md`

Replace strings **exactly** as listed unless Legal/binding text is noted. Do not invent smoother synonyms.

## `/start` (evaluation entry)

| Current | Replace with | Notes |
| --- | --- | --- |
| Title / H1: “Create your evaluation workspace” | “Try Passage with sample details” | Concrete offer |
| Eyebrow: “TRY PASSAGE AUTHORITY” | “TRY WITH SAMPLE DETAILS” | Drop brand shout |
| “Explore up to five sample authority requests over 10 days. No card is required, and the clock starts only when you send the first request.” | “You can try up to five practice requests in 10 days. You do not need a card. The 10 days start when you send the first request.” | “authority requests” → “practice requests” |
| Button: “Send me a one-time email link” | “Email me a sign-in link” | Same action, shorter |
| “Use the email address your organization will recognize.” | “Use your work email so your bank team can find you.” | Who / why |
| “By continuing, you acknowledge the privacy notice. Use only approved sample information during this evaluation.” | “By continuing, you agree to the privacy notice. Use only made-up sample details. Do not use real customer information.” | Keep privacy link |
| “When you create a workspace, you become its owner. Set up an authenticator app to protect your account. It gives you a code to enter when you sign in.” | **Split after email:** do not show MFA sentence on this screen. After first sign-in: “Next, protect your sign-in. Install an authenticator app on your phone. It shows a short code when you sign in.” | One step at a time |
| “Want to look around first? View the example.” | “Want to look first? See an example.” | Keep link to `/sample` |
| Page `<title>` “Start an Evaluation” | “Try Passage with sample details” | Match H1 |

## Sign-in intent (`/start?intent=sign-in`)

| Current | Replace with |
| --- | --- |
| “Sign in securely” | “Sign in” |
| “Request a one-time sign-in link using your work email.” | “We will email you a link to sign in. Use your work email.” |
| “Send me a one-time email link” | “Email me a sign-in link” |

## Public jargon still on site (scrub where visible without a plain gloss)

| Term | Prefer | Where seen |
| --- | --- | --- |
| authority request(s) | practice request / request to help with an account | `/start`, marketing |
| evaluation workspace | practice account for your bank team | `/start` |
| authenticator app (alone) | phone app that shows a short code | `/start`, MFA |
| role-bound link | private link for one person’s steps | FAQ / security-adjacent |
| account boundary | which account this covers | FAQ completed-request answer |
| receipt reference | receipt code | receipts / FAQ |
| bounded request | this request only | any public copy |
| institution-isolation | each bank’s data stays separate | security / FAQ |
| key-management | how keys are stored and protected | security “assurance” lists — only with plain sentence |
| signed update messages | signed messages that tell other systems what changed | FAQ integrations |
| activate / activation | send the request | staff UI / FAQ “activate requests” |
| lifecycle | later change (ended, withdrawn, expired) | any external UI |
| entitlement | plan / how many practice requests you have left | org / billing UI |
| scope boundary | what the request covers | tooltips — make always visible |

## FAQ quick fixes (external)

| Current fragment | Replace with |
| --- | --- |
| “account boundary” (completed request FAQ) | “which account this covers” |
| “Staff can prepare and activate requests” | “Staff can prepare and send requests” |
| “Your technical team can review the API and signed update messages.” | “Your technical team can review the API and the signed messages that report what changed.” |

## Do not change (binding / already clear)

- Home hero: “A clear way to ask a bank for help with someone else’s account.”
- Boundary: Passage does not verify identity, approve the POA, grant access, or move money.
- “Accepted with limits” / “Permitted” / “Not included”
- Legal article bodies that are versioned (add plain guides beside them; do not rewrite binding text without version process)

## Acceptance

- QA reads `/start` and FAQ aloud: a child understands what to click next.
- No AI-sounding adjectives (seamless, empower, unlock, reimagine, leverage) introduced.
- MFA mentioned only on the MFA step, not stacked on first form.


## Multi-institution (production)

See `MULTI-INSTITUTION-CLARITY-P0.md` for `/start/multi-institution` and case-badge string tables. Same hard bar; no second vocabulary.
