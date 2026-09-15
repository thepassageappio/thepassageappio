# Multi-institution clarity — P0 (production)

**Owner:** Product Designer  
**Implementer:** Engineering  
**Date:** 2026-09-15  
**Steve decision:** Multi-institution promotes to production (not demo-only). Counsel off plan for now.  
**Hard bar:** Five-year-old words. No AI fluff. Same vocabulary as single-institution — do not invent a second product language.  
**Extends:** `ORIENTATION-CHECKLIST.md`, `HARD-BAR-STRING-SCRUB-2026-09-15.md`, architecture in `docs/USER-INITIATED-MULTI-INSTITUTION-SCOPE-2026-09-13.md`

## Goal

Anyone on a multi-institution path can answer:

1. What am I sending?  
2. To which banks (or institutions)?  
3. Does each bank decide on its own?  
4. Where does **this** bank’s request stand?  
5. Is **this** bank’s answer still current?

Never show one global “approved” for the whole group.

## A. Public wizard — `/start/multi-institution`

### Live strings → hard-bar replacements

| Current (prod/demo) | Replace with |
| --- | --- |
| “Multiple institutions, one request” | “Ask several banks in one go” |
| “Name every institution in one place” | “List every bank or credit union you need to ask” |
| “Submit one shared packet naming up to five institutions.” | “Send one set of details to up to five banks.” |
| Long legal-boundary sentence on first screen | Keep meaning; shorten: “Passage does not decide if a power of attorney is valid. Each bank reviews and decides on its own.” |
| “Your relationship to this request” | “How are you involved?” |
| “I am the representative named in the power of attorney” | “I am the person named to help (the representative)” |
| “I am the account holder, requesting for myself” | “I am the account holder” |
| “Other” | “Someone else” (then ask one plain follow-up later if needed) |
| “We will email you a one-time link to confirm your address before you can name institutions.” | “We will email you a link to confirm your email. Then you can name the banks.” |
| “Continue” | Keep “Continue” |

### Wizard step titles (use these even if steps already exist)

1. **Who you are** — name, email, how involved  
2. **Check your email** — confirm address (no MFA lecture here)  
3. **Who the request is about** — account holder + representative names/emails  
4. **Which banks** — list up to five; search known Passage orgs first  
5. **Shared files** — upload once (POA / ID files as required)  
6. **Check before send** — per bank: what that bank will see; attestation in plain words  
7. **Sent** — “Each bank gets its own request. Each bank answers on its own.”

### Unmatched institution (if UI exposes it)

| Avoid | Use |
| --- | --- |
| unmatched / match_status | “Not on Passage yet” |
| “we're reaching out to X — not yet a Passage institution” | “{Name} is not on Passage yet. We can still note them. A bank on Passage can open a request when they join.” |

Do not imply Passage approved the POA or the bank.

### Attestation (plain)

Prefer: “I say that I am allowed to share these details with the banks I listed. Passage records what I said. It does not check whether I am allowed.”

## B. Requester follow-up view (group status)

If a group dashboard exists or is shipping with prod:

| Column / line | Copy |
| --- | --- |
| Per bank row status | “Waiting on the bank” / “Waiting on {person}” / “Bank answered” / “Not on Passage yet” |
| Decision | That bank’s outcome only |
| Currency | “Current for this bank” / “Later change for this bank” |

Never one badge for the whole list.

## C. Institution case (spawned from multi-inst)

Orientation strip (same five questions as single-inst) **plus** one plain line:

**“This request is one of several banks this family asked. Your bank’s answer is only for your bank.”**

Badge / note next to status (existing `origin_group_id` pattern):

| Avoid | Use |
| --- | --- |
| origin group / spawned / fan-out | “One of several banks” |
| multi-institution submission | “Asked with other banks” |

Chips stay the same three: **Who they are** / **What they may ask for** / **Bank’s answer** — for **this** bank only.

Document-review strip unchanged; copy-on-spawn evidence still “Received” until **this** bank checks it.

## D. Participant links (per spawned case)

Same participant copy as single-institution. Extra one-liner when relevant:

“This link is only for {Bank name}. Other banks have their own links.”

## E. Out of scope for this P0 clarity pack

- New insurer/funeral templates (Phase 2; counsel off plan)  
- Self-serve “claim your case” for unmatched banks (Phase 3)  
- Recreating `PA-F39449782D`

## F. QA acceptance

- Wizard uses only words from this table (or simpler).  
- Institution case shows independent-decision line.  
- No screen shows one approval for all banks.  
- Currency and chips are per bank.
